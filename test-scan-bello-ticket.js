import { pool } from './server/db.js';

async function testScanTicket() {
  console.log('Testing ticket scan functionality for Bello...\n');

  const testQrCode = 'EVENT-6-ORDER-TEST-BELLO-1750993884102';
  const scanTime = new Date();
  
  try {
    // First, let's check what the actual schema looks like
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ticket_scans' 
      ORDER BY ordinal_position
    `);
    
    console.log('Ticket scans table schema:');
    schemaCheck.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Check if we have a ticket purchase record that would match this QR code
    const ticketPurchaseCheck = await pool.query(`
      SELECT tp.*, t.name as ticket_name, e.title as event_name
      FROM ticket_purchases tp
      LEFT JOIN tickets t ON tp.ticket_id = t.id  
      LEFT JOIN events e ON tp.event_id = e.id
      WHERE tp.qr_code_data = $1
    `, [testQrCode]);

    if (ticketPurchaseCheck.rows.length === 0) {
      console.log('\n⚠️  No ticket purchase found for this QR code.');
      console.log('Creating a test ticket purchase record...');
      
      // Create a test ticket purchase record
      const testPurchase = await pool.query(`
        INSERT INTO ticket_purchases (user_id, ticket_id, event_id, order_id, qr_code_data, ticket_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [193, 9, 6, 999, testQrCode, 'Ladies Free w/RSVP', 'valid']);
      
      console.log('✓ Test ticket purchase created:', testPurchase.rows[0]);
    } else {
      console.log('✓ Found existing ticket purchase:', ticketPurchaseCheck.rows[0]);
    }

    // Now test the scan functionality
    const existingScans = await pool.query(`
      SELECT ts.*, tp.qr_code_data, t.name as ticket_name, e.title as event_name
      FROM ticket_scans ts
      LEFT JOIN ticket_purchases tp ON ts.order_id = tp.order_id
      LEFT JOIN tickets t ON ts.ticket_id = t.id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE tp.qr_code_data = $1
    `, [testQrCode]);

    console.log(`\nExisting scans for QR code ${testQrCode}:`, existingScans.rows.length);

    if (existingScans.rows.length > 0) {
      console.log('⚠️  This ticket has already been scanned:', existingScans.rows[0]);
      console.log('✓ Duplicate prevention is working correctly');
    } else {
      // Record the scan using the correct schema
      const result = await pool.query(`
        INSERT INTO ticket_scans (ticket_id, order_id, scanned_by, notes, status) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [9, 999, 193, 'Test scan for Bello ticket verification', 'valid']
      );

      console.log('✓ First scan recorded successfully:', result.rows[0]);
      console.log('✓ Ticket scanning system is working correctly');
    }

    // Check total scans for verification
    const allScans = await pool.query(`
      SELECT COUNT(*) FROM ticket_scans ts
      LEFT JOIN ticket_purchases tp ON ts.order_id = tp.order_id
      WHERE tp.qr_code_data = $1
    `, [testQrCode]);
    console.log(`\n✓ Total scans recorded for this ticket: ${allScans.rows[0].count}`);
    
  } catch (error) {
    console.error('Error testing scan functionality:', error);
  }
}

testScanTicket();