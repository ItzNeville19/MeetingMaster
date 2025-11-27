import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { extractText } from '@/lib/ocr';
import { analyzeCompliance } from '@/agents/complianceAgent';
import { saveReport } from '@/lib/firebase-admin';

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

    // Step 1: Extract text using OCR
    console.log('Extracting text from:', fileUrl);
    const ocrResult = await extractText(fileUrl);

    if (!ocrResult.text || ocrResult.text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the document. Please ensure the document contains readable text.' },
        { status: 400 }
      );
    }

    console.log(`Extracted ${ocrResult.text.split(/\s+/).length} words with ${(ocrResult.confidence * 100).toFixed(1)}% confidence`);

    // Step 2: Analyze text with compliance agent
    console.log('Running compliance analysis...');
    const analysis = await analyzeCompliance(ocrResult.text);

    // Step 3: Save report to Firestore
    const reportId = await saveReport(userId, {
      fileName: fileName || 'Untitled Document',
      fileUrl,
      analysis,
      createdAt: new Date(),
    });

    console.log('Report saved with ID:', reportId);

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
    const reportId = await saveReport(userId, {
      fileName: fileName || 'Direct Text Analysis',
      fileUrl: '',
      analysis,
      createdAt: new Date(),
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
