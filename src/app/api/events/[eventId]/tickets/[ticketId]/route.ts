import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { updateTicketTier, deleteTicketTier, getTicketById } from "@/lib/api";
import { insertTicketSchema } from "@shared/schema";

export async function PUT(req: NextRequest, props: { params: Promise<{ eventId: string; ticketId: string }> }) {
    try {
        const params = await props.params;
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ticketId = parseInt(params.ticketId);
        if (isNaN(ticketId)) {
            return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
        }

        const existing = await getTicketById(ticketId);
        if (!existing) {
            return NextResponse.json({ error: "Ticket tier not found" }, { status: 404 });
        }

        const body = await req.json();
        const updateSchema = insertTicketSchema.partial();
        const validated = updateSchema.parse(body);

        const updated = await updateTicketTier(ticketId, validated);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating ticket tier:", error);
        if (error?.issues) {
            return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update ticket tier" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ eventId: string; ticketId: string }> }) {
    try {
        const params = await props.params;
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ticketId = parseInt(params.ticketId);
        if (isNaN(ticketId)) {
            return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
        }

        await deleteTicketTier(ticketId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting ticket tier:", error);
        return NextResponse.json({ error: "Failed to delete ticket tier" }, { status: 500 });
    }
}
