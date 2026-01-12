
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateSecureLoginToken } from "@/lib/auth-utils";
import { User } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { status: 'error', message: "Username and password are required" },
                { status: 400 }
            );
        }

        // Small delay to prevent timing attacks, similar to legacy implementation
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

        const [user] = await db.select().from(users).where(eq(users.username, username));

        if (!user || user.password !== password) {
            return NextResponse.json(
                { status: 'error', message: "Invalid username or password" },
                { status: 401 }
            );
        }

        // Generate secure token
        const token = generateSecureLoginToken(user as User);

        return NextResponse.json({
            status: 'success',
            data: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                isGuest: user.isGuest,
                role: user.role,
                token: token
            }
        });

    } catch (error) {
        console.error("Login component error:", error);
        return NextResponse.json(
            { status: 'error', message: "Internal server error" },
            { status: 500 }
        );
    }
}
