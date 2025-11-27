import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// This endpoint sends a compliance digest email
// In production, integrate with an email service like Resend, SendGrid, or AWS SES
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;
    
    // Check if digest is enabled
    const digestSettings = metadata.settings?.digest;
    if (!digestSettings?.enabled) {
      return NextResponse.json({ error: 'Digest not enabled' }, { status: 400 });
    }

    // Get user's reports from metadata
    const reports = metadata.reports || [];
    const recentReports = reports.slice(0, 5);
    
    // Calculate stats
    const totalReports = reports.length;
    const avgRiskScore = reports.length > 0 
      ? (reports.reduce((sum: number, r: any) => sum + (r.analysis?.overallRiskScore || 0), 0) / reports.length).toFixed(1)
      : 0;
    const highRiskCount = reports.filter((r: any) => (r.analysis?.overallRiskScore || 0) >= 7).length;
    const totalRisks = reports.reduce((sum: number, r: any) => sum + (r.analysis?.risks?.length || 0), 0);

    // Build email content
    const emailContent = {
      to: digestSettings.email || user.primaryEmailAddress?.emailAddress,
      subject: `[LifeØS] Your ${digestSettings.frequency} Compliance Digest`,
      body: `
Hi ${user.firstName || 'there'},

Here's your ${digestSettings.frequency} compliance digest from LifeØS:

📊 COMPLIANCE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━
• Total Reports: ${totalReports}
• Average Risk Score: ${avgRiskScore}/10
• High Risk Items: ${highRiskCount}
• Total Risks Identified: ${totalRisks}

📄 RECENT REPORTS
━━━━━━━━━━━━━━━━━━━━━
${recentReports.length > 0 
  ? recentReports.map((r: any, i: number) => 
      `${i + 1}. ${r.fileName} - Score: ${r.analysis?.overallRiskScore || 'N/A'}/10`
    ).join('\n')
  : 'No reports yet. Upload a document to get started!'}

📋 RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━
${highRiskCount > 0 
  ? `• You have ${highRiskCount} high-risk items that need attention
• Review your latest reports and implement the suggested fixes
• Consider scheduling a compliance review with your team`
  : `• Great job! No high-risk items detected
• Continue uploading documents regularly for ongoing monitoring
• Consider upgrading for predictive risk alerts`}

━━━━━━━━━━━━━━━━━━━━━
View your full dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://lifeos.app'}/dashboard

Questions? Reply to this email or contact support@lifeos.app

Best regards,
The LifeØS Team
      `.trim(),
    };

    // In production, send via email service
    // For now, return the email content for the client to handle
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'LifeØS <digest@lifeos.app>',
    //   to: emailContent.to,
    //   subject: emailContent.subject,
    //   text: emailContent.body,
    // });

    // Log for development
    console.log('📧 Digest email would be sent:', emailContent);

    // Save last sent timestamp
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...metadata,
        settings: {
          ...metadata.settings,
          digest: {
            ...digestSettings,
            lastSent: new Date().toISOString(),
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      email: emailContent,
      message: 'Digest prepared. In production, this would be sent via email service.',
    });
  } catch (error) {
    console.error('Send digest error:', error);
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
  }
}

