import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { sendTicketEmail } from './server/email.js';
import { pool } from './server/db.js';

async function processSocaNoirRoseCSV() {
  console.log('🎫 Starting ticket email resend process from CSV...');
  
  try {
    const csvContent = fs.readFileSync('/Users/sg/Downloads/unified_payments.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Read ${records.length} records from CSV.`);
    
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    for (const record of records) {
      // Look for user email in either customer_email (metadata), userEmail (metadata), or Customer Email
      const email = record['userEmail (metadata)'] || record['customer_email (metadata)'] || record['Customer Email'];
      
      if (!email) {
        console.log(`⚠️  Skipping record with ID ${record.id} - no email found`);
        continue;
      }
      
      const eventId = record['eventId (metadata)'];
      
      // Query the database for this user's tickets for this event
      let query = `
        SELECT 
          tp.id,
          tp.attendee_email,
          tp.attendee_name,
          tp.purchase_date,
          tp.qr_code_data,
          tp.price,
          e.title as event_title,
          e.date as event_date,
          e.location as event_location,
          t.name as ticket_name
        FROM ticket_purchases tp
        LEFT JOIN events e ON tp.event_id = e.id
        LEFT JOIN tickets t ON tp.ticket_id = t.id
        WHERE tp.attendee_email = $1 AND e.id = $2
      `;
      
      const params = [email, eventId || 2]; // Defaulting to 2 if eventId metadata is missing
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        console.log(`   ❓ No tickets found in DB for email: ${email}`);
        notFoundCount++;
        continue;
      }
      
      for (const purchase of result.rows) {
        console.log(`\n📮 Sending ticket to: ${purchase.attendee_email}`);
        console.log(`   Event: ${purchase.event_title}`);
        console.log(`   Ticket: ${purchase.ticket_name}`);
        
        try {
          const emailSent = await sendTicketEmail({
            email: purchase.attendee_email,
            customerName: purchase.attendee_name || 'Valued Customer',
            eventName: purchase.event_title,
            ticketName: purchase.ticket_name,
            eventDate: new Date(purchase.event_date),
            eventLocation: purchase.event_location,
            qrCode: purchase.qr_code_data,
            purchaseDate: new Date(purchase.purchase_date),
            orderId: purchase.id.toString()
          });
          
          if (emailSent) {
            successCount++;
            console.log(`   ✅ Email sent successfully!`);
          } else {
            errorCount++;
            console.log(`   ❌ Failed to send email`);
          }
          
          // Wait 3 seconds between emails to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err) {
          errorCount++;
          console.error(`   ❌ Error sending email:`, err.message);
        }
      }
    }
    
    console.log(`\n🎉 Process completed!`);
    console.log(`   📤 Successfully sent: ${successCount}`);
    console.log(`   ❌ Failed to send: ${errorCount}`);
    console.log(`   ❓ Not found in DB: ${notFoundCount}`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

processSocaNoirRoseCSV();
