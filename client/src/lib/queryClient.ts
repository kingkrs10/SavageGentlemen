import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthHeaders } from "./auth-utils";

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
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log("API Request to:", normalizedUrl, "Method:", method);
    
    // Get headers using standard auth-utils
    const authHeaders = getAuthHeaders();
    headers = { ...headers, ...authHeaders };
    
    // Filter headers for specific routes if needed
    if (normalizedUrl.includes('/payment') || normalizedUrl.includes('/ticket')) {
      if (headers['user-id'] && !normalizedUrl.includes('/admin')) {
        delete headers['user-id'];
      }
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
    // Add authentication headers from all possible sources using centralized utility
    let headers: Record<string, string> = {};
    
    try {
      const url = queryKey[0] as string;
      const normalizedUrl = normalizeUrl(url);
      console.log("Query to:", normalizedUrl, "(original:", url, ")");
      
      headers = getAuthHeaders();
      
      // Filter headers for specific routes if needed
      if (normalizedUrl.includes('/payment') || normalizedUrl.includes('/ticket')) {
        // Only removing user-id for these specific routes per legacy logic
        if (headers['user-id'] && !normalizedUrl.includes('/admin')) {
          delete headers['user-id'];
        }
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
