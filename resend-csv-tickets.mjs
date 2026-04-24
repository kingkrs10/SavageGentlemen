import pg from 'pg';
import 'dotenv/config';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Database connection
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Brevo SMTP Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp-brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function processTicketsFromCSV() {
  const csvPath = '/Users/sg/Downloads/unified_payments.csv';
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const header = lines[0].split(',');
  
  const getCol = (name) => header.indexOf(name);
  
  const results = [];
  
  // Skip header and Siarrah (line 2)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parser for this specific format
    const cols = line.split(',');
    
    const email = cols[getCol('userEmail (metadata)')] || cols[getCol('customer_email (metadata)')];
    const userId = parseInt(cols[getCol('userId (metadata)')]);
    const eventId = parseInt(cols[getCol('eventId (metadata)')]);
    const ticketName = cols[getCol('ticketName (metadata)')];
    const amount = parseFloat(cols[getCol('Amount')]);
    const paymentIntentId = cols[getCol('PaymentIntent ID')];

    if (!email || isNaN(userId) || isNaN(eventId)) {
      console.log(`Skipping invalid line ${i}: ${email}, ${userId}, ${eventId}`);
      continue;
    }

    results.push({ email, userId, eventId, ticketName, amount, paymentIntentId });
  }

  console.log(`Found ${results.length} tickets to process.`);

  for (const item of results) {
    console.log(`\n--- Processing ${item.email} ---`);
    
    try {
      // 1. Get Event Details
      const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [item.eventId]);
      const event = eventRes.rows[0];
      if (!event) {
        console.error(`Event ${item.eventId} not found`);
        continue;
      }

      // 2. Ensure Order exists
      const orderRes = await pool.query('SELECT * FROM orders WHERE user_id = $1 AND total_amount = $2 AND created_at > \'2026-04-01\'', [item.userId, Math.round(item.amount * 100)]);
      let orderId;
      if (orderRes.rows.length > 0) {
        orderId = orderRes.rows[0].id;
        console.log(`Found existing order: ${orderId}`);
      } else {
        const newOrder = await pool.query(
          'INSERT INTO orders (user_id, total_amount, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
          [item.userId, Math.round(item.amount * 100), 'paid']
        );
        orderId = newOrder.rows[0].id;
        console.log(`Created new order: ${orderId}`);
      }

      // 3. Ensure Ticket Purchase exists
      const qrData = `TICKET-${item.userId}-${item.eventId}-${Date.now()}`;
      const ticketRes = await pool.query('SELECT * FROM ticket_purchases WHERE user_id = $1 AND event_id = $2 AND order_id = $3', [item.userId, item.eventId, orderId]);
      
      let ticket;
      if (ticketRes.rows.length > 0) {
        ticket = ticketRes.rows[0];
        console.log(`Found existing ticket: ${ticket.id}`);
      } else {
        const newTicket = await pool.query(
          'INSERT INTO ticket_purchases (user_id, event_id, order_id, ticket_type, price, qr_code_data, purchase_date) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
          [item.userId, item.eventId, orderId, item.ticketName, item.amount, qrData]
        );
        ticket = newTicket.rows[0];
        console.log(`Created new ticket: ${ticket.id}`);
      }

      // 4. Generate QR Code
      const qrCodeBuffer = await QRCode.toBuffer(ticket.qr_code_data, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      // 5. Send Email
      const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="color: #c01c28; text-align: center;">${event.title}</h2>
          <p>Thank you for your purchase! Here is your ticket. Please present the QR code below at the event entrance.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <div><strong>Date:</strong> ${formattedDate}</div>
            <div><strong>Location:</strong> ${event.location}</div>
            <div><strong>Ticket Type:</strong> ${item.ticketName}</div>
            <div><strong>Price:</strong> $${item.amount.toFixed(2)}</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qrcode" alt="QR Code" width="250" />
          </div>
          <div style="font-size: 12px; color: #666; text-align: center;">Ticket ID: ${ticket.id}</div>
        </div>
      `;

      await transporter.sendMail({
        from: '"Savage Gentlemen" <info@savgent.com>',
        to: item.email,
        subject: `Your ticket for ${event.title}`,
        html,
        attachments: [{
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          cid: 'qrcode'
        }]
      });

      console.log(`✓ Email sent successfully to ${item.email}`);
    } catch (err) {
      console.error(`Failed to process ${item.email}:`, err);
    }
  }

  console.log('\n--- Done ---');
  await pool.end();
}

processTicketsFromCSV();
