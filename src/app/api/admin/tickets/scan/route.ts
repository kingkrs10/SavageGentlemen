import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketPurchases, ticketScans, events, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(req: Request) {
    try {
        const user = await getAuthenticatedUser(req as any);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { qrCodeData } = await req.json();

        if (!qrCodeData) {
            return NextResponse.json({ error: "No QR code data provided" }, { status: 400 });
        }

        // Find the ticket
        const ticket = await db.query.ticketPurchases.findFirst({
            where: eq(ticketPurchases.qrCodeData, qrCodeData),
            with: {
                event: true,
                user: true
            }
        });

        if (!ticket) {
            return NextResponse.json({
                success: false,
                message: "Invalid Ticket",
                code: "INVALID_TICKET"
            }, { status: 404 });
        }

        // Check matching event (Optional: if we want to restrict scanning to specific event)
        // For now, global scanner validates any valid ticket.

        if (ticket.status !== 'valid') {
            return NextResponse.json({
                success: false,
                message: `Ticket is ${ticket.status}`,
                ticket,
                code: "TICKET_NOT_VALID"
            });
        }

        if (ticket.scanned) {
            // Already scanned
            // Log the attempt
            await db.insert(ticketScans).values({
                ticketPurchaseId: ticket.id,
                orderId: ticket.orderId,
                scannerId: user.id,
                status: "already_used",
                notes: "Duplicate scan attempt"
            });

            return NextResponse.json({
                success: false,
                message: "Ticket Already Scanned",
                ticket,
                code: "ALREADY_SCANNED",
                scanInfo: {
                    firstScan: ticket.firstScanAt,
                    scanCount: ticket.scanCount
                }
            });
        }

        // Valid Scan logic
        const now = new Date();

        await db.update(ticketPurchases)
            .set({
                scanned: true,
                firstScanAt: ticket.firstScanAt || now,
                lastScanAt: now,
                scanCount: (ticket.scanCount || 0) + 1
            })
            .where(eq(ticketPurchases.id, ticket.id));

        await db.insert(ticketScans).values({
            ticketPurchaseId: ticket.id,
            orderId: ticket.orderId,
            scannerId: user.id,
            status: "valid",
            notes: "Entry granted"
        });

        return NextResponse.json({
            success: true,
            message: "Ticket Valid - Entry Granted",
            ticket,
            code: "VALID_ENTRY"
        });

    } catch (error) {
        console.error("API Error (scan ticket):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
