"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

import { getQueryFn } from "@/lib/queryClient";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                queryFn: getQueryFn({ on401: "throw" }),
                staleTime: 60 * 1000,
            },
        },
    }));

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <QueryClientProvider client={queryClient}>
                <UserProvider>
                    {children}
                    <Toaster />
                </UserProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
