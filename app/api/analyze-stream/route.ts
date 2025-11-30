import { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { extractText, extractTextFromBase64 } from '@/lib/ocr';
import { analyzeCompliance } from '@/agents/complianceAgent';
import { saveReportToFirestore } from '@/lib/firestore-rest';
import { saveReport } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { getTierLimits, canUpload, type SubscriptionTier } from '@/lib/subscription';

// Helper to send progress updates via streaming
function sendProgress(controller: ReadableStreamDefaultController, progress: number, message: string) {
  const data = JSON.stringify({ type: 'progress', progress, message }) + '\n';
  try {
    controller.enqueue(new TextEncoder().encode(data));
  } catch (e) {
    // Stream may be closed, ignore
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check upload limits BEFORE processing
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;
    const subscription = metadata?.subscription as { tier?: string; uploadsUsed?: number } | undefined;
    const tier = (subscription?.tier || 'free') as SubscriptionTier;
    const uploadsUsed = subscription?.uploadsUsed || 0;
    
    // Get limits from subscription.ts
    const limits = getTierLimits(tier);
    const maxUploads = limits.uploadsPerMonth === -1 ? Infinity : limits.uploadsPerMonth;
    
    if (!canUpload(tier, uploadsUsed)) {
      return new Response(JSON.stringify({ 
        error: `You've reached your ${maxUploads} analysis limit for this month. Upgrade to continue.`,
        limitReached: true,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (limitError) {
    console.warn('[AnalyzeStream] Error checking upload limits, continuing:', limitError);
    // Continue if limit check fails - don't block analysis
  }

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { fileUrl, fileName, fileId } = body;

        if (!fileUrl) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: 'File URL is required' }) + '\n'));
          controller.close();
          return;
        }

        // Step 1: Extract text using OCR (0-40% progress)
        sendProgress(controller, 5, 'Preparing document...');
        
        let ocrResult;
        const progressCallback = (progress: number, message: string) => {
          // Map OCR progress (0-100) to overall progress (5-40%)
          const overallProgress = 5 + (progress * 0.35);
          sendProgress(controller, overallProgress, message);
        };
        
        // Check if it's a data URL (base64)
        if (fileUrl.startsWith('data:')) {
          const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!supportedTypes.includes(mimeType.toLowerCase())) {
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
                error: `Unsupported file type: ${mimeType}` 
              }) + '\n'));
              controller.close();
              return;
            }
            
            if (mimeType === 'application/pdf') {
              sendProgress(controller, 10, 'Processing PDF...');
              ocrResult = await extractText(fileUrl, progressCallback);
            } else {
              sendProgress(controller, 10, 'Extracting text from image...');
              ocrResult = await extractTextFromBase64(base64Data, mimeType);
              sendProgress(controller, 40, 'Text extraction complete');
            }
          } else {
            throw new Error('Invalid data URL format');
          }
        } else {
          sendProgress(controller, 10, 'Processing file...');
          ocrResult = await extractText(fileUrl, progressCallback);
        }

        const isPdf = fileUrl.includes('application/pdf');
        const minLength = isPdf ? 20 : 50;
        
        // CRITICAL: Verify we got text and check page count
        if (!ocrResult.text || ocrResult.text.trim().length < minLength) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
            error: `Could not extract sufficient text from the document. Only extracted ${ocrResult.text?.length || 0} characters.` 
          }) + '\n'));
          controller.close();
          return;
        }

        // CRITICAL: Warn if multi-page PDF but only 1 page processed
        const wordCount = ocrResult.text.split(/\s+/).length;
        if (isPdf && ocrResult.pageCount && ocrResult.pageCount > 1) {
          const avgWordsPerPage = wordCount / ocrResult.pageCount;
          if (avgWordsPerPage < 20) {
            console.warn(`[Analysis] ⚠️ WARNING: PDF has ${ocrResult.pageCount} pages but only ${wordCount} words extracted (${avgWordsPerPage.toFixed(1)} words/page). Some pages may not have been processed.`);
            sendProgress(controller, 40, `⚠️ WARNING: PDF has ${ocrResult.pageCount} pages but limited text extracted. Processing what we have...`);
          } else {
            sendProgress(controller, 40, `✅ Extracted ${wordCount} words from all ${ocrResult.pageCount} pages. Starting compliance analysis...`);
          }
        } else {
          sendProgress(controller, 40, `Extracted ${wordCount} words. Starting compliance analysis...`);
        }

        // Step 2: Analyze text with compliance agent (40-90% progress)
        // CRITICAL: Include page count info in analysis so AI knows how many pages were processed
        const analysisPrompt = ocrResult.pageCount > 1 
          ? `IMPORTANT: This document has ${ocrResult.pageCount} pages. Analyze ALL pages, not just the first one.\n\n${ocrResult.text}`
          : ocrResult.text;
        
        sendProgress(controller, 45, `Analyzing compliance risks from ${ocrResult.pageCount || 1} page(s)...`);
        const analysis = await analyzeCompliance(analysisPrompt);
        sendProgress(controller, 90, 'Analysis complete. Saving report...');

        // Step 3: Save report to Firestore (90-95% progress)
        const reportId = fileId || uuidv4();
        let reportSaved = false;
        try {
          const reportData = {
            id: reportId,
            userId,
            fileName: fileName || 'Untitled Document',
            fileUrl,
            analysis,
            createdAt: new Date(),
          };

          if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
            await saveReport(userId, reportData);
            reportSaved = true;
            console.log(`[AnalyzeStream] Report saved using Admin SDK: ${reportId} for user ${userId}`);
          } else {
            await saveReportToFirestore(reportId, { ...reportData, createdAt: reportData.createdAt.toISOString() });
            reportSaved = true;
            console.log(`[AnalyzeStream] Report saved using REST API: ${reportId} for user ${userId}`);
          }
          
          sendProgress(controller, 95, 'Report saved successfully');
        } catch (firestoreError) {
          console.error('[AnalyzeStream] Firestore save error:', firestoreError);
          sendProgress(controller, 95, 'Report generated (saving to database failed - check console)');
          // Still continue - the report data will be in the response
        }

        // Step 4: Send final result (100%)
        sendProgress(controller, 100, 'Complete!');
        controller.enqueue(new TextEncoder().encode(JSON.stringify({
          type: 'complete',
          success: true,
          reportId,
          analysis,
          ocr: {
            confidence: ocrResult.confidence,
            pageCount: ocrResult.pageCount,
            wordCount: ocrResult.text.split(/\s+/).length,
          },
        }) + '\n'));
        
        controller.close();
      } catch (error) {
        console.error('Analysis error:', error);
        controller.enqueue(new TextEncoder().encode(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Failed to analyze document',
        }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

