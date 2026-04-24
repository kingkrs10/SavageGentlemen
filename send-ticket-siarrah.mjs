/**
 * Send Soca Noir Rose ticket to siarrah.rajpaul@icloud.com
 * 
 * Run with:
 *   node --env-file=.env --env-file=.env.local send-ticket-siarrah.mjs
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, or } from 'drizzle-orm';
import { pgTable, serial, integer, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import ws from 'ws';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// ── Config ──────────────────────────────────────────────────────
neonConfig.webSocketConstructor = ws;

const TARGET_EMAIL = 'siarrah.rajpaul@icloud.com';
const TARGET_USER_ID = 97;
const EVENT_ID = 2;
const TICKET_ID = 3;              // ticketId from CSV metadata
const TICKET_NAME = 'Soca Noir Rose Early Bird female';
const AMOUNT = '10.00';
const STRIPE_CHARGE_ID = 'ch_3TP7kIRYYQixBBH20IvoesRm';

// ── Minimal schema (just what we need) ──────────────────────────
const ticketPurchases = pgTable('ticket_purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  ticketId: integer('ticket_id'),
  eventId: integer('event_id').notNull(),
  orderId: integer('order_id').notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow().notNull(),
  status: text('status').default('valid'),
  qrCodeData: text('qr_code_data').notNull().unique(),
  ticketType: text('ticket_type').default('standard'),
  price: numeric('price'),
  attendeeEmail: text('attendee_email'),
  attendeeName: text('attendee_name'),
  scanned: boolean('scanned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: timestamp('date').notNull(),
  location: text('location'),
});

const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  paymentId: text('payment_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── DB connection ───────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 15000,
});
const db = drizzle({ client: pool });

// ── Email (Brevo) ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN || '91b965002@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// ── Main ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎫 Sending Soca Noir Rose ticket to ${TARGET_EMAIL}\n`);

  // 1. Check if ticket already exists in DB
  console.log('🔍 Checking database for existing tickets...');
  let userTickets = await db.select().from(ticketPurchases)
    .where(
      and(
        eq(ticketPurchases.eventId, EVENT_ID),
        eq(ticketPurchases.status, 'valid'),
        or(
          eq(ticketPurchases.attendeeEmail, TARGET_EMAIL),
          eq(ticketPurchases.userId, TARGET_USER_ID)
        )
      )
    );

  if (userTickets.length > 0) {
    console.log(`   ✅ Found ${userTickets.length} existing ticket(s) in DB.`);
  } else {
    console.log('   ⚙️  No existing tickets found. Creating ticket record...');

    // Find or create order
    let orderId;
    const existingOrders = await db.select().from(orders)
      .where(eq(orders.paymentId, STRIPE_CHARGE_ID))
      .limit(1);

    if (existingOrders.length > 0) {
      orderId = existingOrders[0].id;
      console.log(`   📋 Found existing order ID: ${orderId}`);
    } else {
      const newOrder = await db.insert(orders).values({
        userId: TARGET_USER_ID,
        totalAmount: 1000, // $10 in cents
        status: 'completed',
        paymentMethod: 'stripe',
        paymentId: STRIPE_CHARGE_ID,
      }).returning({ id: orders.id });
      orderId = newOrder[0].id;
      console.log(`   📋 Created new order ID: ${orderId}`);
    }

    // Generate QR code data
    const qrCodeData = `EVENT-${EVENT_ID}-ORDER-${orderId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Insert ticket
    const inserted = await db.insert(ticketPurchases).values({
      userId: TARGET_USER_ID,
      ticketId: TICKET_ID,
      eventId: EVENT_ID,
      orderId: orderId,
      qrCodeData: qrCodeData,
      ticketType: TICKET_NAME,
      price: AMOUNT,
      attendeeEmail: TARGET_EMAIL,
      attendeeName: 'Siarrah Rajpaul',
      status: 'valid',
    }).returning();

    userTickets = inserted;
    console.log(`   ✅ Created ticket ID: ${inserted[0].id}`);
  }

  // 2. Get event details
  const eventRecords = await db.select().from(events).where(eq(events.id, EVENT_ID));
  if (eventRecords.length === 0) {
    console.error('❌ Event not found!');
    process.exit(1);
  }
  const event = eventRecords[0];
  console.log(`   📅 Event: ${event.title}`);

  // 3. Send email for each ticket
  for (const ticket of userTickets) {
    const qrData = ticket.qrCodeData;
    console.log(`\n📮 Sending ticket email...`);
    console.log(`   Ticket ID: ${ticket.id}`);
    console.log(`   QR Data: ${qrData}`);

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    // Format dates
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const subject = `Your ticket for ${event.title}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Ticket - ${event.title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #c01c28; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; }
          .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 Your Ticket Confirmation</h1>
          <h2>${event.title}</h2>
        </div>
        <div class="content">
          <p>Thank you for your registration! Your ticket has been confirmed.</p>
          <div class="event-details">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Location:</strong> ${event.location || 'TBA'}</p>
            <p><strong>Ticket Type:</strong> ${ticket.ticketType || 'Standard Ticket'}</p>
            ${ticket.price ? `<p><strong>Price:</strong> $${ticket.price}</p>` : ''}
          </div>
          <div class="qr-section">
            <h3>Your QR Code</h3>
            <p>Present this QR code at the event entrance:</p>
            <img src="${qrCodeImage}" alt="QR Code" style="max-width: 300px; height: auto;">
            <p style="font-size: 12px; color: #666; margin-top: 10px;">QR Code: ${qrData}</p>
          </div>
          <div class="important">
            <strong>Important:</strong>
            <ul>
              <li>Save this email on your phone</li>
              <li>Present the QR code at the event entrance</li>
              <li>Arrive early to avoid lines</li>
              <li>This ticket is valid for one entry only</li>
            </ul>
          </div>
          <div class="footer">
            <p>Thank you for choosing Savage Gentlemen!</p>
            <p>Questions? Contact us at: info@savgent.com</p>
            <p>Follow us for updates and future events</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Verify SMTP and send
    await transporter.verify();
    console.log('   ✅ SMTP connection verified');

    const result = await transporter.sendMail({
      from: 'Savage Gentlemen <info@savgent.com>',
      to: TARGET_EMAIL,
      subject,
      html,
      text: `Your Ticket for ${event.title}\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nLocation: ${event.location || 'TBA'}\nTicket Type: ${ticket.ticketType}\n\nQR Code: ${qrData}\n\nPresent this QR code at the event entrance.\n\nQuestions? Contact info@savgent.com`,
    });

    console.log(`   ✅ Email sent! Message ID: ${result.messageId}`);
  }

  console.log(`\n🎉 Done! Ticket sent to ${TARGET_EMAIL}`);
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
