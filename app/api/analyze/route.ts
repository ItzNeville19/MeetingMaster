import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { extractText, extractTextFromBase64 } from '@/lib/ocr';
import { analyzeCompliance } from '@/agents/complianceAgent';
import { saveReportToFirestore } from '@/lib/firestore-rest';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fileUrl, fileName, fileId } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Extract text using OCR (20-50% progress)
    console.log('Extracting text from:', fileUrl);
    
    let ocrResult;
    
    // Progress callback for PDF conversion
    const progressCallback = (progress: number, message: string) => {
      // Map PDF conversion progress (0-100) to overall progress (20-50%)
      const overallProgress = 20 + (progress * 0.3);
      console.log(`[Progress ${overallProgress.toFixed(1)}%] ${message}`);
    };
    
    // Check if it's a data URL (base64)
    if (fileUrl.startsWith('data:')) {
      // Extract mime type and base64 data from data URL
      const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Check if it's a supported type (images or PDFs)
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!supportedTypes.includes(mimeType.toLowerCase())) {
          return NextResponse.json(
            { error: `Unsupported file type: ${mimeType}. Supported types: ${supportedTypes.join(', ')}` },
            { status: 400 }
          );
        }
        
        // For PDFs, use extractText with progress callback; for images, use extractTextFromBase64
        if (mimeType === 'application/pdf') {
          // Pass progress callback for PDF conversion
          ocrResult = await extractText(fileUrl, progressCallback);
        } else {
          ocrResult = await extractTextFromBase64(base64Data, mimeType);
        }
      } else {
        throw new Error('Invalid data URL format');
      }
    } else {
      // Regular URL (HTTP/HTTPS/GCS)
      ocrResult = await extractText(fileUrl, progressCallback);
    }

    // Lower threshold for PDFs - they might have less text initially
    const isPdf = fileUrl.includes('application/pdf');
    const minLength = isPdf ? 20 : 50;
    
    if (!ocrResult.text || ocrResult.text.trim().length < minLength) {
      return NextResponse.json(
        { 
          error: 'Could not extract sufficient text from the document. ' +
                 'If this is a scanned PDF, please try converting it to images first. ' +
                 'Or use our "Build from Scratch" feature to create compliance documents if you don\'t have existing documents.'
        },
        { status: 400 }
      );
    }

    console.log(`Extracted ${ocrResult.text.split(/\s+/).length} words with ${(ocrResult.confidence * 100).toFixed(1)}% confidence`);

    // Step 2: Analyze text with compliance agent
    console.log('Running compliance analysis...');
    const analysis = await analyzeCompliance(ocrResult.text);

    // Step 3: Save report to Firestore
    const reportId = fileId || uuidv4();
    try {
      await saveReportToFirestore(reportId, {
        id: reportId,
        userId,
      fileName: fileName || 'Untitled Document',
      fileUrl,
      analysis,
        createdAt: new Date().toISOString(),
    });
    console.log('Report saved with ID:', reportId);
    } catch (firestoreError) {
      console.error('Firestore save error in analyze:', firestoreError);
      // Still return the analysis even if Firestore save fails
      // The client can store it in sessionStorage as fallback
      return NextResponse.json({
        success: true,
        reportId,
        analysis,
        ocr: {
          confidence: ocrResult.confidence,
          pageCount: ocrResult.pageCount,
          wordCount: ocrResult.text.split(/\s+/).length,
        },
        warning: 'Analysis completed but could not be saved to database. It will be available in this session only.',
        firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      success: true,
      reportId,
      analysis,
      ocr: {
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount,
        wordCount: ocrResult.text.split(/\s+/).length,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze document' },
      { status: 500 }
    );
  }
}

// Also support direct text analysis (for testing or API usage)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, fileName } = body;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Text must be at least 50 characters' },
        { status: 400 }
      );
    }

    // Analyze the provided text directly
    const analysis = await analyzeCompliance(text);

    // Save report
    const reportId = uuidv4();
    await saveReportToFirestore(reportId, {
      id: reportId,
      userId,
      fileName: fileName || 'Direct Text Analysis',
      fileUrl: '',
      analysis,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reportId,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze text' },
      { status: 500 }
    );
  }
}
