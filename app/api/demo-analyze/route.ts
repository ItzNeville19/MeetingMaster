import { NextRequest, NextResponse } from 'next/server';
import { generateDemoAnalysis } from '@/lib/demo-analysis';
import { v4 as uuidv4 } from 'uuid';

// Demo analysis endpoint - works without external APIs
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, PNG, JPG, WEBP' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Simulate processing time (2-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Generate demo analysis
    const analysis = generateDemoAnalysis(file.name, file.size);
    const reportId = uuidv4();

    return NextResponse.json({
      success: true,
      reportId,
      fileName: file.name,
      fileSize: file.size,
      analysis,
      ocr: {
        confidence: 0.94 + Math.random() * 0.05,
        pageCount: Math.ceil(file.size / 50000) || 1,
        wordCount: analysis.documentWordCount,
      },
    });
  } catch (error) {
    console.error('Demo analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    );
  }
}

