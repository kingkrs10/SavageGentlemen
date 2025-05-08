import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the current user from localStorage
  let headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add user-id header if available in localStorage
  let userId = null;
  try {
    const storedUser = localStorage.getItem("user");
    console.log("API Request to:", url, "Method:", method);
    console.log("Stored user from localStorage:", storedUser);
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log("Parsed user:", user);
      
      if (user && user.id) {
        userId = user.id.toString();
        headers["user-id"] = userId;
        console.log("Added user-id header:", userId);
        console.log("User role:", user.role);
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
  
  const res = await fetch(url, {
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
    
    try {
      const storedUser = localStorage.getItem("user");
      console.log("Query to:", queryKey[0]);
      console.log("Stored user from localStorage:", storedUser);
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log("Parsed user:", user);
        
        if (user && user.id) {
          headers["user-id"] = user.id.toString();
          console.log("Added user-id header:", user.id);
          console.log("User role:", user.role);
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
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      console.log(`Query error (${res.status}) for ${queryKey[0]}`);
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
