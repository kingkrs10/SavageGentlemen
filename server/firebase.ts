import admin from 'firebase-admin';
import { log } from './vite';

// Initialize Firebase Admin SDK in the most flexible way possible to handle Replit environment
const initializeFirebaseAdmin = () => {
  // Skip if already initialized
  if (admin.apps.length > 0) {
    log('Firebase Admin already initialized');
    return;
  }

  try {
    // Initialize with minimal config first (most reliable in different environments)
    admin.initializeApp();
    log('Firebase Admin initialized with default configuration');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    console.error('Will continue without Firebase Admin - authentication will be limited');
  }
};

// Execute initialization
initializeFirebaseAdmin();

export { admin };

// Helper functions for Firebase auth
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    // Check if Firebase Auth is initialized properly
    if (!admin.apps.length || !admin.auth) {
      console.warn('Firebase Auth not available, using fallback authentication');
      return {
        success: false,
        error: new Error('Firebase Auth not available')
      };
    }
    
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