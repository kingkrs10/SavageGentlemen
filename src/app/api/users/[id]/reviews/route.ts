import { NextRequest, NextResponse } from "next/server";
import { getUserReviews } from "@/lib/user-api";

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

        const reviews = await getUserReviews(userId);
        return NextResponse.json(reviews);
    } catch (error) {
        console.error("Error in GET /api/users/[id]/reviews:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
