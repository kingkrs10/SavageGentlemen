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
  options?: { headers?: Record<string, string> }
): Promise<Response> {
  // Get the current user from localStorage
  let headers: Record<string, string> = options?.headers || {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add user-id header if available in localStorage
  let userId = null;
  let authToken = null;
  try {
    const storedUser = localStorage.getItem("user");
    const normalizedUrl = normalizeUrl(url);
    console.log("API Request to:", normalizedUrl, "Method:", method);
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      
      // Handle both data formats: { data: { id: ... } } and direct { id: ... }
      const userData = user.data || user;
      
      if (userData && userData.id) {
        userId = userData.id.toString();
        headers["user-id"] = userId;
        
        // Set Authorization header if token exists
        if (userData.token) {
          authToken = userData.token;
          headers["Authorization"] = `Bearer ${authToken}`;
        }
        
        // Try to get token from sessionStorage as fallback
        if (!authToken) {
          const sessionToken = sessionStorage.getItem("authToken");
          if (sessionToken) {
            headers["Authorization"] = `Bearer ${sessionToken}`;
          }
        }
        
        console.log("Added auth headers for user:", userId);
      } else {
        console.log("Missing user ID in stored user object");
      }
    } else {
      console.log("No user found in localStorage");
    }
  } catch (error) {
    console.error("Error parsing stored user:", error);
  }
  
  console.log("Request headers:", headers);
  
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

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add user-id header if available in localStorage
    let headers: Record<string, string> = {};
    let userId = null;
    let authToken = null;
    
    try {
      const storedUser = localStorage.getItem("user");
      const url = queryKey[0] as string;
      const normalizedUrl = normalizeUrl(url);
      console.log("Query to:", normalizedUrl, "(original:", url, ")");
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // Handle both data formats: { data: { id: ... } } and direct { id: ... }
        const userData = user.data || user;
        
        if (userData && userData.id) {
          userId = userData.id.toString();
          headers["user-id"] = userId;
          
          // Set Authorization header if token exists
          if (userData.token) {
            authToken = userData.token;
            headers["Authorization"] = `Bearer ${authToken}`;
          }
          
          // Try to get token from sessionStorage as fallback
          if (!authToken) {
            const sessionToken = sessionStorage.getItem("authToken");
            if (sessionToken) {
              headers["Authorization"] = `Bearer ${sessionToken}`;
            }
          }
          
          console.log("Added auth headers for user:", userId);
          console.log("User role:", userData.role);
        } else {
          console.log("Missing user ID in stored user object");
        }
      } else {
        console.log("No user found in localStorage");
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
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
