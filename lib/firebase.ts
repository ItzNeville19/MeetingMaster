import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let storage: FirebaseStorage;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

storage = getStorage(app);
db = getFirestore(app);

export { app, storage, db };

// Upload file to Firebase Storage
export async function uploadFile(
  file: File | Buffer,
  path: string,
  contentType?: string
): Promise<string> {
  const storageRef = ref(storage, path);
  
  let uploadData: Uint8Array;
  let metadata: { contentType?: string } = {};
  
  if (file instanceof File) {
    uploadData = new Uint8Array(await file.arrayBuffer());
    metadata.contentType = file.type;
  } else {
    uploadData = file;
    if (contentType) metadata.contentType = contentType;
  }
  
  await uploadBytes(storageRef, uploadData, metadata);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

// Get download URL for a file
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

