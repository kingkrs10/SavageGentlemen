import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { storeUserData, clearAuthData } from '@/lib/auth-utils';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: User) => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
  isModerator: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Computed properties
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const isAuthenticated = !!user && !user.isGuest;

  // Initialize user from localStorage
  useEffect(() => {
    const validateUserSession = async () => {
      try {
        // Only attempt validation if we have a stored user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          console.log("Stored user from localStorage:", storedUser);
          
          // Parse the stored user
          const parsedUser = JSON.parse(storedUser);
          console.log("Parsed user:", parsedUser);
          
          // CRITICAL: Validate the stored data is actually user data, not an error response
          // Bug: Login errors like {status: "error", message: "Invalid username..."} 
          // were being stored and treated as user objects
          if (parsedUser.status === 'error' || parsedUser.message === 'Invalid username or password') {
            console.warn("Corrupted user data detected in localStorage (error response stored as user). Clearing...");
            clearAuthData();
            return; // Don't try to validate - there's no valid session
          }
          
          // Temporarily set the user from localStorage
          // Handle both formats: { data: { ... } } and direct { ... }
          const userData = parsedUser.data || parsedUser;
          
          // Validate userData has required fields (at minimum, an id)
          if (!userData || !userData.id) {
            console.warn("Invalid user data in localStorage (no id field). Clearing...");
            clearAuthData();
            return;
          }
          
          setUser(userData);
          
          // Validate the session with the server
          try {
            const response = await apiRequest("GET", "/api/me");
            
            if (response.ok) {
              // Session is valid, set the user state
              const validatedUser = await response.json();
              console.log("User session validated successfully");
              storeUserData(validatedUser);
              setUser(validatedUser);
            } else {
              // Session is invalid, clear the user data
              console.error("User session invalid, clearing local storage");
              clearAuthData();
              setUser(null);
            }
          } catch (error) {
            console.error("Error validating user session:", error);
          }
        } else {
          console.log("No user found in localStorage");
        }
      } catch (error) {
        console.error("Error initializing user from localStorage:", error);
        clearAuthData();
        setUser(null);
      }
    };
    
    validateUserSession();
  }, []);

  // Login function - set user in state and localStorage
  const login = (userData: any) => {
    const cleanUser: User = (userData && userData.data) ? userData.data : userData;
    console.log("Login called with cleanUser:", cleanUser);
    
    // Set user in state
    setUser(cleanUser);
    
    // Store using centralized utility to ensure all fields are set
    storeUserData(cleanUser);
  };

  // Update user function - merge new data with existing user
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Store updated user
    storeUserData(updatedUser);
  };

  // Logout function - clear user from state and localStorage
  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, login, updateUser, isAdmin, isModerator, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};