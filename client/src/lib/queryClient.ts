import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
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
    
    // STEP 1: Try to get user ID and token from localStorage user object (primary source)
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
        
        if (userData && userData.id) {
          userId = userData.id.toString();
          headers["user-id"] = userId;
          
          // Set Authorization header if token exists in user object
          if (userData.token) {
            authToken = userData.token;
            headers["Authorization"] = `Bearer ${authToken}`;
            console.log("Using token from user object in localStorage");
          }
        }
      } catch (parseError) {
        console.error("Error parsing user from localStorage:", parseError);
      }
    }
    
    // STEP 2: If no token yet, try standalone authToken in localStorage
    if (!authToken) {
      const localAuthToken = localStorage.getItem("authToken");
      if (localAuthToken) {
        authToken = localAuthToken;
        headers["Authorization"] = `Bearer ${localAuthToken}`;
        console.log("Using authToken from localStorage");
      }
    }
    
    // STEP 3: If still no token, try sessionStorage
    if (!authToken) {
      const sessionToken = sessionStorage.getItem("authToken");
      if (sessionToken) {
        authToken = sessionToken;
        headers["Authorization"] = `Bearer ${sessionToken}`;
        console.log("Using token from sessionStorage");
      }
    }
    
    // STEP 4: If we have a Firebase token, try that
    if (!authToken) {
      const firebaseToken = localStorage.getItem("firebaseToken");
      if (firebaseToken) {
        authToken = firebaseToken;
        headers["Authorization"] = `Bearer ${firebaseToken}`;
        console.log("Using Firebase token");
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
    
    // STEP 5: Add user data as JSON in x-user-data header for extra redundancy
    // This serves as a last resort fallback
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const userData = parsedUser.data?.data || parsedUser.data || parsedUser;
          
          // Only add if we have valid user data with ID
          if (userData && userData.id) {
            // Create a minimal user object with just what's needed for authentication
            const minimalUserData = {
              id: userData.id,
              username: userData.username,
              role: userData.role
            };
            
            // Add as a custom header
            headers["x-user-data"] = JSON.stringify(minimalUserData);
            console.log("Added x-user-data header with minimal user data");
          }
        } catch (error) {
          console.error("Error preparing x-user-data header:", error);
        }
      }
    } catch (error) {
      console.error("Error setting up x-user-data header:", error);
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

  if (!res.ok) {
    try {
      const errorData = await res.json();
      console.error(`API Error (${res.status}):`, errorData);
    } catch (e) {
      console.error(`API Error (${res.status}):`, await res.text());
    }
  }

  // If we're making a registration or login request OR skipErrorThrow is true,
  // don't throw an error automatically, as we'll handle it in the component
  if (options?.skipErrorThrow || isRegistrationOrLogin) {
    return res;
  }
  
  // For all other requests, throw an error if the response is not ok
  await throwIfResNotOk(res);
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
      
      // STEP 1: Try to get user ID and token from localStorage user object (primary source)
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          
          // Handle both data formats: { data: { id: ... } } and direct { id: ... }
          const userData = user.data || user;
          
          if (userData && userData.id) {
            userId = userData.id.toString();
            headers["user-id"] = userId;
            
            // Set Authorization header if token exists in user object
            if (userData.token) {
              authToken = userData.token;
              headers["Authorization"] = `Bearer ${authToken}`;
              console.log("Using token from user object in localStorage");
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
      
      // STEP 2: If no token yet, try standalone authToken in localStorage
      if (!authToken) {
        const localAuthToken = localStorage.getItem("authToken");
        if (localAuthToken) {
          authToken = localAuthToken;
          headers["Authorization"] = `Bearer ${localAuthToken}`;
          console.log("Using authToken from localStorage");
        }
      }
      
      // STEP 3: If still no token, try sessionStorage
      if (!authToken) {
        const sessionToken = sessionStorage.getItem("authToken");
        if (sessionToken) {
          authToken = sessionToken;
          headers["Authorization"] = `Bearer ${sessionToken}`;
          console.log("Using token from sessionStorage");
        }
      }
      
      // STEP 4: If we have a Firebase token, try that
      if (!authToken) {
        const firebaseToken = localStorage.getItem("firebaseToken");
        if (firebaseToken) {
          authToken = firebaseToken;
          headers["Authorization"] = `Bearer ${firebaseToken}`;
          console.log("Using Firebase token");
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
      
      // STEP 5: Add user data as JSON in x-user-data header for extra redundancy
      // This serves as a last resort fallback
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const userData = parsedUser.data?.data || parsedUser.data || parsedUser;
            
            // Only add if we have valid user data with ID
            if (userData && userData.id) {
              // Create a minimal user object with just what's needed for authentication
              const minimalUserData = {
                id: userData.id,
                username: userData.username,
                role: userData.role
              };
              
              // Add as a custom header
              headers["x-user-data"] = JSON.stringify(minimalUserData);
              console.log("Added x-user-data header with minimal user data");
            }
          } catch (error) {
            console.error("Error preparing x-user-data header:", error);
          }
        }
      } catch (error) {
        console.error("Error setting up x-user-data header:", error);
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
      
      try {
        const errorData = await res.json();
        console.error(`Query Error (${res.status}):`, errorData);
      } catch (e) {
        console.error(`Query Error (${res.status}):`, await res.text());
      }
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
    }

    await throwIfResNotOk(res);
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
