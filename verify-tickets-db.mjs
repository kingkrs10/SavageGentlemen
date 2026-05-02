import 'dotenv/config';
import { config } from 'dotenv';
import fs from 'fs';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local', override: true });
config({ path: '.env', override: false });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('=== TICKET DATABASE VERIFICATION ===\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database successfully.\n');
  } catch (err) {
    console.error('❌ Failed to connect to database. Ensure network is working.', err.message);
    process.exit(1);
  }

  // Read the CSV file
  let csvContent;
  try {
    csvContent = fs.readFileSync('/Users/sg/Downloads/unified_payments.csv', 'utf8');
  } catch (err) {
    console.error('❌ Could not read CSV file:', err.message);
    process.exit(1);
  }

  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  console.log(`Analyzing ${lines.length - 1} purchases from CSV...\n`);
  
  console.log('| Customer Email | User ID | Ticket ID | DB Tickets Found | Status |');
  console.log('|----------------|---------|-----------|------------------|--------|');

  let missingCount = 0;
  let verifiedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Split by comma
    const cols = lines[i].split(',');

    const email = cols[headers.indexOf('userEmail (metadata)')] || 
                 cols[headers.indexOf('Customer Email')] || 
                 cols[headers.indexOf('customer_email (metadata)')] || 
                 'Unknown';
                 
    const userId = cols[headers.indexOf('userId (metadata)')];
    const ticketId = cols[headers.indexOf('ticketId (metadata)')];
    const eventId = cols[headers.indexOf('eventId (metadata)')];

    if (!userId || !ticketId) {
      console.log(`| ${email.padEnd(14)} | N/A     | N/A       | N/A              | ⚠️ Missing Metadata |`);
      continue;
    }

    try {
      // Look up tickets directly by user, event, and ticket type
      const ticketRes = await client.query(
        'SELECT id, order_id FROM ticket_purchases WHERE user_id = $1 AND event_id = $2 AND ticket_id = $3',
        [userId, eventId, ticketId]
      );

      const ticketCount = ticketRes.rows.length;

      if (ticketCount === 0) {
        console.log(`| ${email.substring(0,14).padEnd(14)} | ${userId.padEnd(7)} | ${ticketId.padEnd(9)} | 0                | ❌ NO TICKETS |`);
        missingCount++;
      } else {
        console.log(`| ${email.substring(0,14).padEnd(14)} | ${userId.padEnd(7)} | ${ticketId.padEnd(9)} | ${ticketCount.toString().padEnd(16)} | ✅ VERIFIED |`);
        verifiedCount++;
      }

    } catch (err) {
      console.error(`Error checking user ${userId}:`, err.message);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Verified Purchases (Tickets Exist): ${verifiedCount}`);
  console.log(`❌ Missing Purchases (No Order or No Tickets): ${missingCount}`);
  
  client.release();
  await pool.end();
}

main().catch(console.error);
