
import { NextRequest, NextResponse } from "next/server";
import { incrementEventViews } from "@/lib/api";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const eventId = parseInt(id);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const result = await incrementEventViews(eventId);
        if (!result) {
            return NextResponse.json({ error: "Failed to update analytics" }, { status: 500 });
        }

        return NextResponse.json({ success: true, analytics: result });
    } catch (error) {
        console.error("API Error (event analytics):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
