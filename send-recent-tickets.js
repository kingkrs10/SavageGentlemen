import { sendTicketEmail } from './server/email.js';

async function sendRecentTicketConfirmations() {
  // Recent ticket data that needs confirmations sent
  const recentTickets = [
    {
      orderId: 66,
      ticketId: '59',
      ticketName: 'Ladies Free w/RSVP ...  💃🏽',
      eventName: 'R i d d e m R i o t',
      eventDate: new Date('2025-06-28'),
      eventLocation: 'Bond St Event Centre',
      customerEmail: 'savgmen@gmail.com',
      customerName: 'SavageGentlemen',
      purchaseDate: new Date('2025-06-27T00:24:48.593Z'),
      qrCodeDataUrl: 'EVENT-6-ORDER-66-1750983888593'
    },
    {
      orderId: 65,
      ticketId: '58', 
      ticketName: 'Ladies Free w/RSVP ...  💃🏽',
      eventName: 'R i d d e m R i o t',
      eventDate: new Date('2025-06-28'),
      eventLocation: 'Bond St Event Centre',
      customerEmail: 'aprylhen@yahoo.ca',
      customerName: 'Apryl',
      purchaseDate: new Date('2025-06-27T00:16:32.386Z'),
      qrCodeDataUrl: 'EVENT-6-ORDER-65-1750983392386'
    },
    {
      orderId: 64,
      ticketId: '57',
      ticketName: 'Ladies Free w/RSVP ...  💃🏽', 
      eventName: 'R i d d e m R i o t',
      eventDate: new Date('2025-06-28'),
      eventLocation: 'Bond St Event Centre',
      customerEmail: 'nataliesnow@rogers.com',
      customerName: 'Natalie',
      purchaseDate: new Date('2025-06-27T00:15:01.226Z'),
      qrCodeDataUrl: 'EVENT-6-ORDER-64-1750983301226'
    }
  ];

  console.log('Sending ticket confirmations for recent purchases...\n');

  for (const ticket of recentTickets) {
    try {
      console.log(`Sending ticket to ${ticket.customerName} (${ticket.customerEmail})...`);
      
      const sent = await sendTicketEmail({
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventLocation: ticket.eventLocation,
        ticketId: ticket.ticketId,
        ticketType: ticket.ticketName,
        ticketPrice: 0,
        purchaseDate: ticket.purchaseDate,
        qrCodeDataUrl: ticket.qrCodeDataUrl
      }, ticket.customerEmail);
      
      if (sent) {
        console.log(`✓ Successfully sent ticket confirmation to ${ticket.customerEmail}`);
      } else {
        console.log(`✗ Failed to send ticket to ${ticket.customerEmail}`);
      }
    } catch (error) {
      console.error(`✗ Error sending ticket to ${ticket.customerEmail}:`, error.message);
    }
    
    // Add delay between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTicket confirmation process completed.');
}

sendRecentTicketConfirmations().catch(console.error);