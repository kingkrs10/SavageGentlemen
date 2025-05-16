import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Firebase production configuration with essential settings
 * We need to use the correct authDomain that matches what's in 
 * the authorized domains list in Firebase console
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use savgent.replit.app as it's already in your authorized domains
  // This is critical for authentication to work
  authDomain: "savgent.replit.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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