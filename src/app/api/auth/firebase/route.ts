
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { generateSecureLoginToken } from "@/lib/auth-utils";
import { User } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { status: 'error', message: "ID token is required" },
                { status: 400 }
            );
        }

        const verificationResult = await verifyFirebaseToken(idToken);

        if (!verificationResult.success) {
            return NextResponse.json(
                { status: 'error', message: "Authentication failed", error: verificationResult.error },
                { status: 401 }
            );
        }

        const firebaseUid = verificationResult.uid;
        const email = verificationResult.email || '';
        const displayName = verificationResult.name || email?.split('@')[0] || `User_${Date.now()}`;
        const photoURL = verificationResult.picture || null;

        // Check if the user already exists in our database
        const firebaseUsername = `firebase_${firebaseUid}`;
        let [user] = await db.select().from(users).where(eq(users.username, firebaseUsername));

        if (!user) {
            // If user doesn't exist, create a new one to sync with Firebase
            const [newUser] = await db.insert(users).values({
                username: firebaseUsername,
                password: `firebase_${crypto.randomUUID()}`, // Random password for internal placeholder
                displayName: displayName,
                avatar: photoURL,
                isGuest: false,
                email: email,
                role: 'user',
                firebaseUid: firebaseUid
            }).returning();
            user = newUser;
        }

        // Generate our internal secure session token
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
        console.error("Firebase auth sync error:", error);
        return NextResponse.json(
            { status: 'error', message: "Internal server error" },
            { status: 500 }
        );
    }
}
