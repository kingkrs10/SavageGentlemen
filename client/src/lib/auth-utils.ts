import { User } from '@/lib/types';

/**
 * Get the current user data from localStorage with fallbacks for different formats
 */
export function getCurrentUser(): User | null {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    
    const parsed = JSON.parse(storedUser);
    
    // Handle different formats:
    // 1. { status: "success", data: { ... } }
    // 2. { data: { ... } }
    // 3. { ... } (direct user object)
    const userData = parsed.data?.data || parsed.data || parsed;
    
    if (!userData || !userData.id) return null;
    
    return userData as User;
  } catch (error) {
    console.error('Error getting current user from localStorage:', error);
    return null;
  }
}

/**
 * Get authentication headers including all possible authentication methods
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  try {
    // Strategy 1: Get current user and use their token
    const user = getCurrentUser();
    
    if (user && user.id) {
      // Always add user ID header as a reliable fallback
      headers['user-id'] = user.id.toString();
      
      // Add token from user object if available
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      // Add x-user-data header with minimal user info
      const minimalUserData = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      headers['x-user-data'] = JSON.stringify(minimalUserData);
    }
    
    // Strategy 2: Standalone tokens if user object doesn't have one
    if (!headers['Authorization']) {
      // Try standalone auth token
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        // Try Firebase token
        const firebaseToken = localStorage.getItem('firebaseToken');
        if (firebaseToken) {
          headers['Authorization'] = `Bearer ${firebaseToken}`;
        }
      }
    }
    
    // Strategy 3: Session storage as last resort
    if (!headers['Authorization']) {
      const sessionToken = sessionStorage.getItem('authToken');
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
    }
    
    // If we have a userId separately stored, use it as a fallback
    if (!headers['user-id']) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        headers['user-id'] = userId;
      }
    }
  } catch (error) {
    console.error('Error generating auth headers:', error);
  }
  
  return headers;
}

/**
 * Store user data consistently in localStorage
 */
export function storeUserData(userData: User): void {
  try {
    // Make sure user has token
    if (userData && !userData.token) {
      console.warn('User data has no token - this might cause authentication issues');
    }
    
    // Store user in localStorage with consistent format
    localStorage.setItem('user', JSON.stringify({
      status: 'success',
      data: userData
    }));
    
    // Also store userId for fallback authentication
    if (userData && userData.id) {
      localStorage.setItem('userId', userData.id.toString());
    }
    
    // If user has token, also store it as a standalone token
    if (userData && userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
    
    // Dispatch auth changed event
    window.dispatchEvent(new CustomEvent('sg:auth:changed', {
      detail: { user: userData }
    }));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('authToken');
  localStorage.removeItem('firebaseToken');
  sessionStorage.removeItem('authToken');
  
  window.dispatchEvent(new CustomEvent('sg:auth:changed', {
    detail: { user: null }
  }));
}