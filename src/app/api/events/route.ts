
import { NextResponse } from "next/server";
import { getAllEvents } from "@/lib/api";
import { db } from "@/lib/db";
import { events, insertEventSchema } from "@shared/schema";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET() {
    try {
        const allEvents = await getAllEvents();
        return NextResponse.json(allEvents);
    } catch (error) {
        console.error("API Error (events):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validate input
        const validatedData = insertEventSchema.parse(body);

        const newEvent = await db.insert(events).values(validatedData).returning();

        return NextResponse.json(newEvent[0], { status: 201 });
    } catch (error) {
        console.error("API Error (create event):", error);
        return NextResponse.json({ error: "Invalid data or server error" }, { status: 400 });
    }
}
