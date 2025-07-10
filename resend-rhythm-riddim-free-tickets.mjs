import { db } from './server/db.ts';
import { sendTicketEmail } from './server/email-mailersend.ts';
import { ticketPurchases, events, users } from './shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function resendRhythmRiddimFreeTickets() {
  try {
    console.log('🎫 Starting email resend for R Y T H Y M > IN< R I D D I M free tickets...');
    
    // Get the event details
    const eventData = await db.select().from(events).where(eq(events.id, 7)).limit(1);
    if (!eventData || eventData.length === 0) {
      console.error('❌ Event not found');
      return;
    }
    
    const event = eventData[0];
    console.log(`📅 Event found: ${event.title}`);
    
    // Get all free ticket purchases for this event
    const freeTickets = await db.select({
      id: ticketPurchases.id,
      attendeeEmail: ticketPurchases.attendeeEmail,
      attendeeName: ticketPurchases.attendeeName,
      qrCodeData: ticketPurchases.qrCodeData,
      ticketType: ticketPurchases.ticketType,
      userId: ticketPurchases.userId,
      orderId: ticketPurchases.orderId,
      createdAt: ticketPurchases.createdAt
    }).from(ticketPurchases)
      .where(
        and(
          eq(ticketPurchases.eventId, 7),
          eq(ticketPurchases.price, 0),
          eq(ticketPurchases.status, 'valid')
        )
      );
    
    console.log(`📝 Found ${freeTickets.length} free ticket registrations`);
    
    if (freeTickets.length === 0) {
      console.log('ℹ️  No free tickets found for this event');
      return;
    }
    
    let emailsSent = 0;
    let emailsFailed = 0;
    
    // Process each free ticket
    for (const ticket of freeTickets) {
      try {
        // Determine email address - use attendee email if available, otherwise look up user email
        let recipientEmail = ticket.attendeeEmail;
        let recipientName = ticket.attendeeName;
        
        if (!recipientEmail && ticket.userId) {
          // Get user email from users table
          const userData = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
          if (userData && userData.length > 0) {
            recipientEmail = userData[0].email;
            recipientName = userData[0].displayName || userData[0].username;
          }
        }
        
        if (!recipientEmail) {
          console.log(`⚠️  Skipping ticket ${ticket.id} - no email address found`);
          continue;
        }
        
        console.log(`📧 Sending ticket email to: ${recipientEmail} (${recipientName})`);
        
        // Ensure QR code data is properly formatted
        const qrCodeData = ticket.qrCodeData || `EVENT-${event.id}-ORDER-${ticket.orderId}-${Date.now()}`;
        
        // Create ticket data object in the correct format
        const ticketData = {
          ticketId: ticket.qrCodeData || `TICKET-${ticket.id}`,
          qrCodeDataUrl: qrCodeData,
          eventName: event.title,
          eventLocation: event.location,
          eventDate: new Date(event.date),
          ticketType: ticket.ticketType || 'Free Ticket',
          ticketPrice: 0,
          purchaseDate: new Date(ticket.createdAt)
        };
        
        // Send the ticket email using the correct function signature
        const emailSent = await sendTicketEmail(ticketData, recipientEmail);
        
        if (emailSent) {
          console.log(`✅ Successfully sent email to ${recipientEmail}`);
          emailsSent++;
        } else {
          console.log(`❌ Failed to send email to ${recipientEmail}`);
          emailsFailed++;
        }
        
        // Small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ticket ${ticket.id}:`, error.message);
        emailsFailed++;
      }
    }
    
    console.log(`\n📊 Email resend completed:`);
    console.log(`✅ Emails sent: ${emailsSent}`);
    console.log(`❌ Emails failed: ${emailsFailed}`);
    console.log(`📝 Total tickets processed: ${freeTickets.length}`);
    
    // Log detailed results
    console.log('\n📋 Detailed results:');
    for (const ticket of freeTickets) {
      const email = ticket.attendeeEmail || 'No email';
      const name = ticket.attendeeName || 'No name';
      const qrCode = ticket.qrCodeData || 'No QR code';
      console.log(`• ${name} (${email}) - QR: ${qrCode}`);
    }
    
  } catch (error) {
    console.error('❌ Error in email resend process:', error);
  }
}

// Run the function
resendRhythmRiddimFreeTickets()
  .then(() => {
    console.log('\n🎉 Email resend process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Email resend process failed:', error);
    process.exit(1);
  });