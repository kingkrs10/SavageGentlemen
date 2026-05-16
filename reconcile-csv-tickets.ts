import "dotenv/config";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { storage } from "./server/storage.js";
import { db } from "./server/db.js";
import { orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ticketMonitor } from "./server/ticket-monitor.js";

async function reconcileFromCsv() {
  const csvPath = "./unified_payments1415.csv";
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading payments from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`Found ${records.length} payments in the CSV.\n`);

  for (const record of records) {
    const chargeId = record["id"];
    const status = record["Status"];
    
    if (status !== "Paid") {
      console.log(`Skipping ${chargeId} because status is ${status}`);
      continue;
    }

    try {
      console.log(`Processing charge ${chargeId}...`);
      
      // Use the charge ID as the payment ID
      const paymentId = chargeId;
      
      // Check if order already exists in the database
      const existingOrder = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
      if (existingOrder && existingOrder.length > 0) {
        console.log(`  Skipping: Order ${existingOrder[0].id} already exists for this payment.`);
        continue;
      }
      
      const amount = parseFloat(record["Amount"]); // 10.00
      const amountCents = Math.round(amount * 100); // 1000
      
      const eventIdStr = record["eventId (metadata)"];
      const ticketIdStr = record["ticketId (metadata)"];
      const userIdStr = record["userId (metadata)"];
      
      const eventId = eventIdStr ? parseInt(eventIdStr) : null;
      const ticketId = ticketIdStr ? parseInt(ticketIdStr) : null;
      let userId = userIdStr ? parseInt(userIdStr) : null;
      
      const ticketName = record["ticketName (metadata)"] || "General Admission";
      let email = record["userEmail (metadata)"] || record["customer_email (metadata)"] || record["Customer Email"];
      let customerName = record["customer_name (metadata)"] || "Guest User";
      
      if (!eventId) {
        console.log(`  Skipping: No eventId in metadata.`);
        continue;
      }
      
      let user = null;
      
      if (userId) {
        try {
          user = await storage.getUser(userId);
          if (user && !email && user.email) email = user.email;
        } catch (e) {}
      }
      
      if (!user && email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user && email) {
        try {
          user = await storage.createUser({
            username: `guest_${Date.now()}_${Math.floor(Math.random()*1000)}`,
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
        totalAmount: amountCents,
        status: 'completed',
        paymentMethod: 'stripe',
        paymentId: paymentId,
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
        price: amountCents.toString(),
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
          amount, // Standard dollar amount
          event.time || undefined
        );
        console.log(`  Email delivery initiated.`);
      } catch (e) {
        console.log(`  Email delivery error: ${e}`);
      }
      
    } catch (e) {
      console.error(`  Failed processing ${chargeId}:`, e);
    }
  }
  
  console.log("\nReconciliation complete.");
  process.exit(0);
}

reconcileFromCsv().catch(console.error);
