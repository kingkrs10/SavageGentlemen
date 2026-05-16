import "dotenv/config";
import Stripe from "stripe";
import { storage } from "./server/storage.js";
import { db } from "./server/db.js";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ticketMonitor } from "./server/ticket-monitor.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

async function reconcileRecentTickets() {
  console.log("Fetching successful payment intents from the last 48 hours...");
  
  const twoDaysAgo = Math.floor(Date.now() / 1000) - (48 * 60 * 60);
  
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  const recentPaymentIntents = [];

  while (hasMore) {
    const response = await stripe.paymentIntents.list({
      created: { gte: twoDaysAgo },
      limit: 100,
      starting_after: startingAfter,
    });

    for (const pi of response.data) {
      if (pi.status === 'succeeded') {
        recentPaymentIntents.push(pi);
      }
    }

    if (response.has_more && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${recentPaymentIntents.length} succeeded payment intents in the last 48 hours.`);

  for (const paymentIntent of recentPaymentIntents) {
    try {
      console.log(`\nProcessing ${paymentIntent.id}...`);
      
      // Check if order already exists in the database
      const existingOrder = await db.select().from(orders).where(eq(orders.paymentId, paymentIntent.id)).limit(1);
      if (existingOrder && existingOrder.length > 0) {
        console.log(`  Skipping: Order ${existingOrder[0].id} already exists for this payment.`);
        continue;
      }
      
      const amount = paymentIntent.amount / 100;
      const metadata = paymentIntent.metadata || {};
      
      // Extract metadata
      const eventId = metadata.eventId ? parseInt(metadata.eventId) : null;
      const ticketId = metadata.ticketId ? parseInt(metadata.ticketId) : null;
      const ticketName = metadata.ticketName || 'General Admission';
      const payerEmail = paymentIntent.receipt_email;
      const customerId = paymentIntent.customer;
      
      let email = payerEmail || metadata.userEmail || null;
      let user = null;
      let customerName = 'Guest User';
      
      if (!eventId) {
        console.log(`  Skipping: No eventId in metadata. Metadata keys:`, Object.keys(metadata));
        continue;
      }
      
      // Find user
      if (metadata.userId) {
        try {
          user = await storage.getUser(parseInt(metadata.userId));
          if (user && !email) email = user.email;
        } catch (e) {}
      }
      
      if (customerId && typeof customerId === 'string') {
        try {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          if (customer && !customer.deleted) {
            if (!email && customer.email) email = customer.email;
            if (customer.name) customerName = customer.name;
            
            if (!user && customer.metadata?.userId) {
              user = await storage.getUser(parseInt(customer.metadata.userId));
            } else if (!user && email) {
              user = await storage.getUserByEmail(email);
            }
          }
        } catch (e) {}
      }
      
      if (!user && email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user && email) {
        try {
          user = await storage.createUser({
            username: `guest_${Date.now()}`,
            password: '',
            displayName: customerName,
            email: email,
            isGuest: true,
            role: 'user'
          });
        } catch (e) {
          console.log(`  Error creating guest user: ${e}`);
        }
      }
      
      if (!user) {
        console.log(`  Error: Could not determine user for this payment.`);
        continue;
      }
      
      if (!email) {
        console.log(`  Error: Could not determine email for user ${user.id}.`);
        continue;
      }
      
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount: paymentIntent.amount,
        status: 'completed',
        paymentMethod: 'stripe',
        paymentId: paymentIntent.id,
        affiliateId: null
      });
      
      console.log(`  Created order ${order.id}.`);
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        console.log(`  Error: Event ${eventId} not found.`);
        continue;
      }
      
      const ticketData = {
        orderId: order.id,
        eventId: eventId,
        ticketId: ticketId,
        status: 'valid',
        userId: user.id,
        purchaseDate: new Date(),
        qrCodeData: `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`,
        ticketType: ticketName,
        price: paymentIntent.amount.toString(),
        attendeeEmail: email,
        attendeeName: customerName
      };
      
      const ticket = await storage.createTicketPurchase(ticketData);
      console.log(`  Created ticket ${ticket.id} for user ${user.id} (${email}).`);
      
      // Try to deliver email
      try {
        await ticketMonitor.ensureTicketDelivery(
          ticket.id,
          order.id,
          user.id,
          email,
          event.title,
          ticket.qrCodeData,
          event.location,
          event.date,
          ticketName,
          amount,
          event.time || undefined
        );
        console.log(`  Email delivery initiated.`);
      } catch (e) {
        console.log(`  Email delivery error: ${e}`);
      }
      
    } catch (e) {
      console.error(`  Failed processing ${paymentIntent.id}:`, e);
    }
  }
  
  console.log("\nReconciliation complete.");
  process.exit(0);
}

reconcileRecentTickets().catch(console.error);
