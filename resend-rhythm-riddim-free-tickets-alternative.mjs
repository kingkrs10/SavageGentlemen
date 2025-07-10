import { sendTicketEmail } from './server/email-provider.ts';
import { storage } from './server/storage.ts';

// Resend all free tickets using alternative email provider
async function resendRhythmRiddimFreeTicketsAlternative() {
  try {
    console.log('🎫 Starting alternative email delivery for R Y T H Y M > IN< R I D D I M free tickets...');
    
    // Get the event details
    const eventId = 7; // R Y T H Y M > IN< R I D D I M
    const event = await storage.getEventById(eventId);
    
    if (!event) {
      console.error('❌ Event not found');
      return;
    }
    
    console.log(`📅 Event found: ${event.title}`);
    
    // Get all free ticket purchases for this event
    const freeTickets = await storage.getAllFreeTicketRegistrations(eventId);
    
    if (!freeTickets || freeTickets.length === 0) {
      console.log('ℹ️ No free ticket registrations found');
      return;
    }
    
    console.log(`📝 Found ${freeTickets.length} free ticket registrations`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Send emails to all free ticket holders
    for (const ticket of freeTickets) {
      try {
        const recipientEmail = ticket.email;
        const recipientName = ticket.name || 'Guest';
        
        if (!recipientEmail || recipientEmail === 'null' || recipientEmail === 'undefined') {
          console.log(`⚠️ Skipping ticket ${ticket.id} - no valid email address`);
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
        
        // Send the ticket email using the alternative provider
        const emailSent = await sendTicketEmail(ticketData, recipientEmail);
        
        if (emailSent) {
          console.log(`✅ Successfully sent email to ${recipientEmail}`);
          successCount++;
        } else {
          console.log(`❌ Failed to send email to ${recipientEmail}`);
          failureCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error sending email to ${ticket.email}:`, error.message);
        failureCount++;
      }
    }
    
    console.log('\n📊 EMAIL DELIVERY SUMMARY');
    console.log('=========================');
    console.log(`✅ Successful deliveries: ${successCount}`);
    console.log(`❌ Failed deliveries: ${failureCount}`);
    console.log(`📧 Total attempts: ${successCount + failureCount}`);
    console.log(`🎯 Success rate: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 ALTERNATIVE EMAIL DELIVERY COMPLETE!');
      console.log('✅ Free ticket holders have received their QR codes');
      console.log('🔄 Alternative email provider is working successfully');
    } else {
      console.log('\n⚠️ No emails were delivered successfully');
      console.log('🔧 Please check your email provider configuration');
    }
    
  } catch (error) {
    console.error('❌ Error in alternative email delivery:', error);
  }
}

// Run the alternative email delivery
resendRhythmRiddimFreeTicketsAlternative();