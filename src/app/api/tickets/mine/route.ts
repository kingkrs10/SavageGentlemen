
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { ticketPurchases, events, tickets } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        // Fetch user's ticket purchases with event details
        const userTickets = await db.select({
            purchase: ticketPurchases,
            event: events,
            ticket: tickets
        })
            .from(ticketPurchases)
            .leftJoin(events, eq(ticketPurchases.eventId, events.id))
            .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
            .where(eq(ticketPurchases.userId, user.id))
            .orderBy(desc(ticketPurchases.purchaseDate));

        // Format the response
        const formattedTickets = userTickets.map(({ purchase, event, ticket }) => ({
            id: purchase.id,
            orderId: purchase.orderId,
            purchaseDate: purchase.purchaseDate,
            status: purchase.status,
            qrCodeData: purchase.qrCodeData,
            price: purchase.price,
            ticketType: purchase.ticketType,
            attendeeName: purchase.attendeeName,
            scanned: purchase.scanned,
            event: event ? {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location,
                imageUrl: event.imageUrl
            } : null,
            ticketDetails: ticket ? {
                name: ticket.name,
                description: ticket.description
            } : null
        }));

        return NextResponse.json(formattedTickets);
    } catch (error) {
        console.error("Error fetching user tickets:", error);
        return NextResponse.json({ message: "Failed to fetch tickets" }, { status: 500 });
    }
});
