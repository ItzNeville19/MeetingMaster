import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await request.json();

    // Get current user metadata
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as {
      reports?: any[];
      subscription?: { tier?: string; uploadsUsed?: number };
      settings?: { alerts?: { enabled?: boolean; riskThreshold?: number; email?: boolean } };
      alertHistory?: any[];
    };

    const existingReports = currentMetadata.reports || [];
    const subscription = currentMetadata.subscription || { tier: 'free', uploadsUsed: 0 };
    const alertSettings = currentMetadata.settings?.alerts;

    // Add new report
    const updatedReports = [report, ...existingReports].slice(0, 100); // Keep last 100 reports

    // Increment uploads used
    const updatedSubscription = {
      ...subscription,
      uploadsUsed: (subscription.uploadsUsed || 0) + 1,
    };

    // Check if we should trigger an alert
    let alertTriggered = false;
    let alertInfo = null;
    const riskScore = report.analysis?.overallRiskScore || 0;
    
    if (
      subscription.tier === 'pro' &&
      alertSettings?.enabled &&
      riskScore >= (alertSettings.riskThreshold || 7)
    ) {
      alertTriggered = true;
      alertInfo = {
        type: 'high_risk',
        sentAt: new Date().toISOString(),
        subject: `🚨 [LifeØS ALERT] High Risk Detected: ${riskScore}/10`,
        reportId: report.id,
        fileName: report.fileName,
        riskScore,
      };
    }

    // Build updated metadata
    const updatedMetadata: any = {
      ...currentMetadata,
      reports: updatedReports,
      subscription: updatedSubscription,
    };

    // Add alert to history if triggered
    if (alertTriggered && alertInfo) {
      const alertHistory = currentMetadata.alertHistory || [];
      updatedMetadata.alertHistory = [alertInfo, ...alertHistory].slice(0, 50);
    }

    // Update user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      alertTriggered,
      alertInfo,
    });
  } catch (error) {
    console.error('Save report error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
