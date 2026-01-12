
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { ticketPurchases, enhancedTickets, ticketTransfers } from "@shared/schema";
import * as ticketingApi from "@/lib/ticketing-api";
import { eq, and, sql } from "drizzle-orm";

export const POST = withAuth(async (req: NextRequest, user) => {
    try {
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const transferCode = pathParts[pathParts.length - 2]; // /api/tickets/transfer/[code]/complete

        if (!transferCode) {
            return NextResponse.json({ message: "Transfer code is required" }, { status: 400 });
        }

        const transfer = await ticketingApi.getTicketTransferByCode(transferCode);
        if (!transfer) {
            return NextResponse.json({ message: "Transfer not found or already completed" }, { status: 404 });
        }

        // Atomic update of ownership and transfer status
        await db.transaction(async (tx) => {
            // 1. Update ticket purchase ownership
            await tx.update(ticketPurchases)
                .set({ userId: user.id })
                .where(eq(ticketPurchases.id, transfer.ticketPurchaseId));

            // 2. Update transfer status
            await tx.update(ticketTransfers)
                .set({
                    toUserId: user.id,
                    status: "completed",
                    transferredAt: new Date(),
                })
                .where(eq(ticketTransfers.id, transfer.id));

            // 3. Increment transfer count in enhanced_tickets
            const [purchase] = await tx.select()
                .from(ticketPurchases)
                .where(eq(ticketPurchases.id, transfer.ticketPurchaseId))
                .limit(1);

            if (purchase && purchase.ticketId) {
                await tx.update(enhancedTickets)
                    .set({
                        transferCount: sql`transfer_count + 1`,
                    })
                    .where(eq(enhancedTickets.ticketId, purchase.ticketId));
            }
        });

        return NextResponse.json({ message: "Transfer completed successfully", success: true });

    } catch (error) {
        console.error("Error completing transfer:", error);
        return NextResponse.json({ message: "Failed to complete transfer" }, { status: 500 });
    }
});
