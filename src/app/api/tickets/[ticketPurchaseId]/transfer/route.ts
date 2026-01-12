
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { ticketPurchases, tickets, enhancedTickets } from "@shared/schema";
import * as ticketingApi from "@/lib/ticketing-api";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const POST = withAuth(async (req: NextRequest, user) => {
    try {
        // Note: In Next.js App Router, we usually get params from the second argument of the handler,
        // but since I'm using withAuth HOC, I either need to adjust withAuth or extract it here.
        // Actually, withAuth currently only passes (req, user). 
        // I will extract the ID from the URL manually or adjust withAuth.

        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const ticketPurchaseId = parseInt(pathParts[pathParts.length - 2]); // /api/tickets/[id]/transfer

        if (isNaN(ticketPurchaseId)) {
            return NextResponse.json({ message: "Invalid ticket purchase ID" }, { status: 400 });
        }

        // Verify ownership and transferability
        const ticketData = await db.select()
            .from(ticketPurchases)
            .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
            .leftJoin(enhancedTickets, eq(enhancedTickets.ticketId, tickets.id))
            .where(and(
                eq(ticketPurchases.id, ticketPurchaseId),
                eq(ticketPurchases.userId, user.id)
            ))
            .limit(1);

        if (ticketData.length === 0) {
            return NextResponse.json({ message: "Ticket not found or not owned by you" }, { status: 404 });
        }

        const enhanced = ticketData[0].enhanced_tickets;
        if (!enhanced?.isTransferable) {
            return NextResponse.json({ message: "Ticket is not transferable" }, { status: 400 });
        }

        if (enhanced.transferCount && enhanced.maxTransfers && enhanced.transferCount >= enhanced.maxTransfers) {
            return NextResponse.json({ message: "Transfer limit exceeded" }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const transferCode = uuidv4();

        const transfer = await ticketingApi.createTicketTransfer({
            ticketPurchaseId,
            fromUserId: user.id,
            toUserId: body.toUserId || null,
            toEmail: body.toEmail || null,
            transferCode,
        });

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');

        return NextResponse.json({
            success: true,
            transfer,
            transferUrl: `${protocol}://${host}/transfer/${transferCode}`,
        }, { status: 201 });

    } catch (error) {
        console.error("Error initiating transfer:", error);
        return NextResponse.json({ message: "Failed to initiate transfer" }, { status: 500 });
    }
});
