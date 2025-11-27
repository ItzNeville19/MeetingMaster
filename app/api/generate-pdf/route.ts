import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { generateCompliancePDF } from '@/lib/pdf-generator';

// Generate PDF from analysis data (without Firebase storage)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysis, fileName } = await request.json();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis data required' }, { status: 400 });
    }

    // Fetch user's branding settings
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;
    const branding = metadata.branding || {};

    // Generate PDF with branding
    const pdfBuffer = await generateCompliancePDF(analysis, {
      reportTitle: `Compliance Report - ${fileName || 'Document'}`,
      includeBoilerplate: true,
      branding: {
        companyName: branding.companyName || undefined,
        logoUrl: branding.logoUrl || undefined,
        primaryColor: branding.primaryColor || undefined,
      },
    });

    // Return PDF as base64 for client-side download
    return NextResponse.json({
      success: true,
      pdf: pdfBuffer.toString('base64'),
      fileName: `${fileName || 'compliance-report'}.pdf`,
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

