import { sendTicketEmail } from './server/email-brevo.js';

async function sendComplimentaryTickets() {
  try {
    console.log('Starting to send complimentary tickets to Jclay using working email service...');
    
    const ticketData = {
      eventName: 'R Y T H Y M > IN< R I D D I M',
      eventDate: new Date('2025-07-25T22:00:00'),
      eventLocation: 'The Ainsworth, Hoboken NJ',
      ticketId: '110-111', // Combined ticket reference
      qrCodeDataUrl: 'EVENT-7-ORDER-149-1753404658-1', // Primary QR code
      ticketType: 'Ladies General Admission (Complimentary - 2 Tickets)',
      ticketPrice: 0,
      purchaseDate: new Date()
    };

    console.log('Sending email to clayton7j@gmail.com...');
    console.log('Event:', ticketData.eventName);
    console.log('Date:', ticketData.eventDate);
    
    // Call the Brevo email function directly
    const result = await sendTicketEmail(ticketData, 'clayton7j@gmail.com');

    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
      
      return {
        success: true,
        recipient: 'clayton7j@gmail.com',
        ticketCount: 2
      };
    } else {
      throw new Error('Email service returned false');
    }

  } catch (error) {
    console.error('❌ Failed to send complimentary tickets:', error);
    throw error;
  }
}

// Execute the function
sendComplimentaryTickets()
  .then(result => {
    console.log('\n🎉 COMPLIMENTARY TICKETS EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 Delivered to: ${result.recipient}`);
    console.log(`🎫 Ticket count: ${result.ticketCount}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });