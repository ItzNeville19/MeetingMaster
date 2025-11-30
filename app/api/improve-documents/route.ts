import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveReportToSupabase, getReportFromSupabase } from '@/lib/supabase';
import { getReportFromFirestore } from '@/lib/firestore-rest';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId, currentDocuments, conversationHistory, improvementRequests, isGeneratedDocument, businessInfo } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Fetch the existing report to get full context
    let report = await getReportFromSupabase(reportId, userId);
    if (!report) {
      report = await getReportFromFirestore(reportId);
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Use report's analysis if currentDocuments is not provided or incomplete
    const documentsToImprove = currentDocuments || report.analysis;
    
    if (!documentsToImprove || (!documentsToImprove.generatedDocuments && !documentsToImprove.separateDocuments)) {
      return NextResponse.json({ error: 'Current documents are required' }, { status: 400 });
    }

    // Extract conversation insights
    const conversationInsights = conversationHistory
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => msg.content)
      .join(' | ');

    // Build improvement prompt
    const improvementPrompt = `You are an expert compliance consultant IMPROVING existing compliance documents to be comprehensive and professional.

CRITICAL REQUIREMENTS:
1. Make documents COMPREHENSIVE, DETAILED, and PROFESSIONAL
2. Add MORE detail, MORE sections, MORE policy language - make them LONGER and MORE COMPLETE
3. Ensure EVERY section is fully written out - no outlines, no summaries
4. Use the conversation insights to understand what needs improvement
5. Research and include best practices from established companies
6. Make documents publication-ready and professional

CURRENT DOCUMENTS:
${documentsToImprove.separateDocuments ? 
  Object.entries(documentsToImprove.separateDocuments).map(([name, content]) => 
    `\n========== ${name} ==========\n${content}\n`
  ).join('\n') : 
  documentsToImprove.generatedDocuments || ''
}

IMPROVEMENT REQUESTS:
${improvementRequests || conversationInsights || 'Make these documents more comprehensive, detailed, and professional.'}

CONVERSATION INSIGHTS:
${conversationInsights || 'User wants more comprehensive, detailed documents.'}

BUSINESS CONTEXT:
${businessInfo ? `
- Business Name: ${businessInfo.businessName || 'Not specified'}
- Industry: ${businessInfo.industry || 'Not specified'}
- State: ${businessInfo.state || 'Not specified'}
- Employee Count: ${businessInfo.employeeCount || 'Not specified'}
` : ''}

TASK:
Improve these documents to be:
1. MUCH MORE COMPREHENSIVE - add more sections, more detail
2. MUCH MORE DETAILED - write out every policy fully
3. PROFESSIONAL - high-quality, publication-ready
4. COMPLETE - no missing sections, no placeholders
5. LONG - thousands of words per document, fully written out

Output the improved documents in the same format with separator markers:
========== DOCUMENT NAME ==========
[Complete, improved document content]

Make each document SIGNIFICANTLY better, longer, and more comprehensive.`;

    // Call OpenAI to improve documents
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert compliance consultant specializing in creating high-quality compliance documents.

CRITICAL OUTPUT REQUIREMENTS:
1. Generate COMPLETE, COMPREHENSIVE documents - write every section fully, not outlines
2. Output ONLY the final document text with separator markers: ========== DOCUMENT NAME ==========
3. Make documents SIGNIFICANTLY better, longer, and more detailed than the originals
4. Add more sections, more policy language, more detail
5. Research and include best practices from established companies
6. Make it publication-ready and professional
7. Each document should be thousands of words, fully written out

CRITICAL: Make the documents MUCH BETTER - longer, more comprehensive, more detailed, more professional.`,
          },
          {
            role: 'user',
            content: improvementPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 32000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    let improvedText = openaiData.choices[0]?.message?.content || '';

    // Split improved documents by separator markers
    const documentSeparator = /==========\s+([^=]+)\s+==========/g;
    const improvedDocuments: Record<string, string> = {};
    
    let lastIndex = 0;
    let match;
    let lastDocName = 'Compliance Documents';
    
    while ((match = documentSeparator.exec(improvedText)) !== null) {
      if (lastIndex > 0 || match.index > 0) {
        const docContent = improvedText.substring(lastIndex, match.index).trim();
        if (docContent.length > 100) {
          improvedDocuments[lastDocName] = docContent;
        }
      }
      lastDocName = match[1].trim();
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < improvedText.length) {
      const docContent = improvedText.substring(lastIndex).trim();
      if (docContent.length > 100) {
        improvedDocuments[lastDocName] = docContent;
      }
    }
    
    if (Object.keys(improvedDocuments).length === 0) {
      improvedDocuments['Compliance Documents'] = improvedText;
    }

    // Clean improved documents
    const promptPatterns = [
      /^.*?(?=EMPLOYEE HANDBOOK|SAFETY MANUAL|COMPLIANCE|WELCOME|INTRODUCTION|1\.|#)/i,
      /(?:^|\n)(?:Here is|Below is|I've created|I'll generate|This document|Note:|Important:|Please note:).*?(?=\n\n|\n[A-Z])/gi,
      /\[.*?\]/g,
      /TODO:|FILL IN|REPLACE|INSERT|ADD HERE/gi,
      /(?:^|\n)---.*?---/g,
      /==========\s+[^=]+\s+==========/g,
    ];
    
    for (const docName in improvedDocuments) {
      let docContent = improvedDocuments[docName];
      for (const pattern of promptPatterns) {
        docContent = docContent.replace(pattern, '');
      }
      const contentStart = docContent.search(/(?:EMPLOYEE HANDBOOK|SAFETY MANUAL|COMPLIANCE|WELCOME|INTRODUCTION|^1\.|^#)/i);
      if (contentStart > 0 && contentStart < 200) {
        docContent = docContent.substring(contentStart);
      }
      docContent = docContent.replace(/^(?:\s|[\-\*])*(?:You are|Generate|Create|Write|Output|Here|Below).*?\n/gi, '');
      improvedDocuments[docName] = docContent.trim();
    }

    const combinedImproved = Object.values(improvedDocuments).join('\n\n==========\n\n');

    // Update the report with improved documents
    const updatedAnalysis = {
      ...report.analysis,
      ...documentsToImprove,
      generatedDocuments: combinedImproved,
      separateDocuments: improvedDocuments,
      isGeneratedDocument: isGeneratedDocument !== undefined ? isGeneratedDocument : (report.analysis?.isGeneratedDocument || true),
      improvedAt: new Date().toISOString(),
      improvementHistory: [
        ...(report.analysis?.improvementHistory || documentsToImprove.improvementHistory || []),
        {
          date: new Date().toISOString(),
          requests: improvementRequests || conversationInsights,
        },
      ],
    };

    // Save updated report to Supabase (primary)
    try {
      const saveSuccess = await saveReportToSupabase(userId, {
        id: reportId,
        fileName: report.fileName || 'Improved Compliance Documents',
        fileUrl: report.fileUrl || '',
        analysis: updatedAnalysis,
        createdAt: report.createdAt || new Date().toISOString(),
      });
      
      if (!saveSuccess) {
        console.error('[ImproveDocuments] Failed to save to Supabase');
        throw new Error('Failed to save improved report to database');
      }
      
      console.log('[ImproveDocuments] ✅ Report updated in Supabase:', reportId);
    } catch (saveError) {
      console.error('[ImproveDocuments] Failed to save improved report:', saveError);
      throw saveError; // Don't continue if save fails - we need the update to persist
    }

    return NextResponse.json({
      success: true,
      reportId,
      analysis: updatedAnalysis,
      improvedDocuments,
      improvedText: combinedImproved,
    });
  } catch (error) {
    console.error('Improve documents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to improve documents' },
      { status: 500 }
    );
  }
}

