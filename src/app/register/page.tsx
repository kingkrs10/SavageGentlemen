"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Construct the target URL with existing params + action=register
        const params = new URLSearchParams(searchParams.toString());
        params.set("action", "register");

        // Redirect to home with the params
        router.replace(`/?${params.toString()}`);
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="animate-pulse">Loading registration...</div>
        </div>
    );
}
