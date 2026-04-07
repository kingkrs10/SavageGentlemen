
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { getPassportStampsByUserId } from "@/lib/passport-api";

export const GET = withAuth(async (req: NextRequest, user) => {
    try {
        const searchParams = req.nextUrl.searchParams;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const stamps = await getPassportStampsByUserId(user.id, limit);

        return NextResponse.json({
            stamps,
            success: true
        });
    } catch (error) {
        console.error("Error fetching passport stamps:", error);
        return NextResponse.json({ message: "Failed to fetch passport stamps" }, { status: 500 });
    }
});
