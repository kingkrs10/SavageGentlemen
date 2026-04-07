
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateSecureLoginToken } from "@/lib/auth-utils";
import { User } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const userData = await request.json();

        if (!userData.username || !userData.password) {
            return NextResponse.json(
                { status: 'error', message: "Username and password are required" },
                { status: 400 }
            );
        }

        // Check for existing username
        const [existingUser] = await db.select().from(users).where(eq(users.username, userData.username));

        if (existingUser) {
            return NextResponse.json(
                { status: 'error', message: "Username already exists" },
                { status: 409 }
            );
        }

        // Check for existing email if provided
        if (userData.email) {
            const [existingEmail] = await db.select().from(users).where(eq(users.email, userData.email));
            if (existingEmail) {
                return NextResponse.json(
                    { status: 'error', message: "Email already in use" },
                    { status: 409 }
                );
            }
        }

        // Create new user in the database
        // In production, password hashing should be applied here if not using external auth provider
        const [user] = await db.insert(users).values({
            username: userData.username,
            password: userData.password,
            displayName: userData.displayName || userData.username,
            email: userData.email || null,
            avatar: userData.avatar || null,
            role: 'user',
            isGuest: false
        }).returning();

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
        }, { status: 201 });

    } catch (error) {
        console.error("Registration route error:", error);
        return NextResponse.json(
            { status: 'error', message: "Internal server error" },
            { status: 500 }
        );
    }
}
