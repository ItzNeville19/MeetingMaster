import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getReport, updateReportPdf } from '@/lib/firebase-admin';
import { generateCompliancePDF } from '@/lib/pdf-generator';
import { adminStorage } from '@/lib/firebase-admin';

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

    const report = await getReport(id);

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

// Generate PDF for report
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

    const report = await getReport(id);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (report.pdfUrl) {
      return NextResponse.json({ success: true, pdfUrl: report.pdfUrl, cached: true });
    }

    const pdfBuffer = await generateCompliancePDF(report.analysis, {
      reportTitle: `Compliance Report - ${report.fileName}`,
      includeBoilerplate: true,
    });

    const pdfPath = `reports/${userId}/${id}.pdf`;
    const bucket = adminStorage().bucket();
    const fileRef = bucket.file(pdfPath);

    await fileRef.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: { reportId: id, generatedAt: new Date().toISOString() },
      },
    });

    await fileRef.makePublic();
    const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${pdfPath}`;
    await updateReportPdf(id, pdfUrl);

    return NextResponse.json({ success: true, pdfUrl, cached: false });
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

    const report = await getReport(id);

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
