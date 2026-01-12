import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/user-api";

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

        const profile = await getUserProfile(userId);

        if (!profile) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error in GET /api/users/[id]/profile:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
