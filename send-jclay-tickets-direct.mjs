import { sendTicketEmail } from './server/email-provider.js';

async function sendComplimentaryTickets() {
  try {
    console.log('Starting to send complimentary tickets to Jclay...');
    
    const ticketData = {
      userName: 'Jclay',
      userEmail: 'clayton7j@gmail.com',
      eventTitle: 'R Y T H Y M > IN< R I D D I M',
      eventDate: 'Friday, July 25, 2025',
      eventTime: '10:00 PM',
      eventLocation: 'The Ainsworth, Hoboken NJ',
      orderId: 149,
      tickets: [
        {
          id: 110,
          qrCode: 'EVENT-7-ORDER-149-1753404658-1',
          ticketType: 'Ladies General Admission (Complimentary)'
        },
        {
          id: 111,
          qrCode: 'EVENT-7-ORDER-149-1753404658-2', 
          ticketType: 'Ladies General Admission (Complimentary)'
        }
      ]
    };

    console.log('Sending email to:', ticketData.userEmail);
    
    // Call the email function directly
    const result = await sendTicketEmail({
      email: ticketData.userEmail,
      userName: ticketData.userName,
      eventTitle: ticketData.eventTitle,
      eventDate: ticketData.eventDate,
      eventTime: ticketData.eventTime,
      eventLocation: ticketData.eventLocation,
      orderId: ticketData.orderId,
      tickets: ticketData.tickets,
      isComplimentary: true
    });

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
    
    return {
      success: true,
      result: result,
      recipient: ticketData.userEmail,
      ticketCount: ticketData.tickets.length
    };

  } catch (error) {
    console.error('❌ Failed to send complimentary tickets:', error);
    throw error;
  }
}

// Execute the function
sendComplimentaryTickets()
  .then(result => {
    console.log('\n🎉 COMPLIMENTARY TICKETS SENT SUCCESSFULLY!');
    console.log(`📧 Delivered to: ${result.recipient}`);
    console.log(`🎫 Ticket count: ${result.ticketCount}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });