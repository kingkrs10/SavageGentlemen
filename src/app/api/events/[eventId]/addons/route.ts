import { NextRequest, NextResponse } from "next/server";
import { getAddonsByEventId, createAddon } from "@/lib/api";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { insertTicketAddonSchema } from "@shared/schema";

export async function GET(req: NextRequest, props: { params: Promise<{ eventId: string }> }) {
    try {
        const params = await props.params;
        const eventId = parseInt(params.eventId);
        if (isNaN(eventId)) {
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }

        const addons = await getAddonsByEventId(eventId);

        // Group by category for UI display
        const groupedAddons = addons.reduce((acc, addon) => {
            const category = addon.category || "other";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(addon);
            return acc;
        }, {} as Record<string, typeof addons>);

        return NextResponse.json({ addons, grouped: groupedAddons });
    } catch (error) {
        console.error("Error fetching event addons:", error);
        return NextResponse.json({ error: "Failed to fetch event addons" }, { status: 500 });
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
        const validated = insertTicketAddonSchema.parse({ ...body, eventId });

        const addon = await createAddon(validated);
        return NextResponse.json(addon, { status: 201 });
    } catch (error: any) {
        console.error("Error creating addon:", error);
        if (error?.issues) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
    }
}
