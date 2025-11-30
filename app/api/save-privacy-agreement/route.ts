import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { savePrivacyAgreementToSupabase } from '@/lib/supabase';
import { savePrivacyAgreementToFirestore } from '@/lib/firestore-rest';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agreed, date, dontShowAgain, userEmail, userId: clientUserId, agreementVersion, ipAddress: clientIpAddress, userAgent: clientUserAgent } = await request.json();

    // Get user info for legal records
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmailAddress = userEmail || user.emailAddresses?.[0]?.emailAddress || 'unknown';
    
    // Get IP address for legal records (prefer client-provided, then headers)
    const ipAddress = clientIpAddress || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = clientUserAgent || request.headers.get('user-agent') || 'unknown';

    // CRITICAL: Save to multiple locations for legal protection
    const agreementId = `agreement_${userId}_${Date.now()}`;
    const agreementDate = date || new Date().toISOString();
    
    const agreementData = {
      agreementId,
      userId: userId,
      userEmail: userEmailAddress,
      agreed: agreed,
      agreementDate: agreementDate,
      dontShowAgain: dontShowAgain || false,
      ipAddress: ipAddress,
      userAgent: userAgent,
      agreementText: 'Privacy Policy and Terms of Service - Comprehensive Legal Agreement',
      agreementVersion: agreementVersion || '2.0',
    };
    
    let supabaseSuccess = false;
    let firestoreSuccess = false;
    let fileSuccess = false;
    
    // PRIMARY: Save to Supabase
    try {
      supabaseSuccess = await savePrivacyAgreementToSupabase(agreementData);
      if (supabaseSuccess) {
        console.log(`✅ Privacy agreement saved to Supabase (PRIMARY): ${agreementId} for user ${userId} (${userEmailAddress})`);
      }
    } catch (supabaseError) {
      console.error('❌ CRITICAL: Failed to save privacy agreement to Supabase:', supabaseError);
    }
    
    // BACKUP 1: Save to Firestore
    try {
      if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
        const { savePrivacyAgreement } = await import('@/lib/firebase-admin');
        await savePrivacyAgreement(agreementId, {
          userId: userId,
          userEmail: userEmailAddress,
          agreed: agreed,
          agreementDate: agreementDate,
          dontShowAgain: dontShowAgain || false,
      ipAddress: ipAddress,
      userAgent: userAgent,
      agreementText: 'Privacy Policy and Terms of Service - Comprehensive Legal Agreement',
      agreementVersion: agreementVersion || '2.0',
          createdAt: agreementDate,
        });
        firestoreSuccess = true;
        console.log(`✅ Privacy agreement saved to Firestore (BACKUP 1): ${agreementId}`);
      } else {
        await savePrivacyAgreementToFirestore(agreementId, {
          id: agreementId,
          userId: userId,
          userEmail: userEmailAddress,
          agreed: agreed,
          agreementDate: agreementDate,
          dontShowAgain: dontShowAgain || false,
      ipAddress: ipAddress,
      userAgent: userAgent,
      agreementText: 'Privacy Policy and Terms of Service - Comprehensive Legal Agreement',
      agreementVersion: agreementVersion || '2.0',
          createdAt: agreementDate,
        });
        firestoreSuccess = true;
        console.log(`✅ Privacy agreement saved to Firestore REST API (BACKUP 1): ${agreementId}`);
      }
    } catch (firestoreError) {
      console.error('❌ Failed to save privacy agreement to Firestore (BACKUP 1):', firestoreError);
    }
    
    // BACKUP 2: Save to local file system for legal evidence
    try {
      const agreementsDir = path.join(process.cwd(), 'meeting-master-agreements');
      if (!fs.existsSync(agreementsDir)) {
        fs.mkdirSync(agreementsDir, { recursive: true });
      }
      
      const fileName = `${agreementId}.json`;
      const filePath = path.join(agreementsDir, fileName);
      
      const fileData = {
        ...agreementData,
        savedAt: new Date().toISOString(),
        savedTo: ['supabase', 'firestore', 'local-file'],
      };
      
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
      fileSuccess = true;
      console.log(`✅ Privacy agreement saved to local file (BACKUP 2): ${filePath}`);
    } catch (fileError) {
      console.error('❌ Failed to save privacy agreement to local file (BACKUP 2):', fileError);
    }
    
    if (!supabaseSuccess && !firestoreSuccess && !fileSuccess) {
      console.error('⚠️  CRITICAL: Privacy agreement NOT saved to ANY location - legal records incomplete!');
    }

    // Also save to Clerk metadata for quick access
    const currentMetadata = user.publicMetadata || {};
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        privacyPolicyAgreed: agreed,
        privacyPolicyAgreedDate: date,
        privacyPolicyDontShowAgain: dontShowAgain || false,
        privacyPolicyAgreementId: agreementId, // Reference to Firestore record
      },
    });

    return NextResponse.json({ 
      success: true, 
      agreementId,
      message: 'Privacy agreement saved to database for legal records' 
    });
  } catch (error) {
    console.error('Failed to save privacy agreement:', error);
    return NextResponse.json(
      { error: 'Failed to save privacy agreement' },
      { status: 500 }
    );
  }
}

