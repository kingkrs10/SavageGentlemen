import 'dotenv/config';
import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local', override: true });
config({ path: '.env', override: false });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const purchasesToInsert = [
  {
    userId: 101,
    eventId: 2,
    ticketId: 3,
    email: 'gmilligan4@gmail.com',
    ticketName: 'Soca Noir Rose Early Bird female',
    amount: 1000, // cents
    paymentId: 'pi_3TQyPPRYYQixBBH20', // From CSV payment intent approximation
    chargeId: 'ch_3TQyPPRYYQixBBH20zXTzObh',
    purchaseDate: '2026-04-27 23:20:17',
    qrCodeData: 'EVENT-2-CHARGE-ch_3TQyPPRYYQixBBH20zXTzObh-USER-101-1777414136835'
  },
  {
    userId: 101,
    eventId: 2,
    ticketId: 2,
    email: 'gmilligan4@gmail.com',
    ticketName: 'Soca Noir Rose Early Bird Men',
    amount: 1500, // cents
    paymentId: 'pi_3TQovaRYYQixBBH20',
    chargeId: 'ch_3TQovaRYYQixBBH207rkimpv',
    purchaseDate: '2026-04-27 13:11:16',
    qrCodeData: 'EVENT-2-CHARGE-ch_3TQovaRYYQixBBH207rkimpv-USER-101-1777414139659'
  }
];

async function main() {
  console.log('=== FIXING MISSING TICKET PURCHASES ===\n');

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (const p of purchasesToInsert) {
      console.log(`Processing: ${p.ticketName} for ${p.email}`);

      // 1. Check if order exists (just in case)
      const orderRes = await client.query(
        'SELECT id FROM orders WHERE payment_id = $1 OR payment_id = $2',
        [p.paymentId, p.chargeId]
      );

      let orderId;
      if (orderRes.rows.length === 0) {
        // Create the missing order
        const insertOrder = await client.query(
          `INSERT INTO orders (user_id, total_amount, status, payment_method, payment_id, created_at)
           VALUES ($1, $2, 'completed', 'stripe', $3, $4)
           RETURNING id`,
          [p.userId, p.amount, p.chargeId, p.purchaseDate]
        );
        orderId = insertOrder.rows[0].id;
        console.log(`   ✅ Created missing Order ID: ${orderId}`);
      } else {
        orderId = orderRes.rows[0].id;
        console.log(`   ℹ️ Order already exists: ${orderId}`);
      }

      // 2. Check if ticket_purchase exists
      const ticketRes = await client.query(
        'SELECT id FROM ticket_purchases WHERE qr_code_data = $1',
        [p.qrCodeData]
      );

      if (ticketRes.rows.length === 0) {
        // Create the missing ticket purchase
        const insertTicket = await client.query(
          `INSERT INTO ticket_purchases (
            user_id, ticket_id, event_id, order_id, purchase_date, 
            status, qr_code_data, ticket_type, price, attendee_email, attendee_name
          ) VALUES ($1, $2, $3, $4, $5, 'valid', $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            p.userId, p.ticketId, p.eventId, orderId, p.purchaseDate,
            p.qrCodeData, p.ticketName, p.amount / 100, p.email, 'G Milligan'
          ]
        );
        console.log(`   ✅ Created missing Ticket Purchase ID: ${insertTicket.rows[0].id}`);
      } else {
        console.log(`   ℹ️ Ticket already exists in DB!`);
      }
      console.log('');
    }

    await client.query('COMMIT');
    console.log('✅ ALL TRANSACTIONS COMMITTED SUCCESSFULLY');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR OCCURRED. ROLLED BACK TRANSACTIONS.', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
