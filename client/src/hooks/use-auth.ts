import { useState, useEffect } from 'react';
import { 
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  UserCredential,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

export type AuthProviderType = 'google';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Verify with our backend and get user info
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            // If backend verification fails, sign out from Firebase
            await firebaseSignOut(auth);
            setCurrentUser(null);
            setError('Authentication failed on server');
          }
        } catch (err) {
          console.error('Error verifying user with backend:', err);
          setError('Failed to authenticate user');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google - production ready version with fallback
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google authentication process...');
      
      // Log Firebase configuration to help with debugging
      console.log('Firebase auth instance state:', {
        currentUser: auth.currentUser?.uid ? 'Logged in' : 'No user',
        authDomain: auth.config?.authDomain || 'Not set',
        providerId: googleProvider.providerId
      });
      
      // We're using two different approaches:
      // 1. Try popup first (better UX)
      // 2. Fall back to redirect if popup fails (better compatibility)
      
      console.log('Attempting Google sign-in with popup...');
      try {
        // Popup method (preferred) - works in most desktop environments
        const result = await signInWithPopup(auth, googleProvider);
        
        console.log('Google sign-in successful via popup:', {
          uid: result.user?.uid,
          email: result.user?.email,
          displayName: result.user?.displayName
        });
        
        // Success! The signed-in user info is in result.user
        // Our app will get the user from the onAuthStateChanged listener
        return result;
      } catch (popupError: any) {
        // If popup is blocked or fails, try redirect method instead
        if (
          popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/internal-error'
        ) {
          console.log('Popup authentication failed, falling back to redirect method:', popupError.code);
          
          // Store current path for redirect back after auth
          const currentPath = window.location.pathname;
          localStorage.setItem('sg:auth:redirect', currentPath);
          
          // Redirect method (fallback) - more compatible with mobile/production
          await signInWithRedirect(auth, googleProvider);
          // This function won't return as the page will redirect to Google
          return null;
        }
        
        // If it's not a popup-related error, rethrow it
        throw popupError;
      }
    } catch (error) {
      const authError = error as AuthError;
      
      // Log comprehensive error information for debugging
      console.error('Error signing in with Google:', {
        code: authError.code,
        message: authError.message,
        customData: authError.customData,
        stack: authError.stack,
        authDomain: auth.config?.authDomain,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
      });
      
      setError(authError.message);
      
      // Detailed error handling with specific guidance
      if (authError.code === 'auth/configuration-not-found') {
        console.warn('Firebase Auth Domain Error: The authDomain in Firebase config must match the domain in Firebase console.');
      } else if (authError.code === 'auth/internal-error') {
        console.error('Firebase Internal Error: This is often related to incorrect project configuration. Verify API key and app settings in Firebase console.');
      } else if (authError.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup before completing authentication');
      } else if (authError.code === 'auth/cancelled-popup-request') {
        console.log('Another popup is open - authentication request cancelled');
      } else if (authError.code === 'auth/popup-blocked') {
        console.warn('Popup blocked by browser - adjust browser settings or try again');
      } else if (authError.code === 'auth/network-request-failed') {
        console.error('Network error occurred - check internet connection and firewall settings');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      console.error('Error signing out:', authError);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    loading,
    error,
    signInWithGoogle,
    signOut
  };
}