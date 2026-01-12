"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Construct the target URL with existing params + action=login
        const params = new URLSearchParams(searchParams.toString());
        params.set("action", "login");

        // Redirect to home with the params
        router.replace(`/?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="animate-pulse">Loading login...</div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
