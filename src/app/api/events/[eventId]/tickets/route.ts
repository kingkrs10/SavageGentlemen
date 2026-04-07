import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, insertTicketSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getTicketsByEventId, createTicketTier } from "@/lib/api";

export async function GET(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
    try {
        const params = await props.params;
        const eventId = parseInt(params.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const eventTickets = await getTicketsByEventId(eventId);
        return NextResponse.json(eventTickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
    try {
        const params = await props.params;
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = parseInt(params.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const body = await req.json();
        const validated = insertTicketSchema.parse({ ...body, eventId });

        const ticket = await createTicketTier(validated);
        return NextResponse.json(ticket, { status: 201 });
    } catch (error: any) {
        console.error("Error creating ticket tier:", error);
        if (error?.issues) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create ticket tier" }, { status: 500 });
    }
}
