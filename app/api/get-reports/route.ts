import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getReportsFromSupabase } from '@/lib/supabase';
import { getReportsFromFirestore } from '@/lib/firestore-rest';
import { getUserReports } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PRIMARY: Get reports from Supabase (100% PRIMARY - always try first)
    let reports: any[] = [];
    let supabaseSuccess = false;
    let supabaseError: any = null;
    
    try {
      reports = await getReportsFromSupabase(userId);
      // Supabase worked if no exception was thrown (even if empty array)
      supabaseSuccess = true;
      console.log(`[GetReports] ✅ PRIMARY: Retrieved ${reports.length} reports from Supabase for user ${userId}`);
    } catch (error) {
      supabaseError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[GetReports] ❌ Supabase PRIMARY failed:', errorMsg);
      
      // If it's a "not configured" error, log helpful message
      if (errorMsg.includes('not configured') || errorMsg.includes('Supabase not configured')) {
        console.error('[GetReports] ⚠️ SUPABASE NOT CONFIGURED!');
        console.error('[GetReports] ⚠️ Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
        console.error('[GetReports] ⚠️ See SUPABASE_SETUP_INSTRUCTIONS.md for help');
      }
      supabaseSuccess = false;
    }

    // BACKUP 1: Only try Firestore if Supabase completely failed (exception thrown)
    if (!supabaseSuccess) {
      try {
        let firestoreReports: any[] = [];
      if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
          firestoreReports = await getUserReports(userId);
          console.log(`[GetReports] Retrieved ${firestoreReports.length} reports using Firestore Admin SDK (BACKUP 1)`);
      } else {
          firestoreReports = await getReportsFromFirestore(userId);
          console.log(`[GetReports] Retrieved ${firestoreReports.length} reports using Firestore REST API (BACKUP 1)`);
        }
        
        // Merge with Supabase results (avoid duplicates)
        const reportMap = new Map();
        reports.forEach(r => reportMap.set(r.id, r));
        firestoreReports.forEach(r => {
          if (r.id && !reportMap.has(r.id)) {
            reportMap.set(r.id, r);
          }
        });
        reports = Array.from(reportMap.values());
      } catch (firestoreError) {
        console.error('[GetReports] Firestore backup also failed:', firestoreError);
      }
      }
      
    // Ensure all reports have required fields
      reports = reports.map((r: any) => {
        // Ensure createdAt is a string
        if (r.createdAt && typeof r.createdAt === 'object' && r.createdAt.toISOString) {
          r.createdAt = r.createdAt.toISOString();
        } else if (r.createdAt && typeof r.createdAt !== 'string') {
          r.createdAt = new Date(r.createdAt).toISOString();
        }
        // Ensure fileName exists
        if (!r.fileName && r.id) {
          r.fileName = `Report ${r.id.substring(0, 8)}`;
        }
        return r;
      }).filter((r: any) => r && r.id); // Filter out any invalid reports
      
      console.log(`[GetReports] Processed ${reports.length} valid reports`);

    // Get subscription info from Clerk metadata
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as {
      subscription?: { 
        tier?: string; 
        uploadsUsed?: number;
        isOwner?: boolean;
        isDev?: boolean;
        uploadsLimit?: number;
      };
    };

    const subscription = metadata.subscription || { tier: 'free', uploadsUsed: 0 };
    
    // If owner/dev, ensure unlimited access
    if ((subscription as any).isOwner || (subscription as any).isDev) {
      subscription.tier = 'pro';
      subscription.uploadsLimit = -1; // Unlimited
    }

    return NextResponse.json({
      reports,
      subscription,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json({ error: 'Failed to get reports' }, { status: 500 });
  }
}
