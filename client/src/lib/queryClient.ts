import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, errorMessage?: string) {
  if (!res.ok) {
    // Use the pre-read error message if available, otherwise read the response
    const text = errorMessage || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to ensure URL has the correct format
function normalizeUrl(url: string): string {
  // For API routes, ensure they start with /api/
  if (!url.startsWith('/api/') && !url.startsWith('/')) {
    return `/api/${url}`;
  } else if (!url.startsWith('/api/') && url.startsWith('/')) {
    return `/api${url}`;
  }
  return url;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string>; skipErrorThrow?: boolean }
): Promise<Response> {
  // Get the current user from localStorage
  let headers: Record<string, string> = options?.headers || {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add authentication headers from all possible sources
  let userId = null;
  let authToken = null;
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log("API Request to:", normalizedUrl, "Method:", method);
    
    // STEP 1: Try Firebase token first (most secure)
    const firebaseToken = localStorage.getItem("firebaseToken");
    if (firebaseToken) {
      authToken = firebaseToken;
      headers["Authorization"] = `Bearer ${firebaseToken}`;
      console.log("Using Firebase token");
    }
    
    // STEP 2: Try user's stored token (secure login token)
    if (!authToken) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          
          // Handle nested data structures: { data: { data: { id: ... } } }, { data: { id: ... } }, { id: ... }
          let userData = user;
          if (user.data && user.data.data) {
            userData = user.data.data;
          } else if (user.data) {
            userData = user.data;
          }
          
          if (userData && userData.token) {
            authToken = userData.token;
            headers["Authorization"] = `Bearer ${userData.token}`;
            console.log("Using stored user token");
          }
          
          if (userData && userData.id) {
            userId = userData.id.toString();
            // Only add user-id header for non-payment/ticket routes (allow admin routes)
            if (!normalizedUrl.includes('/payment') && !normalizedUrl.includes('/ticket')) {
              headers["user-id"] = userId;
            }
          }
        } catch (parseError) {
          console.error("Error parsing user from localStorage:", parseError);
        }
      }
    }
    
    // Log outcome of authentication gathering
    if (userId) {
      console.log("Added user-id header for user:", userId);
    }
    
    if (authToken) {
      console.log("Added Authorization header (token found)");
    } else {
      console.log("No authentication token available from any source");
    }
  } catch (error) {
    console.error("Error setting up authentication headers:", error);
  }
  
  console.log("Request headers:", headers);
  
  // Special registration and authentication paths that have rate limiting
  const sensitiveRoutes = ['/api/auth/register', '/api/auth/login'];
  const isRegistrationOrLogin = sensitiveRoutes.includes(normalizeUrl(url));
  
  const res = await fetch(normalizeUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  let errorMessage = '';
  if (!res.ok) {
    // Clone the response so we can read the body for error logging without consuming the original
    const clonedRes = res.clone();
    try {
      const errorData = await clonedRes.json();
      console.error(`API Error (${res.status}):`, errorData);
      errorMessage = typeof errorData === 'string' ? errorData : errorData.message || JSON.stringify(errorData);
    } catch (e) {
      try {
        const clonedRes2 = res.clone();
        errorMessage = await clonedRes2.text();
        console.error(`API Error (${res.status}):`, errorMessage);
      } catch (textError) {
        errorMessage = res.statusText;
        console.error(`API Error (${res.status}):`, errorMessage);
      }
    }
  }

  // If we're making a registration or login request OR skipErrorThrow is true,
  // don't throw an error automatically, as we'll handle it in the component
  if (options?.skipErrorThrow || isRegistrationOrLogin) {
    return res;
  }
  
  // For all other requests, throw an error if the response is not ok
  await throwIfResNotOk(res, errorMessage);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add authentication headers from all possible sources
    let headers: Record<string, string> = {};
    let userId = null;
    let authToken = null;
    
    try {
      const url = queryKey[0] as string;
      const normalizedUrl = normalizeUrl(url);
      console.log("Query to:", normalizedUrl, "(original:", url, ")");
      
      // STEP 1: Try Firebase token first (most secure)
      const firebaseToken = localStorage.getItem("firebaseToken");
      if (firebaseToken) {
        authToken = firebaseToken;
        headers["Authorization"] = `Bearer ${firebaseToken}`;
        console.log("Using Firebase token");
      }
      
      // STEP 2: Try user's stored token (secure login token)
      if (!authToken) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            
            // Handle nested data structures: { data: { data: { id: ... } } }, { data: { id: ... } }, { id: ... }
            let userData = user;
            if (user.data && user.data.data) {
              userData = user.data.data;
            } else if (user.data) {
              userData = user.data;
            }
            
            if (userData && userData.token) {
              authToken = userData.token;
              headers["Authorization"] = `Bearer ${userData.token}`;
              console.log("Using stored user token");
            }
            
            if (userData && userData.id) {
              userId = userData.id.toString();
              // Only add user-id header for non-payment/ticket routes (allow admin routes)
              if (!normalizedUrl.includes('/payment') && !normalizedUrl.includes('/ticket')) {
                headers["user-id"] = userId;
              }
              
              // Log role if available (helpful for debugging permission issues)
              if (userData.role) {
                console.log("User role:", userData.role);
              }
            }
          } catch (parseError) {
            console.error("Error parsing user from localStorage:", parseError);
          }
        }
      }
      
      // Log outcome of authentication gathering
      if (userId) {
        console.log("Added user-id header for user:", userId);
      }
      
      if (authToken) {
        console.log("Added Authorization header (token found)");
      } else {
        console.log("No authentication token available from any source");
      }
    } catch (error) {
      console.error("Error setting up authentication headers:", error);
    }
    
    console.log("Query headers:", headers);
    
    const res = await fetch(normalizeUrl(queryKey[0] as string), {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const url = queryKey[0] as string;
      const normalizedUrl = normalizeUrl(url);
      console.log(`Query error (${res.status}) for ${normalizedUrl} (original: ${url})`);
      
      let errorMessage = '';
      try {
        const errorData = await res.json();
        console.error(`Query Error (${res.status}):`, errorData);
        errorMessage = typeof errorData === 'string' ? errorData : errorData.message || JSON.stringify(errorData);
      } catch (e) {
        try {
          errorMessage = await res.text();
          console.error(`Query Error (${res.status}):`, errorMessage);
        } catch (textError) {
          errorMessage = res.statusText;
          console.error(`Query Error (${res.status}):`, errorMessage);
        }
      }
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Throw error immediately with pre-read error message
      throw new Error(`${res.status}: ${errorMessage}`);
    }

    return await res.json();
  };

/**
 * Invalidates all event-related queries to ensure data consistency across the app
 * @param eventId Optional specific event ID to invalidate
 */
export const invalidateEventQueries = (eventId?: number | string) => {
  // Main event lists
  queryClient.invalidateQueries({ queryKey: ['/api/events'] });
  queryClient.invalidateQueries({ queryKey: ['/api/events/featured'] });
  queryClient.invalidateQueries({ queryKey: ['/api/upcoming-events'] });
  
  // If we have a specific event ID, invalidate that specific event's queries
  if (eventId) {
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/events/detail/${eventId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/event/${eventId}`] });
  }
  
  // Also invalidate related data that might be affected
  queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
  
  console.log(`Event queries invalidated${eventId ? ` for event ${eventId}` : ''}`);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
