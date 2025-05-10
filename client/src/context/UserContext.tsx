import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: User) => void;
  isAdmin: boolean;
  isModerator: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
          
          // Temporarily set the user from localStorage
          setUser(parsedUser.data || parsedUser);
          
          // Validate the session with the server
          try {
            const response = await apiRequest("GET", "/api/me");
            
            if (response.ok) {
              // Session is valid, set the user state
              const validatedUser = await response.json();
              console.log("User session validated successfully");
              setUser(validatedUser);
            } else {
              // Session is invalid, clear the user data
              console.error("User session invalid, clearing local storage");
              localStorage.removeItem("user");
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
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    
    validateUserSession();
  }, []);

  // Login function - set user in state and localStorage
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify({ status: "success", data: userData }));
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', { detail: { user: userData } }));
  };

  // Logout function - clear user from state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', { detail: { user: null } }));
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, login, isAdmin, isModerator, isAuthenticated }}>
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