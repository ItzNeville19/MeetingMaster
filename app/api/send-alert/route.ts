import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// This endpoint sends predictive risk alerts
// In production, this would be triggered by:
// 1. A cron job checking for new regulatory changes
// 2. After document analysis if risk exceeds threshold
// 3. Webhook from a regulatory monitoring service
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertType, riskData } = await request.json();

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;
    
    // Check if alerts are enabled
    const alertSettings = metadata.settings?.alerts;
    if (!alertSettings?.enabled) {
      return NextResponse.json({ error: 'Alerts not enabled' }, { status: 400 });
    }

    // Check tier
    const tier = metadata.subscription?.tier || 'free';
    if (tier !== 'pro') {
      return NextResponse.json({ error: 'Pro subscription required for alerts' }, { status: 403 });
    }

    let emailContent;

    if (alertType === 'high_risk') {
      // Alert for high risk score detected
      if (riskData.score < alertSettings.riskThreshold) {
        return NextResponse.json({ 
          success: false, 
          message: `Risk score ${riskData.score} is below threshold ${alertSettings.riskThreshold}` 
        });
      }

      emailContent = {
        to: user.primaryEmailAddress?.emailAddress,
        subject: `🚨 [LifeØS ALERT] High Risk Detected: ${riskData.score}/10`,
        body: `
⚠️ HIGH RISK ALERT
━━━━━━━━━━━━━━━━━━━━━

A high-risk compliance issue has been detected that requires your immediate attention.

📄 Document: ${riskData.fileName || 'Unknown'}
📊 Risk Score: ${riskData.score}/10
⏰ Detected: ${new Date().toLocaleString()}

🔴 TOP RISKS IDENTIFIED:
${riskData.risks?.slice(0, 3).map((r: any, i: number) => 
  `${i + 1}. ${r.title} (Severity: ${r.severity}/10)
   └ ${r.description}`
).join('\n\n') || 'See full report for details'}

💰 POTENTIAL EXPOSURE: ${riskData.potentialFines || 'See report'}

━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED ACTIONS:
1. Review the full analysis immediately
2. Implement the suggested fixes
3. Consider consulting with legal counsel

View full report: ${process.env.NEXT_PUBLIC_APP_URL || 'https://lifeos.app'}/reports/${riskData.reportId}

━━━━━━━━━━━━━━━━━━━━━
This is an automated alert from LifeØS.
You're receiving this because you enabled Predictive Risk Alerts.
Manage settings: ${process.env.NEXT_PUBLIC_APP_URL || 'https://lifeos.app'}/settings

The LifeØS Team
        `.trim(),
      };
    } else if (alertType === 'regulatory_change') {
      // Alert for regulatory changes
      if (!alertSettings.regulatoryChanges) {
        return NextResponse.json({ 
          success: false, 
          message: 'Regulatory change alerts not enabled' 
        });
      }

      emailContent = {
        to: user.primaryEmailAddress?.emailAddress,
        subject: `📋 [LifeØS] Regulatory Update: ${riskData.regulation || 'New Changes'}`,
        body: `
📋 REGULATORY UPDATE ALERT
━━━━━━━━━━━━━━━━━━━━━

A regulatory change has been detected that may affect your compliance status.

📜 Regulation: ${riskData.regulation || 'Multiple regulations'}
🏛️ Agency: ${riskData.agency || 'Federal/State'}
📅 Effective Date: ${riskData.effectiveDate || 'See details'}
⚡ Impact Level: ${riskData.impact || 'Medium'}

SUMMARY:
${riskData.summary || 'New regulatory requirements have been announced that may affect your current compliance documents.'}

POTENTIAL IMPACT TO YOUR DOCUMENTS:
${riskData.affectedDocuments?.length > 0 
  ? riskData.affectedDocuments.map((d: string) => `• ${d}`).join('\n')
  : '• Review all compliance documents\n• Update policies as needed'}

━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED ACTIONS:
1. Review the regulatory changes in detail
2. Re-analyze affected documents with LifeØS
3. Update policies to reflect new requirements
4. Document your compliance efforts

Analyze your documents: ${process.env.NEXT_PUBLIC_APP_URL || 'https://lifeos.app'}/dashboard

━━━━━━━━━━━━━━━━━━━━━
This is an automated alert from LifeØS.
Manage settings: ${process.env.NEXT_PUBLIC_APP_URL || 'https://lifeos.app'}/settings

The LifeØS Team
        `.trim(),
      };
    } else {
      return NextResponse.json({ error: 'Unknown alert type' }, { status: 400 });
    }

    // In production, send via email service
    console.log('🚨 Alert email would be sent:', emailContent);

    // Save alert to history
    const alertHistory = metadata.alertHistory || [];
    alertHistory.unshift({
      type: alertType,
      sentAt: new Date().toISOString(),
      subject: emailContent.subject,
    });

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...metadata,
        alertHistory: alertHistory.slice(0, 50), // Keep last 50 alerts
      },
    });

    return NextResponse.json({ 
      success: true, 
      email: emailContent,
      message: 'Alert prepared. In production, this would be sent via email service.',
    });
  } catch (error) {
    console.error('Send alert error:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}

