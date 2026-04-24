/**
 * Soca Noir Rose - Ticket Recovery Script
 * Run directly in the Render shell:
 *   node recover-tickets-render.mjs
 */
import pg from 'pg';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const { Pool } = pg;

// --- Config from environment ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// --- Recovery Data (from unified_payments.csv) ---
const recoveryData = [
  { email: 'siarrah.rajpaul@icloud.com', userId: 97, eventId: 2, amount: 10.00, ticketName: 'Soca Noir Rose Early Bird female', pi: 'pi_3TP7kIRYYQixBBH20vMM2ArO' },
  { email: 'passanah@jcboe.org', userId: 86, eventId: 2, amount: 15.00, ticketName: 'Soca Noir Rose Early Bird female 2 for 1', pi: 'pi_3TO55lRYYQixBBH20RvVkmi9' },
  { email: 'pemonemo3@gmail.com', userId: 77, eventId: 2, amount: 10.00, ticketName: 'Soca Noir Rose Early Bird female', pi: 'pi_3TMPnyRYYQixBBH211hq0IHS' },
  { email: 'pemonemo3@gmail.com', userId: 77, eventId: 2, amount: 15.00, ticketName: 'Soca Noir Rose Early Bird Men', pi: 'pi_3TMPjKRYYQixBBH21zzQHyGR' },
  { email: 'sobers34@gmail.com', userId: 68, eventId: 2, amount: 15.00, ticketName: 'Soca Noir Rose Early Bird female 2 for 1', pi: 'pi_3TLpQ3RYYQixBBH206vDLIIa' },
  { email: 'natashapeters65@yahoo.com', userId: 60, eventId: 2, amount: 10.00, ticketName: 'Soca Noir Rose Early Bird female', pi: 'pi_3TKjPjRYYQixBBH20xI48Flc' },
  { email: 'Bill11225@yahoo.com', userId: 54, eventId: 2, amount: 10.00, ticketName: 'Soca Noir Rose Early Bird female', pi: 'pi_3TK8DfRYYQixBBH20Lee4mee' },
  { email: 'Bill11225@yahoo.com', userId: 54, eventId: 2, amount: 15.00, ticketName: 'Soca Noir Rose Early Bird Men', pi: 'pi_3TK8C5RYYQixBBH21aCANVxg' },
];

async function run() {
  console.log('🎫 Starting Soca Noir Rose ticket recovery...\n');

  // Verify SMTP
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');
  } catch (e) {
    console.error('❌ SMTP verification failed:', e.message);
    console.log('   Continuing anyway - will attempt sends...\n');
  }

  // Get event info
  const eventRes = await pool.query('SELECT * FROM events WHERE id = 2');
  if (eventRes.rows.length === 0) {
    console.error('❌ Event ID 2 not found!');
    process.exit(1);
  }
  const event = eventRes.rows[0];
  console.log(`📌 Event: ${event.title}\n`);

  let created = 0, sent = 0, skipped = 0, errors = 0;

  for (const item of recoveryData) {
    console.log(`--- Processing: ${item.email} | ${item.ticketName} ---`);

    try {
      // 1. Check if ticket already exists
      const existing = await pool.query(
        `SELECT * FROM ticket_purchases WHERE event_id = $1 AND attendee_email = $2 AND ticket_type = $3`,
        [item.eventId, item.email, item.ticketName]
      );

      let ticket;

      if (existing.rows.length > 0) {
        ticket = existing.rows[0];
        console.log(`   🔎 Ticket already exists (ID: ${ticket.id}). Will resend email.`);
        skipped++;
      } else {
        // 2. Ensure order exists
        let orderId;
        const orderRes = await pool.query('SELECT id FROM orders WHERE payment_id = $1', [item.pi]);

        if (orderRes.rows.length > 0) {
          orderId = orderRes.rows[0].id;
          console.log(`   📋 Found existing order: ${orderId}`);
        } else {
          const newOrder = await pool.query(
            `INSERT INTO orders (user_id, total_amount, status, payment_method, payment_id) 
             VALUES ($1, $2, 'completed', 'stripe', $3) RETURNING id`,
            [item.userId, Math.round(item.amount * 100), item.pi]
          );
          orderId = newOrder.rows[0].id;
          console.log(`   📋 Created new order: ${orderId}`);
        }

        // 3. Create ticket
        const qrCodeData = `EVENT-${item.eventId}-ORDER-${orderId}-${Date.now()}-${crypto.randomInt(1000)}`;
        const ticketRes = await pool.query(
          `INSERT INTO ticket_purchases 
           (user_id, event_id, order_id, qr_code_data, ticket_type, price, attendee_email, attendee_name, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'valid') RETURNING *`,
          [item.userId, item.eventId, orderId, qrCodeData, item.ticketName, item.amount.toString(), item.email, item.email.split('@')[0]]
        );
        ticket = ticketRes.rows[0];
        created++;
        console.log(`   ✅ Created ticket ID: ${ticket.id}`);
      }

      // 4. Send email
      const qr = ticket.qr_code_data;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #e94560, #0f3460); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎟️ Your Ticket</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">${event.title}</p>
          </div>
          <div style="padding: 30px;">
            <div style="background: #16213e; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p><strong>📅 Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>📍 Location:</strong> ${event.location || 'TBA'}</p>
              <p><strong>🎫 Ticket Type:</strong> ${item.ticketName}</p>
              <p><strong>💰 Price:</strong> $${item.amount.toFixed(2)}</p>
            </div>
            <div style="background: #fff; border-radius: 8px; padding: 20px; text-align: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}" 
                   alt="QR Code" style="width: 250px; height: 250px;" />
              <p style="color: #333; font-size: 12px; margin-top: 10px;">Scan this QR code at the entrance</p>
              <p style="color: #666; font-size: 10px; word-break: break-all;">${qr}</p>
            </div>
            <p style="text-align: center; margin-top: 20px; font-size: 14px; opacity: 0.7;">
              Present this email at the event for entry. Thank you for your purchase!
            </p>
          </div>
        </div>`;

      await transporter.sendMail({
        from: '"Savage Gentlemen" <info@savgent.com>',
        to: item.email,
        subject: `Your ticket for ${event.title}`,
        html: html,
      });
      sent++;
      console.log(`   📧 Email sent to ${item.email}`);

    } catch (err) {
      errors++;
      console.error(`   ❌ ERROR: ${err.message}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════');
  console.log(`📊 Recovery Summary:`);
  console.log(`   🆕 Tickets created: ${created}`);
  console.log(`   🔎 Already existed: ${skipped}`);
  console.log(`   📧 Emails sent:     ${sent}`);
  console.log(`   ❌ Errors:          ${errors}`);
  console.log('═══════════════════════════════════════');

  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
