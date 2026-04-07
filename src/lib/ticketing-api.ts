
import { db } from "@/lib/db";
import {
    enhancedTickets,
    ticketTransfers,
    ticketRefunds,
    ticketAddons,
    ticketAddonPurchases,
    ticketPurchases,
    tickets,
    events,
    users
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
    EnhancedTicket,
    InsertEnhancedTicket,
    TicketTransfer,
    InsertTicketTransfer,
    TicketRefund,
    InsertTicketRefund,
    TicketAddon,
    InsertTicketAddon,
    TicketAddonPurchase,
    InsertTicketAddonPurchase,
    TicketPurchase
} from "@shared/schema";

// --- Enhanced Ticket operations ---

export async function getEnhancedTicketByQrCode(qrCode: string): Promise<any | undefined> {
    const result = await db.select({
        enhancedTicket: enhancedTickets,
        ticket: tickets,
        event: events,
        purchase: ticketPurchases,
        user: users,
    })
        .from(enhancedTickets)
        .leftJoin(tickets, eq(enhancedTickets.ticketId, tickets.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .leftJoin(ticketPurchases, eq(ticketPurchases.ticketId, tickets.id))
        .leftJoin(users, eq(ticketPurchases.userId, users.id))
        .where(eq(enhancedTickets.qrCode, qrCode))
        .limit(1);

    return result[0];
}

export async function createEnhancedTicket(data: InsertEnhancedTicket): Promise<EnhancedTicket> {
    const [enhanced] = await db.insert(enhancedTickets)
        .values(data)
        .returning();
    return enhanced;
}

// --- Ticket Transfer operations ---

export async function getTicketTransferByCode(transferCode: string): Promise<TicketTransfer | undefined> {
    const [transfer] = await db.select()
        .from(ticketTransfers)
        .where(and(
            eq(ticketTransfers.transferCode, transferCode),
            eq(ticketTransfers.status, "pending")
        ))
        .limit(1);
    return transfer;
}

export async function createTicketTransfer(data: InsertTicketTransfer): Promise<TicketTransfer> {
    const [transfer] = await db.insert(ticketTransfers)
        .values(data)
        .returning();
    return transfer;
}

export async function updateTicketTransferStatus(id: number, status: string, toUserId?: number): Promise<TicketTransfer | undefined> {
    const [transfer] = await db.update(ticketTransfers)
        .set({
            status,
            toUserId: toUserId || null,
            transferredAt: status === 'completed' ? new Date() : null
        })
        .where(eq(ticketTransfers.id, id))
        .returning();
    return transfer;
}

// --- Ticket Refund operations ---

export async function createTicketRefundRequest(data: InsertTicketRefund): Promise<TicketRefund> {
    const [refund] = await db.insert(ticketRefunds)
        .values(data)
        .returning();
    return refund;
}

// --- Add-on operations ---

export async function getEventAddons(eventId: number): Promise<TicketAddon[]> {
    return await db.select()
        .from(ticketAddons)
        .where(and(
            eq(ticketAddons.eventId, eventId),
            eq(ticketAddons.isActive, true)
        ))
        .orderBy(ticketAddons.category, ticketAddons.name);
}

export async function createTicketAddonPurchase(data: InsertTicketAddonPurchase): Promise<TicketAddonPurchase> {
    const [purchase] = await db.insert(ticketAddonPurchases)
        .values(data)
        .returning();
    return purchase;
}

export async function getUserTicketAddons(userId: number): Promise<any[]> {
    return await db.select({
        purchase: ticketAddonPurchases,
        addon: ticketAddons,
        event: events,
        ticket: tickets,
    })
        .from(ticketAddonPurchases)
        .leftJoin(ticketAddons, eq(ticketAddonPurchases.addonId, ticketAddons.id))
        .leftJoin(ticketPurchases, eq(ticketAddonPurchases.ticketPurchaseId, ticketPurchases.id))
        .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .where(eq(ticketPurchases.userId, userId))
        .orderBy(desc(ticketAddonPurchases.createdAt));
}
export async function getUserTickets(userId: number): Promise<any[]> {
    return await db.select({
        id: ticketPurchases.id,
        userId: ticketPurchases.userId,
        ticketId: ticketPurchases.ticketId,
        eventId: ticketPurchases.eventId,
        orderId: ticketPurchases.orderId,
        purchaseDate: ticketPurchases.purchaseDate,
        status: ticketPurchases.status,
        qrCodeData: ticketPurchases.qrCodeData,
        ticketType: ticketPurchases.ticketType,
        price: ticketPurchases.price,
        attendeeEmail: ticketPurchases.attendeeEmail,
        attendeeName: ticketPurchases.attendeeName,
        scanned: ticketPurchases.scanned,
        firstScanAt: ticketPurchases.firstScanAt,
        lastScanAt: ticketPurchases.lastScanAt,
        scanCount: ticketPurchases.scanCount,
        event: {
            title: events.title,
            date: events.date,
            location: events.location,
        },
    })
        .from(ticketPurchases)
        .leftJoin(events, eq(ticketPurchases.eventId, events.id))
        .where(eq(ticketPurchases.userId, userId))
        .orderBy(desc(ticketPurchases.purchaseDate));
}
