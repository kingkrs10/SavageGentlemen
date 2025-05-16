import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase production configuration with essential settings
 * The authDomain must be the Firebase-provided domain to ensure
 * proper OAuth redirect handling in all environments including production
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

// Production-optimized Google provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for production use
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Force re-authorization even if already signed in
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;