import admin from 'firebase-admin';
import { log } from './vite';

// Initialize Firebase Admin SDK with project ID
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    log('Firebase Admin already initialized');
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                      process.env.VITE_FIREBASE_PROJECT_ID || 
                      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                      'savagegentlemen-704a0';

    const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || 
                          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                          `${projectId}.firebasestorage.app`;

    admin.initializeApp({
      projectId,
      storageBucket,
    });
    log(`Firebase Admin initialized for project: ${projectId}`);
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