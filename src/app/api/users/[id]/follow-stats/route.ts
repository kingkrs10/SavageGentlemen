import { NextRequest, NextResponse } from "next/server";
import { getUserFollowStats } from "@/lib/user-api";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
        }

        const stats = await getUserFollowStats(userId);
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error in GET /api/users/[id]/follow-stats:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
