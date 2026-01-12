import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, insertEventSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: Request, { params }: { params: { eventId: string } }) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const eventId = parseInt(resolvedParams.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
        }

        const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

        if (!event || event.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json(event[0]);
    } catch (error) {
        console.error("API Error (get event):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { eventId: string } }) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const eventId = parseInt(resolvedParams.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
        }

        const body = await req.json();

        // Validate input (partial update is allowed but schema checks types)
        // For partial updates, we might want to use .partial() if supported or just parse what we can
        // Drizzle-zod insert schema expects all required fields. 
        // Ideally we should use specific update schema, but for now we can rely on parsing what's passed 
        // assuming the client sends the full object or we handle partials carefully. 
        // Let's assume full update OR create a partial schema.

        // Simple approach: manually specific allowed fields for update or re-use existing logic
        // Let's use the schema but make it partial for updates
        const updateSchema = insertEventSchema.partial();
        const validatedData = updateSchema.parse(body);

        const updatedEvent = await db
            .update(events)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(events.id, eventId))
            .returning();

        return NextResponse.json(updatedEvent[0]);
    } catch (error) {
        console.error("API Error (update event):", error);
        return NextResponse.json({ error: "Invalid data or server error" }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { eventId: string } }) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const eventId = parseInt(resolvedParams.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
        }

        await db.delete(events).where(eq(events.id, eventId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error (delete event):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
