import { useState, useEffect } from 'react';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

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

  // Placeholder for auth methods - removed Google sign-in

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
    signOut
  };
}