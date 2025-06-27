// Resend ticket confirmations for today's purchases
// Run with: node resend-tickets-today.js

const { sendTicketEmail } = require('./server/email');
const { pool } = require('./server/db');

async function resendTodaysTickets() {
  console.log('🎫 Starting ticket email resend process for today\'s purchases...');
  
  try {
    // Get today's ticket purchases with email addresses
    const query = `
      SELECT 
        tp.id as purchase_id,
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
      WHERE tp.purchase_date >= CURRENT_DATE
        AND tp.attendee_email IS NOT NULL
        AND tp.attendee_email != ''
      ORDER BY tp.purchase_date DESC
    `;
    
    const result = await pool.query(query);
    const purchases = result.rows;
    
    console.log(`📧 Found ${purchases.length} tickets to resend for today`);
    
    if (purchases.length === 0) {
      console.log('No tickets with email addresses found for today');
      return;
    }
    
    // Send email for each purchase
    for (const purchase of purchases) {
      console.log(`\n📮 Sending ticket to: ${purchase.attendee_email}`);
      console.log(`   Event: ${purchase.event_title}`);
      console.log(`   Ticket: ${purchase.ticket_name}`);
      console.log(`   Price: $${(purchase.price / 100).toFixed(2)} CAD`);
      
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
          orderId: purchase.purchase_id.toString()
        });
        
        if (emailSent) {
          console.log(`   ✅ Email sent successfully!`);
        } else {
          console.log(`   ❌ Failed to send email`);
        }
        
        // Wait 2 seconds between emails to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Error sending email: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Ticket resend process completed!');
    
  } catch (error) {
    console.error('💥 Error in resend process:', error);
  } finally {
    await pool.end();
  }
}

// Run the resend process
resendTodaysTickets();