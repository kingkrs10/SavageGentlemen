import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  UserCredential,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '@/lib/firebase';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

export type AuthProviderType = 'google' | 'facebook';

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

  // Sign in with a provider (Google or Facebook)
  const signInWithProvider = async (providerType: AuthProviderType) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = providerType === 'google' ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, provider);
      
      // The signed-in user info is in result.user
      // But our app will get the user from the onAuthStateChanged listener
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      console.error('Error signing in:', authError);
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
    signInWithGoogle: () => signInWithProvider('google'),
    signInWithFacebook: () => signInWithProvider('facebook'),
    signOut
  };
}