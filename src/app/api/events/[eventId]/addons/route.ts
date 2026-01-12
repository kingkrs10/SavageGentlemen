
import { NextRequest, NextResponse } from "next/server";
import { getEventAddons } from "@/lib/ticketing-api";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const eventId = parseInt(pathParts[pathParts.length - 2]); // /api/events/[id]/addons

        if (isNaN(eventId)) {
            return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
        }

        const addons = await getEventAddons(eventId);

        // Group by category as per legacy implementation
        const groupedAddons = addons.reduce((acc, addon) => {
            const category = addon.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(addon);
            return acc;
        }, {} as Record<string, typeof addons>);

        return NextResponse.json(groupedAddons);

    } catch (error) {
        console.error("Error fetching event addons:", error);
        return NextResponse.json({ message: "Failed to fetch event addons" }, { status: 500 });
    }
}
