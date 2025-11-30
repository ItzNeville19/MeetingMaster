import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length === 0) {
    // Only initialize if we have the credentials (optional - we use REST API now)
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin credentials not configured. Using REST API instead - this is fine!');
    }
    
    try {
    adminApp = initializeApp({
      credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    } catch (error) {
      throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export const adminStorage = () => getStorage(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());

// Save report to Firestore
export async function saveReport(
  userId: string,
  reportData: {
    fileName: string;
    fileUrl: string;
    analysis: object;
    pdfUrl?: string;
    createdAt: Date;
  }
): Promise<string> {
  const db = adminDb();
  const reportRef = db.collection('reports').doc();
  
  await reportRef.set({
    ...reportData,
    userId,
    id: reportRef.id,
    createdAt: reportData.createdAt.toISOString(),
  });
  
  return reportRef.id;
}

// Get reports for a user
export async function getUserReports(userId: string): Promise<any[]> {
  const db = adminDb();
  const snapshot = await db
    .collection('reports')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get a single report by ID
export async function getReport(reportId: string): Promise<any | null> {
  const db = adminDb();
  const doc = await db.collection('reports').doc(reportId).get();
  
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// Update report with PDF URL
export async function updateReportPdf(reportId: string, pdfUrl: string): Promise<void> {
  const db = adminDb();
  await db.collection('reports').doc(reportId).update({ pdfUrl });
}

// Save privacy agreement to Firestore for legal records
export async function savePrivacyAgreement(
  agreementId: string,
  agreementData: {
    userId: string;
    userEmail: string;
    agreed: boolean;
    agreementDate: string;
    dontShowAgain: boolean;
    ipAddress: string;
    userAgent: string;
    agreementText: string;
    agreementVersion: string;
    createdAt: string;
  }
): Promise<void> {
  const db = adminDb();
  await db.collection('privacyAgreements').doc(agreementId).set({
    ...agreementData,
    id: agreementId,
  });
}

