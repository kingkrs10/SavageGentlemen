
import { NextRequest, NextResponse } from "next/server";
import { passportService } from "@/lib/passport-service";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        const leaderboard = await passportService.getLeaderboard(limit);

        return NextResponse.json({
            leaderboard,
            success: true
        });
    } catch (error) {
        console.error("Error fetching passport leaderboard:", error);
        return NextResponse.json({ message: "Failed to fetch passport leaderboard" }, { status: 500 });
    }
}
