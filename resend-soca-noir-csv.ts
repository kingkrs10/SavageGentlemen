import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

import { sendTicketEmail } from './server/email-provider.ts';
import { db } from './server/db.ts';
import { ticketPurchases, events, orders, users } from './shared/schema.ts';
import { eq, and, or } from 'drizzle-orm';

async function processSocaNoirRoseCSV() {
  console.log('🎫 Starting ticket generation and email resend process from CSV...');
  
  try {
    const csvPath = '/Users/sg/Downloads/unified_payments.csv';
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at ${csvPath}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Read ${records.length} records from CSV.`);
    
    let successCount = 0;
    let errorCount = 0;
    let generatedCount = 0;
    let skippedCount = 0;
    
    for (const record of records) {
      // Improved email extraction from various possible columns
      const email = record['userEmail (metadata)'] || 
                    record['customer_email (metadata)'] || 
                    record['Customer Email'] ||
                    record['customer_email'];

      const userIdStr = record['userId (metadata)'];
      const userId = userIdStr ? Number(userIdStr) : null;
      
      if (!email && !userId) {
        console.log(`⚠️  Skipping record with PaymentIntent ID ${record['PaymentIntent ID']} - no email or userId found`);
        skippedCount++;
        continue;
      }
      
      const eventId = Number(record['eventId (metadata)']) || 2;
      const ticketIdStr = record['ticketId (metadata)'];
      const ticketId = ticketIdStr ? Number(ticketIdStr) : null;
      const ticketName = record['ticketName (metadata)'] || 'Standard Ticket';
      const amountStr = record['Amount'] || record['authoritativeAmount (metadata)'] || '0';
      const priceInCents = Math.round(parseFloat(amountStr) * 100);
      const paymentIntentId = record['PaymentIntent ID'] || record['id'];
      
      console.log(`\n--- Processing: ${email || 'User ID: ' + userId} ---`);

      // 1. Ensure user exists or use a default
      let effectiveUserId = userId;
      if (!effectiveUserId) {
        // Try to find user by email
        const userRecords = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userRecords.length > 0) {
          effectiveUserId = userRecords[0].id;
        } else {
          // Use admin or first user as fallback for legacy guest purchases
          effectiveUserId = 1; 
        }
      }

      // 2. Build conditions to find existing tickets
      const conditions = [];
      if (email) conditions.push(eq(ticketPurchases.attendeeEmail, email));
      if (userId) conditions.push(eq(ticketPurchases.userId, userId));
      
      const userCondition = conditions.length > 1 ? or(...conditions) : conditions[0];

      let userTickets = await db.select().from(ticketPurchases)
        .where(
          and(
            eq(ticketPurchases.eventId, eventId),
            eq(ticketPurchases.status, 'valid'),
            userCondition
          )
        );
      
      if (userTickets.length === 0) {
        console.log(`   ⚙️  No valid tickets found in DB for ${email}. GENERATING NOW...`);
        
        // 3. Find or create an order
        let orderId;
        const existingOrders = await db.select().from(orders).where(eq(orders.paymentId, paymentIntentId)).limit(1);
        
        if (existingOrders.length > 0) {
          orderId = existingOrders[0].id;
          console.log(`   📦 Found existing order ID: ${orderId}`);
        } else {
          console.log(`   📦 Creating new order for payment: ${paymentIntentId}`);
          const newOrder = await db.insert(orders).values({
            userId: effectiveUserId,
            totalAmount: priceInCents,
            status: 'completed',
            paymentMethod: 'stripe',
            paymentId: paymentIntentId,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning({ id: orders.id });
          
          if (newOrder.length > 0) {
            orderId = newOrder[0].id;
          } else {
            throw new Error(`Failed to create order for ${email}`);
          }
        }

        // 4. Generate the QR Code Data
        const qrCodeData = `EVENT-${eventId}-ORDER-${orderId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 5. Insert the ticket
        const inserted = await db.insert(ticketPurchases).values({
          userId: effectiveUserId,
          ticketId: ticketId,
          eventId: eventId,
          orderId: orderId,
          qrCodeData: qrCodeData,
          ticketType: ticketName,
          price: amountStr,
          attendeeEmail: email,
          attendeeName: record['customer_name (metadata)'] || record['Card Name'] || email.split('@')[0],
          status: 'valid'
        }).returning();

        userTickets = inserted;
        generatedCount += inserted.length;
        console.log(`   ✅ Successfully generated ticket ID ${inserted[0].id}`);
      } else {
        console.log(`   🔎 Found ${userTickets.length} existing tickets in DB`);
      }

      // 6. Send/Resend Emails
      for (const ticket of userTickets) {
        const eventRecords = await db.select().from(events).where(eq(events.id, ticket.eventId));
        if (eventRecords.length === 0) {
          console.error(`   ❌ Event ${ticket.eventId} not found for ticket ${ticket.id}`);
          continue;
        }
        const event = eventRecords[0];

        const recipientEmail = ticket.attendeeEmail || email;
        const recipientName = ticket.attendeeName || 'Valued Customer';

        console.log(`   📮 Sending ticket to: ${recipientEmail}`);
        
        try {
          const ticketData = {
            ticketId: ticket.qrCodeData,
            qrCodeDataUrl: ticket.qrCodeData,
            eventName: event.title,
            eventLocation: event.location || 'TBA',
            eventDate: new Date(event.date),
            ticketType: ticket.ticketType || 'Standard Ticket',
            ticketPrice: ticket.price ? Number(ticket.price) : 0,
            purchaseDate: ticket.purchaseDate || new Date()
          };
          
          const emailSent = await sendTicketEmail(ticketData, recipientEmail);
          
          if (emailSent) {
            successCount++;
            console.log(`   ✅ Email sent successfully!`);
          } else {
            errorCount++;
            console.log(`   ❌ Failed to send email (provider returned false)`);
          }
          
          // Small delay to be nice to the SMTP server
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          errorCount++;
          console.error(`   ❌ Error sending email:`, err.message);
        }
      }
    }
    
    console.log(`\n--- 🏁 Recovery Process Summary 🏁 ---`);
    console.log(`   Read: ${records.length} records`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Generated: ${generatedCount}`);
    console.log(`   Sent: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Critical Error during recovery:', err);
    process.exit(1);
  }
}

processSocaNoirRoseCSV();
