import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketPurchases, events, users } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function GET(req: Request) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tickets = await db.select({
            id: ticketPurchases.id,
            purchaseDate: ticketPurchases.purchaseDate,
            status: ticketPurchases.status,
            ticketType: ticketPurchases.ticketType,
            price: ticketPurchases.price,
            attendeeName: ticketPurchases.attendeeName,
            attendeeEmail: ticketPurchases.attendeeEmail,
            scanned: ticketPurchases.scanned,
            qrCodeData: ticketPurchases.qrCodeData,
            scanCount: ticketPurchases.scanCount,
            eventName: events.title,
            eventDate: events.date,
            buyerName: users.displayName,
            buyerEmail: users.email
        })
            .from(ticketPurchases)
            .leftJoin(events, eq(ticketPurchases.eventId, events.id))
            .leftJoin(users, eq(ticketPurchases.userId, users.id))
            .orderBy(desc(ticketPurchases.purchaseDate));

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("API Error (admin tickets):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
