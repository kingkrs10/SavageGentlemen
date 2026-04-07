
import { NextResponse } from "next/server";
import { getFeaturedEvents } from "@/lib/api";

export async function GET() {
    try {
        const events = await getFeaturedEvents();
        return NextResponse.json(events);
    } catch (error) {
        console.error("API Error (featured events):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
