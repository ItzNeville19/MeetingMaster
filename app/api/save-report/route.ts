import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { saveReportToSupabase } from '@/lib/supabase';
import { saveReportToFirestore } from '@/lib/firestore-rest';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await request.json();
    const reportData = {
      ...report,
      userId,
      createdAt: report.createdAt || new Date().toISOString(),
    };

    // PRIMARY: Save to Supabase (optional - if not configured, that's OK)
    let supabaseSuccess = false;
    try {
      supabaseSuccess = await saveReportToSupabase(userId, {
        id: report.id,
        fileName: report.fileName,
        fileUrl: report.fileUrl || '',
        analysis: report.analysis,
        createdAt: reportData.createdAt,
      });
      if (supabaseSuccess) {
        console.log('[SaveReport] ✅ Saved to Supabase (PRIMARY)');
      }
    } catch (supabaseError) {
      console.error('[SaveReport] Supabase error (will try backups):', supabaseError);
      // Supabase might not be configured - that's OK, continue to Firestore
    }

    // BACKUP 1: Save to Firestore (required - this should always work)
    let firestoreSuccess = false;
    let firestoreError: any = null;
    try {
      if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
        const { saveReport } = await import('@/lib/firebase-admin');
        await saveReport(userId, {
          fileName: report.fileName,
          fileUrl: report.fileUrl || '',
          analysis: report.analysis,
          createdAt: new Date(reportData.createdAt),
        });
        firestoreSuccess = true;
        console.log('[SaveReport] ✅ Saved to Firestore Admin SDK (BACKUP 1)');
      } else {
        await saveReportToFirestore(report.id, reportData);
        firestoreSuccess = true;
        console.log('[SaveReport] ✅ Saved to Firestore REST API (BACKUP 1)');
      }
    } catch (firestoreErr) {
      firestoreError = firestoreErr;
      console.error('[SaveReport] ❌ Firestore backup error:', firestoreErr);
      
      // Check if it's a "document already exists" error - that's OK
      const errorMsg = firestoreErr instanceof Error ? firestoreErr.message : String(firestoreErr);
      if (errorMsg.includes('already exists') || errorMsg.includes('ALREADY_EXISTS')) {
        console.log('[SaveReport] ⚠️ Report already exists in Firestore - this is OK');
        firestoreSuccess = true; // Consider this a success
      }
    }

    // If Firestore failed, check if report already exists
    if (!firestoreSuccess) {
      console.error('[SaveReport] ⚠️ WARNING: Could not save to Firestore:', firestoreError);
      
      // Try to check if report already exists (might have been saved by analyze-stream)
      try {
        const { getReportsFromFirestore } = await import('@/lib/firestore-rest');
        const existingReports = await getReportsFromFirestore(userId);
        const reportExists = existingReports.some((r: any) => r.id === report.id);
        
        if (reportExists) {
          console.log('[SaveReport] ✅ Report already exists in Firestore (saved by analyze-stream)');
          firestoreSuccess = true; // Treat as success
        } else {
          console.error('[SaveReport] ❌ Report does not exist in Firestore');
        }
      } catch (checkError) {
        console.error('[SaveReport] Could not check if report exists:', checkError);
      }
      
      // If still not successful, return warning but don't fail
      // The report is already saved in local storage and might be in database
      if (!firestoreSuccess) {
        return NextResponse.json({ 
          success: true, // Still return success - report is in local storage
          reportId: report.id,
          warning: 'Report saved to local storage. Database save failed but report is available.',
          firestoreError: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        });
      }
    }

    // Get current user metadata for subscription tracking
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as {
      subscription?: { tier?: string; uploadsUsed?: number; isOwner?: boolean; isDev?: boolean };
      settings?: { alerts?: { enabled?: boolean; riskThreshold?: number; email?: boolean } };
      alertHistory?: any[];
    };

    const subscription = currentMetadata.subscription || { tier: 'free', uploadsUsed: 0 };
    const alertSettings = currentMetadata.settings?.alerts;
    const isOwner = subscription.isOwner || subscription.isDev;

    // Increment uploads used (but not for owner/dev accounts with unlimited access)
    const updatedSubscription = {
      ...subscription,
      uploadsUsed: isOwner ? (subscription.uploadsUsed || 0) : (subscription.uploadsUsed || 0) + 1,
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

    // Build updated metadata (only subscription & alerts, NOT reports)
    const updatedMetadata: any = {
      ...currentMetadata,
      subscription: updatedSubscription,
    };

    // Add alert to history if triggered
    if (alertTriggered && alertInfo) {
      const alertHistory = currentMetadata.alertHistory || [];
      updatedMetadata.alertHistory = [alertInfo, ...alertHistory].slice(0, 50);
    }

    // Update user metadata (subscription tracking only)
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
