import { NextRequest, NextResponse } from "next/server";
import { getUserTickets } from "@/lib/ticketing-api";

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

        const tickets = await getUserTickets(userId);
        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Error in GET /api/users/[id]/tickets:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
