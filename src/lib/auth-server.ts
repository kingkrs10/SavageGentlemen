
import { NextRequest, NextResponse } from "next/server";
import { validateSecureLoginToken } from "./auth-utils";
import { User } from "./types";

/**
 * Server-side utility to get the authenticated user from a request.
 * Checks the Authorization header for a Bearer token.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return null;
    }

    return await validateSecureLoginToken(token);
}

/**
 * Higher-order function to wrap API handlers with authentication.
 */
export function withAuth(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ message: "Authentication required" }, { status: 401 });
        }
        return handler(req, user);
    };
}

/**
 * Higher-order function to wrap API handlers with admin authentication.
 */
export function withAdmin(handler: (req: NextRequest, user: User) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ message: "Authentication required" }, { status: 401 });
        }
        if (user.role !== 'admin') {
            return NextResponse.json({ message: "Admin access required" }, { status: 403 });
        }
        return handler(req, user);
    };
}
