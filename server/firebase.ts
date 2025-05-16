import admin from 'firebase-admin';
import { log } from './vite';

// Initialize Firebase Admin SDK
// This allows server-side verification of Firebase Auth tokens
try {
  // Check if already initialized to prevent multiple initializations
  if (!admin.apps.length) {
    admin.initializeApp({
      // Using application default credentials
      // No need for explicit credentials in most hosting environments
      credential: admin.credential.applicationDefault(),
    });
    log('Firebase Admin initialized');
  } else {
    log('Firebase Admin already initialized');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export { admin };

// Helper functions for Firebase auth
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      decodedToken
    };
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return {
      success: false,
      error
    };
  }
};