import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getReportFromSupabase } from '@/lib/supabase';
import { getReportFromFirestore } from '@/lib/firestore-rest';
import { generateCompliancePDF } from '@/lib/pdf-generator';

// GET report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PRIMARY: Try Supabase first
    let report = await getReportFromSupabase(id, userId);
    
    // BACKUP: If not found in Supabase, try Firestore
    if (!report) {
      report = await getReportFromFirestore(id);
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// Generate PDF for report (returns PDF directly, no storage needed)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PRIMARY: Try Supabase first
    let report = await getReportFromSupabase(id, userId);
    
    // BACKUP: If not found in Supabase, try Firestore
    if (!report) {
      report = await getReportFromFirestore(id);
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate PDF on demand
    const pdfBuffer = await generateCompliancePDF(report.analysis, {
      reportTitle: `Compliance Report - ${report.fileName}`,
      includeBoilerplate: true,
    });

    // Convert to base64 for JSON response
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({ 
      success: true, 
      pdfBase64,
      fileName: `compliance-report-${id}.pdf`,
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

// Download PDF directly
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // PRIMARY: Try Supabase first
    let report = await getReportFromSupabase(id, userId);
    
    // BACKUP: If not found in Supabase, try Firestore
    if (!report) {
      report = await getReportFromFirestore(id);
    }

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    if (report.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const pdfBuffer = await generateCompliancePDF(report.analysis, {
      reportTitle: `Compliance Report - ${report.fileName}`,
      includeBoilerplate: true,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF download error:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
