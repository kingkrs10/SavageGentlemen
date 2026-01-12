
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json(user);
    } catch (error) {
        console.error("Error in GET /api/auth/me:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
