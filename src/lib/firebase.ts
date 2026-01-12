import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
  // Add these settings to improve network connectivity and timeout handling
  connectTimeoutMS: 20000, // 20 seconds
  retryMaxAttempts: 3,
};

// Log configuration for debugging (without sensitive data)
console.log('Firebase configuration:', {
  hasApiKey: Boolean(firebaseConfig.apiKey),
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  hasAppId: Boolean(firebaseConfig.appId)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Authentication setup
export const auth = getAuth(app);

export default app;