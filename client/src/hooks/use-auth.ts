import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
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

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google authentication process...');
      
      // Log Firebase configuration to help with debugging
      console.log('Firebase auth instance state:', {
        currentUser: auth.currentUser?.uid ? 'Logged in' : 'No user',
        initialized: auth.INTERNAL ? 'Yes' : 'No',
        authDomain: auth.config?.authDomain || 'Not set'
      });
      
      // Add scopes for better user data
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      // Set custom parameters for better UX
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Launching Google sign-in popup...');
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('Google sign-in successful:', {
        uid: result.user?.uid,
        email: result.user?.email,
        displayName: result.user?.displayName,
        hasIdToken: Boolean(result.user)
      });
      
      // The signed-in user info is in result.user
      // But our app will get the user from the onAuthStateChanged listener
      return result;
    } catch (error) {
      const authError = error as AuthError;
      
      // Log detailed error information for debugging
      console.error('Error signing in with Google:', {
        code: authError.code,
        message: authError.message,
        customData: authError.customData,
        stack: authError.stack
      });
      
      setError(authError.message);
      
      // Check for specific Firebase auth errors and provide better guidance
      if (authError.code === 'auth/configuration-not-found') {
        console.warn('Firebase Auth Domain Error: Make sure your app domain is added to Firebase authorized domains');
      } else if (authError.code === 'auth/internal-error') {
        console.error('Firebase Internal Error: This could be a configuration issue with the Firebase project or credentials');
      } else if (authError.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup before completing authentication');
      } else if (authError.code === 'auth/cancelled-popup-request') {
        console.log('Another popup is open - authentication request cancelled');
      } else if (authError.code === 'auth/popup-blocked') {
        console.warn('Popup blocked by browser - adjust browser settings');
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