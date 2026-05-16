import "dotenv/config";
import Stripe from "stripe";
import { storage } from "./server/storage.js";
import { sendTicketEmail } from "./server/email-provider.js";
import { ticketMonitor } from "./server/ticket-monitor.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const paymentIntentIds = [
  "pi_3TUd1qDApTjTnyme1ayY0w86",
  "pi_3TUaccDApTjTnyme074CLL9b",
  "pi_3TUaVuDApTjTnyme1L044BLT",
  "pi_3TUaUIDApTjTnyme0uGvVUt0",
  "pi_3TUaJRDApTjTnyme0E4laUlJ",
  "pi_3TUaHEDApTjTnyme0zISBzTb",
  "pi_3TUa6WDApTjTnyme1FLnw2Cv",
  "pi_3TUGlJDApTjTnyme1CPVbxgy",
  "pi_3TUGjUDApTjTnyme0YmzSjTB",
  "pi_3TUFgzDApTjTnyme0XKvmqhU",
  "pi_3TUFfIDApTjTnyme1iYBBvXf"
];

async function reconcileTickets() {
  console.log(`Starting reconciliation for ${paymentIntentIds.length} payment intents...`);
  
  for (const piId of paymentIntentIds) {
    try {
      console.log(`\nProcessing ${piId}...`);
      const paymentIntent = await stripe.paymentIntents.retrieve(piId);
      
      if (paymentIntent.status !== 'succeeded') {
        console.log(`  Skipping: Status is ${paymentIntent.status}`);
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
        console.log(`  Full metadata:`, metadata);
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
          const customer = await stripe.customers.retrieve(customerId);
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
      
      // Check if order already exists
      // Wait, we don't have a lookup by payment_id natively exported, but we can just blindly create
      // since the ticket was missing
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
      console.error(`  Failed processing ${piId}:`, e);
    }
  }
  
  console.log("\nReconciliation complete.");
  process.exit(0);
}

reconcileTickets();
