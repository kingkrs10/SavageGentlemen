
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
    // Skip if already initialized
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        // Next.js Server Side Initialization
        // In production, you would typically use service account credentials
        // For now, we attempt default initialization which works in environments with GOOGLE_APPLICATION_CREDENTIALS
        // or when running on Google Cloud. For local dev, we can use a simpler approach if needed.
        return admin.initializeApp();
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        return null;
    }
};

export const firebaseAdmin = initializeFirebaseAdmin();

export const verifyFirebaseToken = async (idToken: string) => {
    try {
        if (!firebaseAdmin) {
            throw new Error('Firebase Admin not initialized');
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return {
            success: true,
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
        };
    } catch (error) {
        console.error('Firebase token verification error:', error);
        return {
            success: false,
            error
        };
    }
};
