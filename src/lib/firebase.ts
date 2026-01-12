import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

/**
 * Firebase production configuration with essential settings
 * We need to use the correct authDomain that matches what's in 
 * the authorized domains list in Firebase console
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Only log in development or at runtime (not during build)
if (typeof window !== 'undefined') {
  console.log('Firebase configuration:', {
    hasApiKey: Boolean(firebaseConfig.apiKey),
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasAppId: Boolean(firebaseConfig.appId)
  });
}

// Initialize Firebase only if API key is present (prevents build-time errors)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else if (typeof window !== 'undefined') {
  console.warn('Firebase not initialized: missing API key');
}

export { auth };
export default app;