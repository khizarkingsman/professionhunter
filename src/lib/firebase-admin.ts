import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Server-only Firebase Admin SDK singleton.
 * Bypasses Firestore security rules — used exclusively for server-side
 * collections like `rateLimits` and `activeSessions` where client SDK calls
 * would be blocked by the default-deny security rules.
 */
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      '[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY env var is not set. ' +
      'Download it from Firebase Console → Project Settings → Service Accounts.'
    );
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminFirestore() {
  getAdminApp();
  return getFirestore();
}
