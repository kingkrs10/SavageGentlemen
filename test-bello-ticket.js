import { sendTicketEmail } from './server/email.js';

async function testBelloTicketPurchase() {
  console.log('Testing ticket purchase and email confirmation for Bello...\n');

  const ticketInfo = {
    eventName: 'R i d d e m R i o t',
    eventDate: new Date('2025-06-28T19:00:00Z'),
    eventLocation: 'Bond St Event Centre',
    ticketId: '9',
    ticketType: 'Ladies Free w/RSVP',
    ticketPrice: 0,
    purchaseDate: new Date(),
    qrCodeDataUrl: 'EVENT-6-ORDER-TEST-BELLO-' + Date.now()
  };

  const userEmail = 'bellomoyosoreoluwa@yahoo.com';

  try {
    console.log(`Sending test ticket to ${userEmail}...`);
    console.log('Ticket details:', {
      event: ticketInfo.eventName,
      type: ticketInfo.ticketType,
      price: ticketInfo.ticketPrice,
      qrCode: ticketInfo.qrCodeDataUrl
    });

    const sent = await sendTicketEmail(ticketInfo, userEmail);

    if (sent) {
      console.log(`✓ Successfully sent test ticket confirmation to ${userEmail}`);
      console.log('✓ Ticketing function is working correctly');
    } else {
      console.log(`✗ Failed to send ticket confirmation to ${userEmail}`);
      console.log('✗ Ticketing function needs attention');
    }
  } catch (error) {
    console.error('Error testing ticket function:', error);
  }
}

testBelloTicketPurchase();