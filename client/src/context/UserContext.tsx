import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

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
          // Handle nested structure: { status: "success", data: { status: "success", data: { ... } } }
          let userData = parsedUser;
          if (userData.data?.data) {
            // Double-nested structure
            userData = userData.data.data;
          } else if (userData.data) {
            // Single-nested structure
            userData = userData.data;
          }
          setUser(userData);
          
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
    // Ensure we don't lose any token data from the user
    console.log("Login called with userData:", userData);
    
    // Set user in state
    setUser(userData);
    
    // Make sure the token is preserved
    if (userData && userData.token) {
      console.log("User has token, storing in localStorage");
    } else {
      console.log("User has no token, attempting to find one");
    }
    
    // Store in localStorage with consistent structure
    localStorage.setItem("user", JSON.stringify({ 
      status: "success", 
      data: userData 
    }));
    
    // Also store userId separately for fallback authentication
    if (userData && userData.id) {
      localStorage.setItem("userId", userData.id.toString());
      console.log("Stored userId in localStorage:", userData.id);
    }
    
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', { 
      detail: { user: userData } 
    }));
  };

  // Update user function - merge new data with existing user
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    
    // Store updated user in localStorage
    localStorage.setItem("user", JSON.stringify({ 
      status: "success", 
      data: updatedUser 
    }));
    
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', { 
      detail: { user: updatedUser } 
    }));
  };

  // Logout function - clear user from state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', { detail: { user: null } }));
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