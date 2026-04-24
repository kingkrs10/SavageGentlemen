import { db } from './server/db.ts';
import { sendTicketEmail } from './server/email-provider.ts';
import { ticketPurchases, events, users } from './shared/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function resendAllTickets() {
  try {
    console.log('🎫 Starting email resend for ALL valid tickets...');
    
    // Get all valid ticket purchases
    const allValidTickets = await db.select({
      id: ticketPurchases.id,
      attendeeEmail: ticketPurchases.attendeeEmail,
      attendeeName: ticketPurchases.attendeeName,
      qrCodeData: ticketPurchases.qrCodeData,
      ticketType: ticketPurchases.ticketType,
      price: ticketPurchases.price,
      userId: ticketPurchases.userId,
      orderId: ticketPurchases.orderId,
      eventId: ticketPurchases.eventId,
      createdAt: ticketPurchases.createdAt
    }).from(ticketPurchases)
      .where(eq(ticketPurchases.status, 'valid'));
    
    console.log(`📝 Found ${allValidTickets.length} total valid ticket registrations`);
    
    if (allValidTickets.length === 0) {
      console.log('ℹ️  No valid tickets found');
      return;
    }

    // Pre-fetch all events to avoid querying per ticket
    const eventIds = [...new Set(allValidTickets.map(t => t.eventId))];
    const eventRecords = await db.select().from(events).where(inArray(events.id, eventIds));
    const eventsMap = Object.fromEntries(eventRecords.map(e => [e.id, e]));

    let emailsSent = 0;
    let emailsFailed = 0;
    
    // Process each ticket
    for (const ticket of allValidTickets) {
      try {
        const event = eventsMap[ticket.eventId];
        if (!event) {
          console.log(`⚠️  Skipping ticket ${ticket.id} - event not found`);
          continue;
        }

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
        
        console.log(`📧 Sending ticket email to: ${recipientEmail} (${recipientName}) for event: ${event.title}`);
        
        // Ensure QR code data is properly formatted
        const qrCodeData = ticket.qrCodeData || `EVENT-${event.id}-ORDER-${ticket.orderId}-${Date.now()}`;
        
        // Create ticket data object in the correct format
        const ticketData = {
          ticketId: ticket.qrCodeData || `TICKET-${ticket.id}`,
          qrCodeDataUrl: qrCodeData,
          eventName: event.title,
          eventLocation: event.location || 'TBA',
          eventDate: new Date(event.date),
          ticketType: ticket.ticketType || 'Standard Ticket',
          ticketPrice: ticket.price ? Number(ticket.price) : 0,
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
        
        // Small delay to avoid overwhelming the email service (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ticket ${ticket.id}:`, error.message);
        emailsFailed++;
      }
    }
    
    console.log(`\n📊 Email resend completed:`);
    console.log(`✅ Emails sent: ${emailsSent}`);
    console.log(`❌ Emails failed: ${emailsFailed}`);
    console.log(`📝 Total tickets processed: ${allValidTickets.length}`);
    
  } catch (error) {
    console.error('❌ Error in email resend process:', error);
  }
}

// Run the function
resendAllTickets()
  .then(() => {
    console.log('\n🎉 Email resend process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Email resend process failed:', error);
    process.exit(1);
  });
