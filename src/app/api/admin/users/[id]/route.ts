import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const adminUser = await getAuthenticatedUser(req as any);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Handle params safely for Next 15+ (in case it is a Promise at runtime despite type)
        const resolvedParams = await Promise.resolve(params);
        const targetUserId = parseInt(resolvedParams.id);
        const body = await req.json();
        const { role } = body;

        if (!role || !['user', 'admin', 'promoter', 'moderator'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Prevent admin from removing their own admin status accidentally
        if (adminUser.id === targetUserId && role !== 'admin') {
            return NextResponse.json({ error: "You cannot demote yourself." }, { status: 403 });
        }

        const updatedUser = await db.update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, targetUserId))
            .returning({
                id: users.id,
                role: users.role,
                username: users.username
            });

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error("API Error (update user role):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
