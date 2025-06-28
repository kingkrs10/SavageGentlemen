import type { Express } from "express";
import { Router } from "express";
import { db } from "./db";
import { 
  enhancedTickets,
  ticketTransfers,
  ticketRefunds,
  ticketAddons,
  ticketAddonPurchases,
  ticketPurchases,
  tickets,
  users,
  events,
  insertEnhancedTicketSchema,
  insertTicketTransferSchema,
  insertTicketRefundSchema,
  insertTicketAddonSchema,
  insertTicketAddonPurchaseSchema
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { authenticateUser } from "./auth-middleware";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const enhancedTicketingRouter = Router();

export function registerEnhancedTicketingRoutes(app: Express) {

  // Generate Enhanced Ticket with QR Code
  app.post("/api/tickets/:ticketPurchaseId/enhance", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const ticketPurchaseId = parseInt(req.params.ticketPurchaseId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify ticket purchase belongs to user
      const ticketPurchase = await db.select()
        .from(ticketPurchases)
        .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
        .where(and(
          eq(ticketPurchases.id, ticketPurchaseId),
          eq(ticketPurchases.userId, userId)
        ))
        .limit(1);

      if (ticketPurchase.length === 0) {
        return res.status(404).json({ message: "Ticket purchase not found" });
      }

      const ticket = ticketPurchase[0].tickets;
      if (!ticket) {
        return res.status(400).json({ message: "Invalid ticket data" });
      }

      // Check if enhanced ticket already exists
      const existingEnhanced = await db.select()
        .from(enhancedTickets)
        .where(eq(enhancedTickets.ticketId, ticket.id))
        .limit(1);

      if (existingEnhanced.length > 0) {
        return res.json(existingEnhanced[0]);
      }

      // Generate QR code and security hash
      const qrCode = uuidv4();
      const securityData = `${ticketPurchaseId}-${ticket.id}-${userId}-${Date.now()}`;
      const securityHash = crypto.createHash('sha256').update(securityData).digest('hex');

      const validatedData = insertEnhancedTicketSchema.parse({
        ticketId: ticket.id,
        qrCode,
        securityHash,
        isTransferable: req.body.isTransferable ?? true,
        maxTransfers: req.body.maxTransfers ?? 3,
      });

      const [enhancedTicket] = await db.insert(enhancedTickets)
        .values(validatedData)
        .returning();

      res.status(201).json(enhancedTicket);
    } catch (error) {
      console.error("Error creating enhanced ticket:", error);
      res.status(500).json({ message: "Failed to create enhanced ticket" });
    }
  });

  // Verify QR Code
  app.post("/api/tickets/verify-qr", authenticateUser, async (req: any, res) => {
    try {
      const { qrCode } = req.body;

      if (!qrCode) {
        return res.status(400).json({ message: "QR code required" });
      }

      const ticketData = await db.select({
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

      if (ticketData.length === 0) {
        return res.status(404).json({ message: "Invalid QR code" });
      }

      const data = ticketData[0];
      
      // Check if ticket is valid for the event date
      const eventDate = new Date(data.event?.date || '');
      const now = new Date();
      const eventEndTime = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after event

      if (now > eventEndTime) {
        return res.status(400).json({ message: "Ticket has expired" });
      }

      res.json({
        valid: true,
        ticket: data.ticket,
        event: data.event,
        user: {
          id: data.user?.id,
          username: data.user?.username,
          displayName: data.user?.displayName,
        },
        purchase: data.purchase,
      });
    } catch (error) {
      console.error("Error verifying QR code:", error);
      res.status(500).json({ message: "Failed to verify QR code" });
    }
  });

  // Initiate Ticket Transfer
  app.post("/api/tickets/:ticketPurchaseId/transfer", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const ticketPurchaseId = parseInt(req.params.ticketPurchaseId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify ownership and transferability
      const ticketData = await db.select()
        .from(ticketPurchases)
        .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
        .leftJoin(enhancedTickets, eq(enhancedTickets.ticketId, tickets.id))
        .where(and(
          eq(ticketPurchases.id, ticketPurchaseId),
          eq(ticketPurchases.userId, userId)
        ))
        .limit(1);

      if (ticketData.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const enhanced = ticketData[0].enhanced_tickets;
      if (!enhanced?.isTransferable) {
        return res.status(400).json({ message: "Ticket is not transferable" });
      }

      if (enhanced.transferCount >= enhanced.maxTransfers) {
        return res.status(400).json({ message: "Transfer limit exceeded" });
      }

      const transferCode = uuidv4();
      
      const validatedData = insertTicketTransferSchema.parse({
        ticketPurchaseId,
        fromUserId: userId,
        toUserId: req.body.toUserId || null,
        toEmail: req.body.toEmail || null,
        transferCode,
      });

      const [transfer] = await db.insert(ticketTransfers)
        .values(validatedData)
        .returning();

      res.status(201).json({
        transfer,
        transferUrl: `${req.protocol}://${req.get('host')}/transfer/${transferCode}`,
      });
    } catch (error) {
      console.error("Error initiating transfer:", error);
      res.status(500).json({ message: "Failed to initiate transfer" });
    }
  });

  // Complete Ticket Transfer
  app.post("/api/tickets/transfer/:transferCode/complete", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const transferCode = req.params.transferCode;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const transfer = await db.select()
        .from(ticketTransfers)
        .where(and(
          eq(ticketTransfers.transferCode, transferCode),
          eq(ticketTransfers.status, "pending")
        ))
        .limit(1);

      if (transfer.length === 0) {
        return res.status(404).json({ message: "Transfer not found or already completed" });
      }

      // Update ticket purchase ownership
      await db.update(ticketPurchases)
        .set({ userId })
        .where(eq(ticketPurchases.id, transfer[0].ticketPurchaseId));

      // Update transfer status
      await db.update(ticketTransfers)
        .set({
          toUserId: userId,
          status: "completed",
          transferredAt: new Date(),
        })
        .where(eq(ticketTransfers.id, transfer[0].id));

      // Increment transfer count
      const ticketPurchase = await db.select()
        .from(ticketPurchases)
        .where(eq(ticketPurchases.id, transfer[0].ticketPurchaseId))
        .limit(1);

      if (ticketPurchase.length > 0) {
        await db.update(enhancedTickets)
          .set({
            transferCount: sql`${enhancedTickets.transferCount} + 1`,
          })
          .where(eq(enhancedTickets.ticketId, ticketPurchase[0].ticketId));
      }

      res.json({ message: "Transfer completed successfully" });
    } catch (error) {
      console.error("Error completing transfer:", error);
      res.status(500).json({ message: "Failed to complete transfer" });
    }
  });

  // Request Ticket Refund
  app.post("/api/tickets/:ticketPurchaseId/refund", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const ticketPurchaseId = parseInt(req.params.ticketPurchaseId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify ownership
      const ticketPurchase = await db.select()
        .from(ticketPurchases)
        .leftJoin(tickets, eq(ticketPurchases.ticketId, tickets.id))
        .leftJoin(events, eq(tickets.eventId, events.id))
        .where(and(
          eq(ticketPurchases.id, ticketPurchaseId),
          eq(ticketPurchases.userId, userId)
        ))
        .limit(1);

      if (ticketPurchase.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if refund is allowed (e.g., before event date)
      const event = ticketPurchase[0].events;
      if (event) {
        const eventDate = new Date(event.date);
        const now = new Date();
        const refundDeadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

        if (now > refundDeadline) {
          return res.status(400).json({ message: "Refund deadline has passed" });
        }
      }

      const validatedData = insertTicketRefundSchema.parse({
        ticketPurchaseId,
        userId,
        refundType: req.body.refundType,
        refundAmount: req.body.refundAmount,
        reason: req.body.reason,
      });

      const [refund] = await db.insert(ticketRefunds)
        .values(validatedData)
        .returning();

      res.status(201).json(refund);
    } catch (error) {
      console.error("Error requesting refund:", error);
      res.status(500).json({ message: "Failed to request refund" });
    }
  });

  // VIP Packages and Add-ons
  app.post("/api/events/:eventId/addons", authenticateUser, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;
      
      // Check if user has admin privileges for this event
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertTicketAddonSchema.parse({
        eventId,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        maxQuantity: req.body.maxQuantity,
      });

      const [addon] = await db.insert(ticketAddons)
        .values(validatedData)
        .returning();

      res.status(201).json(addon);
    } catch (error) {
      console.error("Error creating addon:", error);
      res.status(500).json({ message: "Failed to create addon" });
    }
  });

  // Get Event Add-ons
  app.get("/api/events/:eventId/addons", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      
      const addons = await db.select()
        .from(ticketAddons)
        .where(and(
          eq(ticketAddons.eventId, eventId),
          eq(ticketAddons.isActive, true)
        ))
        .orderBy(ticketAddons.category, ticketAddons.name);

      // Group by category
      const groupedAddons = addons.reduce((acc, addon) => {
        const category = addon.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(addon);
        return acc;
      }, {} as Record<string, typeof addons>);

      res.json(groupedAddons);
    } catch (error) {
      console.error("Error fetching addons:", error);
      res.status(500).json({ message: "Failed to fetch addons" });
    }
  });

  // Purchase Add-ons
  app.post("/api/tickets/:ticketPurchaseId/addons", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const ticketPurchaseId = parseInt(req.params.ticketPurchaseId);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify ticket ownership
      const ticketPurchase = await db.select()
        .from(ticketPurchases)
        .where(and(
          eq(ticketPurchases.id, ticketPurchaseId),
          eq(ticketPurchases.userId, userId)
        ))
        .limit(1);

      if (ticketPurchase.length === 0) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const { addonId, quantity } = req.body;
      
      // Get addon details
      const addon = await db.select()
        .from(ticketAddons)
        .where(and(
          eq(ticketAddons.id, addonId),
          eq(ticketAddons.isActive, true)
        ))
        .limit(1);

      if (addon.length === 0) {
        return res.status(404).json({ message: "Add-on not found" });
      }

      const addonData = addon[0];
      const totalPrice = addonData.price * quantity;

      const validatedData = insertTicketAddonPurchaseSchema.parse({
        ticketPurchaseId,
        addonId,
        quantity,
        unitPrice: addonData.price,
        totalPrice,
      });

      const [purchase] = await db.insert(ticketAddonPurchases)
        .values(validatedData)
        .returning();

      res.status(201).json({
        purchase,
        addon: addonData,
      });
    } catch (error) {
      console.error("Error purchasing addon:", error);
      res.status(500).json({ message: "Failed to purchase addon" });
    }
  });

  // Get User's Ticket Add-ons
  app.get("/api/users/:userId/ticket-addons", authenticateUser, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUser = req.user?.id;
      
      // Users can only view their own add-ons unless admin
      if (requestingUser !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const addonPurchases = await db.select({
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

      res.json(addonPurchases);
    } catch (error) {
      console.error("Error fetching user addons:", error);
      res.status(500).json({ message: "Failed to fetch user addons" });
    }
  });

  // Non-prefixed free ticket endpoint for frontend fallback compatibility
  app.post("/tickets/free", async (req, res) => {
    try {
      console.log("=== FREE TICKET REQUEST (NON-PREFIXED ENHANCED) ===");
      console.log("Request body:", req.body);
      console.log("Request headers:", req.headers);

      // Extract user info from headers (for mobile compatibility)
      let userId = null;
      let userRole = null;
      
      // Try user-id header first
      if (req.headers['user-id']) {
        userId = parseInt(req.headers['user-id'] as string);
        console.log("User found via user-id header for free ticket (non-prefixed enhanced):", userId);
      }
      
      // Try x-user-data header
      if (req.headers['x-user-data']) {
        try {
          const userData = JSON.parse(req.headers['x-user-data'] as string);
          if (userData.id && !userId) {
            userId = userData.id;
          }
          userRole = userData.role;
          console.log("User data from x-user-data header:", userData);
        } catch (e) {
          console.log("Could not parse x-user-data header:", e);
        }
      }

      // If no user ID found, check if it's a guest free ticket claim
      if (!userId) {
        const { guestEmail } = req.body;
        if (guestEmail && guestEmail.trim() !== '') {
          console.log("Processing guest free ticket claim for email:", guestEmail);
          // Continue with guest processing
        } else {
          return res.status(401).json({ 
            message: "Authentication required or guest email needed for free ticket claim" 
          });
        }
      }

      const { eventId, ticketId, guestEmail } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // Get event details
      const event = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (event.length === 0) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get ticket details if specified
      let selectedTicket = null;
      if (ticketId) {
        const ticketResult = await db.select()
          .from(tickets)
          .where(and(
            eq(tickets.id, ticketId),
            eq(tickets.eventId, eventId)
          ))
          .limit(1);

        if (ticketResult.length > 0) {
          selectedTicket = ticketResult[0];
          
          // Check ticket status and capacity
          if (selectedTicket.status === 'sold_out') {
            return res.status(400).json({ 
              message: "This ticket type is sold out and no longer available." 
            });
          }
          
          if (selectedTicket.status === 'off_sale') {
            return res.status(400).json({ 
              message: "This ticket type is not currently available for purchase." 
            });
          }
          
          if (selectedTicket.status === 'staff_only') {
            return res.status(400).json({ 
              message: "This ticket type is restricted and not available for public purchase." 
            });
          }
          
          // Enhanced capacity check for free events
          if (selectedTicket.remainingQuantity !== null && selectedTicket.remainingQuantity !== undefined && selectedTicket.remainingQuantity <= 0) {
            return res.status(400).json({ 
              message: "This ticket type has no remaining capacity." 
            });
          }
        }
      }

      // Process the free ticket claim
      const purchaseEmail = guestEmail || (userId ? await getUserEmail(userId) : null);
      
      if (!purchaseEmail) {
        return res.status(400).json({ 
          message: "Email address is required for ticket delivery" 
        });
      }

      // Create order and ticket purchase
      const orderData = {
        userId: userId || null,
        eventId,
        paymentIntentId: `free-${Date.now()}`,
        amount: 0,
        currency: 'USD',
        status: 'completed',
        guestEmail: guestEmail || null,
        items: JSON.stringify([{
          eventId,
          eventTitle: event[0].title,
          ticketId: selectedTicket?.id || null,
          ticketName: selectedTicket?.name || 'Free Ticket',
          quantity: 1,
          price: 0
        }])
      };

      const [order] = await db.insert(orders).values(orderData).returning();

      const ticketPurchaseData = {
        userId: userId || null,
        ticketId: selectedTicket?.id || null,
        eventId,
        orderId: order.id,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        status: 'confirmed',
        purchaseEmail,
        qrCode: `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`
      };

      const [ticketPurchase] = await db.insert(ticketPurchases).values(ticketPurchaseData).returning();

      // Update remaining quantity if ticket type specified
      if (selectedTicket && selectedTicket.remainingQuantity !== null) {
        await db.update(tickets)
          .set({ remainingQuantity: selectedTicket.remainingQuantity - 1 })
          .where(eq(tickets.id, selectedTicket.id));
      }

      console.log("Free ticket claimed successfully:", {
        orderId: order.id,
        ticketPurchaseId: ticketPurchase.id,
        email: purchaseEmail
      });

      res.status(201).json({
        success: true,
        message: "Free ticket claimed successfully!",
        orderId: order.id,
        ticketId: ticketPurchase.id,
        qrCode: ticketPurchase.qrCode
      });

    } catch (error) {
      console.error("Error in non-prefixed free ticket endpoint:", error);
      res.status(500).json({ 
        message: "Internal server error while processing free ticket claim",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

// Helper function to get user email
async function getUserEmail(userId: number): Promise<string | null> {
  try {
    const user = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user.length > 0 ? user[0].email : null;
  } catch (error) {
    console.error("Error fetching user email:", error);
    return null;
  }
}

// Add UUID package to dependencies if not already present
// npm install uuid @types/uuid