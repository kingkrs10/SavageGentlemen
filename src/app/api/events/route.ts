
import { NextResponse } from "next/server";
import { getAllEvents, createTicketTier, createAddon } from "@/lib/api";
import { db } from "@/lib/db";
import { events, insertEventSchema, InsertEvent, insertTicketSchema, insertTicketAddonSchema } from "@shared/schema";
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

        // Extract nested ticket tiers and addons from the request body
        const { ticketTiers, addons, ...eventData } = body;

        // Validate and create the event
        const validatedEvent = insertEventSchema.parse(eventData);
        const [newEvent] = await db.insert(events).values(validatedEvent as InsertEvent).returning();

        const createdTiers = [];
        const createdAddons = [];

        // Create ticket tiers if provided
        if (ticketTiers && Array.isArray(ticketTiers) && ticketTiers.length > 0) {
            for (const tier of ticketTiers) {
                try {
                    const validated = insertTicketSchema.parse({
                        ...tier,
                        eventId: newEvent.id,
                    });
                    const created = await createTicketTier(validated);
                    createdTiers.push(created);
                } catch (tierError) {
                    console.error("Error creating tier during event creation:", tierError);
                    // Continue with other tiers even if one fails
                }
            }
        }

        // Create addons if provided
        if (addons && Array.isArray(addons) && addons.length > 0) {
            for (const addon of addons) {
                try {
                    const validated = insertTicketAddonSchema.parse({
                        ...addon,
                        eventId: newEvent.id,
                    });
                    const created = await createAddon(validated);
                    createdAddons.push(created);
                } catch (addonError) {
                    console.error("Error creating addon during event creation:", addonError);
                }
            }
        }

        return NextResponse.json({
            ...newEvent,
            tickets: createdTiers,
            addons: createdAddons,
        }, { status: 201 });
    } catch (error: any) {
        console.error("API Error (create event):", error);
        if (error?.issues) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid data or server error" }, { status: 400 });
    }
}
