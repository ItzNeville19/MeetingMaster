import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
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

