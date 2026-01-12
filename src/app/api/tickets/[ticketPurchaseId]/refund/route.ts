
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { ticketPurchases, tickets, events } from "@shared/schema";
import * as ticketingApi from "@/lib/ticketing-api";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const refundSchema = z.object({
    refundType: z.enum(['full', 'partial', 'exchange']),
    refundAmount: z.number().optional(),
    reason: z.string().optional(),
});

export const POST = withAuth(async (req: NextRequest, user) => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const ticketPurchaseId = parseInt(pathParts[pathParts.length - 2]); // /api/tickets/[id]/refund

        if (isNaN(ticketPurchaseId)) {
            return NextResponse.json({ message: "Invalid ticket purchase ID" }, { status: 400 });
        }

        const body = await req.json();
        const validated = refundSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json({ message: "Invalid request body", errors: validated.error.format() }, { status: 400 });
        }

        // Verify ownership
        const ticketData = await db.select()
            .from(ticketPurchases)
            .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
            .leftJoin(events, eq(tickets.eventId, events.id))
            .where(and(
                eq(ticketPurchases.id, ticketPurchaseId),
                eq(ticketPurchases.userId, user.id)
            ))
            .limit(1);

        if (ticketData.length === 0) {
            return NextResponse.json({ message: "Ticket not found or not owned by you" }, { status: 404 });
        }

        // Check if refund is allowed (e.g., before event date)
        const event = ticketData[0].events;
        if (event) {
            const eventDate = new Date(event.date);
            const now = new Date();
            const refundDeadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

            if (now > refundDeadline) {
                return NextResponse.json({ message: "Refund deadline has passed" }, { status: 400 });
            }
        }

        const refund = await ticketingApi.createTicketRefundRequest({
            ticketPurchaseId,
            userId: user.id,
            refundType: validated.data.refundType,
            amount: validated.data.refundAmount || 0,
            reason: validated.data.reason || "",
        });

        return NextResponse.json({
            success: true,
            refund,
            message: "Refund request submitted successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error requesting refund:", error);
        return NextResponse.json({ message: "Failed to request refund" }, { status: 500 });
    }
});
