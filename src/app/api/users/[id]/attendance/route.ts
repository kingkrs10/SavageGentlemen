import { NextRequest, NextResponse } from "next/server";
import { getUserAttendance } from "@/lib/user-api";

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

        const attendance = await getUserAttendance(userId);
        return NextResponse.json(attendance);
    } catch (error) {
        console.error("Error in GET /api/users/[id]/attendance:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
