// Firestore REST API client - works without Admin SDK credentials
// Uses the public API key (safe for server-side with Clerk auth validation)

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Validate environment variables
if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
  console.warn('Firebase environment variables not set. Firestore operations will fail.');
  console.warn('Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_API_KEY');
}

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Helper to convert JS object to Firestore document format
function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

// Helper to convert Firestore document format to JS object
function fromFirestoreValue(value: any): any {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    const obj: Record<string, any> = {};
    const fields = value.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

// Convert full Firestore document to JS object
function fromFirestoreDocument(doc: any): any {
  const obj: Record<string, any> = {};
  const fields = doc.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  // Extract document ID from name
  if (doc.name) {
    const parts = doc.name.split('/');
    obj.id = parts[parts.length - 1];
  }
  return obj;
}

// Save a report to Firestore
export async function saveReportToFirestore(
  reportId: string,
  reportData: Record<string, any>
): Promise<void> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    throw new Error('Firebase configuration missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY environment variables.');
  }

  // Try Firebase Admin SDK first (bypasses security rules)
  try {
    const { getAdminApp } = await import('./firebase-admin');
    const adminApp = getAdminApp();
    const adminDb = await import('firebase-admin/firestore').then(m => m.getFirestore(adminApp));
    
    await adminDb.collection('reports').doc(reportId).set(reportData, { merge: true });
    console.log('Report saved using Admin SDK');
    return;
  } catch (adminError: any) {
    // If Admin SDK fails (no credentials), fall back to REST API
    if (adminError.message?.includes('not configured') || adminError.message?.includes('credentials')) {
      console.log('Admin SDK not available, using REST API');
    } else {
      console.error('Admin SDK error:', adminError);
      // Still try REST API as fallback
    }
  }

  // Fallback to REST API
  const url = `${FIRESTORE_BASE_URL}/reports/${reportId}?key=${FIREBASE_API_KEY}`;
  
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(reportData)) {
    fields[key] = toFirestoreValue(value);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to save report: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      console.error('Firestore save error details:', errorData);
    } catch (e) {
      const errorText = await response.text();
      console.error('Firestore save error (text):', errorText);
      errorMessage = errorText || errorMessage;
    }
    
    // If 403, provide more helpful error message
    if (response.status === 403) {
      throw new Error(`Firestore permission denied (403). This usually means Firestore security rules are blocking the write. Solutions: 1) Configure Firebase Admin SDK credentials (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) to bypass security rules, or 2) Update your Firestore security rules to allow writes to the 'reports' collection. Error: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }
}

// Save privacy agreement to Firestore for legal records
export async function savePrivacyAgreementToFirestore(
  agreementId: string,
  agreementData: Record<string, any>
): Promise<void> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    throw new Error('Firebase configuration missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY environment variables.');
  }

  // Try Firebase Admin SDK first (bypasses security rules)
  try {
    const { getAdminApp } = await import('./firebase-admin');
    const adminApp = getAdminApp();
    const adminDb = await import('firebase-admin/firestore').then(m => m.getFirestore(adminApp));
    
    await adminDb.collection('privacyAgreements').doc(agreementId).set(agreementData, { merge: true });
    console.log('Privacy agreement saved using Admin SDK');
    return;
  } catch (adminError: any) {
    // If Admin SDK fails (no credentials), fall back to REST API
    if (adminError.message?.includes('not configured') || adminError.message?.includes('credentials')) {
      console.log('Admin SDK not available, using REST API for privacy agreements');
    } else {
      console.error('Admin SDK error:', adminError);
      // Still try REST API as fallback
    }
  }

  // Fallback to REST API
  const url = `${FIRESTORE_BASE_URL}/privacyAgreements/${agreementId}?key=${FIREBASE_API_KEY}`;
  
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(agreementData)) {
    fields[key] = toFirestoreValue(value);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to save privacy agreement: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      console.error('Firestore save error details:', errorData);
    } catch (e) {
      const errorText = await response.text();
      console.error('Firestore save error (text):', errorText);
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
}

// Get all reports for a user from Firestore
export async function getReportsFromFirestore(userId: string): Promise<any[]> {
  const url = `${FIRESTORE_BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`;
  
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'reports' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'userId' },
          op: 'EQUAL',
          value: { stringValue: userId },
        },
      },
      orderBy: [
        {
          field: { fieldPath: 'createdAt' },
          direction: 'DESCENDING',
        },
      ],
      limit: 100,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore query error:', error);
    throw new Error(`Failed to get reports: ${response.status}`);
  }

  const results = await response.json();
  
  // Filter out empty results and convert to JS objects
  const reports = results
    .filter((result: any) => result.document)
    .map((result: any) => fromFirestoreDocument(result.document));

  return reports;
}

// Get a single report by ID
export async function getReportFromFirestore(reportId: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE_URL}/reports/${reportId}?key=${FIREBASE_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore get error:', error);
    throw new Error(`Failed to get report: ${response.status}`);
  }

  const doc = await response.json();
  return fromFirestoreDocument(doc);
}

// Delete a report
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  const url = `${FIRESTORE_BASE_URL}/reports/${reportId}?key=${FIREBASE_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.error('Firestore delete error:', error);
    throw new Error(`Failed to delete report: ${response.status}`);
  }
}

// Save subscription data
export async function saveSubscriptionToFirestore(
  userId: string,
  subscriptionData: Record<string, any>
): Promise<void> {
  const url = `${FIRESTORE_BASE_URL}/subscriptions/${userId}?key=${FIREBASE_API_KEY}`;
  
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(subscriptionData)) {
    fields[key] = toFirestoreValue(value);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore save subscription error:', error);
    throw new Error(`Failed to save subscription: ${response.status}`);
  }
}

// Get subscription for a user
export async function getSubscriptionFromFirestore(userId: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE_URL}/subscriptions/${userId}?key=${FIREBASE_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore get subscription error:', error);
    throw new Error(`Failed to get subscription: ${response.status}`);
  }

  const doc = await response.json();
  return fromFirestoreDocument(doc);
}

// Update subscription fields
export async function updateSubscriptionInFirestore(
  userId: string,
  updates: Record<string, any>
): Promise<void> {
  const url = `${FIRESTORE_BASE_URL}/subscriptions/${userId}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=${Object.keys(updates).join('&updateMask.fieldPaths=')}`;
  
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    fields[key] = toFirestoreValue(value);
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firestore update subscription error:', error);
    throw new Error(`Failed to update subscription: ${response.status}`);
  }
}

