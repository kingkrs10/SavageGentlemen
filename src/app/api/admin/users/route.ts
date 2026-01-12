
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { desc, eq, or, ilike } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse query params for search if needed later, for now return all (paginated in real app)
        // Let's implement basic search if 'q' is present
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        let whereClause = undefined;
        if (query) {
            whereClause = or(
                ilike(users.username, `%${query}%`),
                ilike(users.email, `%${query}%`),
                ilike(users.displayName, `%${query}%`)
            );
        }

        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            email: users.email,
            displayName: users.displayName,
            role: users.role,
            createdAt: users.createdAt,
            avatar: users.avatar
        })
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(100); // hard limit for safety

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("API Error (admin users):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
