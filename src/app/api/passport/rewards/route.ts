
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { getPassportRewardsByUserId } from "@/lib/passport-api";

export const GET = withAuth(async (req: NextRequest, user) => {
    try {
        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get("status") || undefined;

        const rewards = await getPassportRewardsByUserId(user.id, status);

        return NextResponse.json({
            rewards,
            success: true
        });
    } catch (error) {
        console.error("Error fetching passport rewards:", error);
        return NextResponse.json({ message: "Failed to fetch passport rewards" }, { status: 500 });
    }
});
