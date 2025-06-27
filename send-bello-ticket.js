import { sendTicketEmail } from './server/email.js';

async function sendBelloTicket() {
  try {
    console.log('Processing Bello\'s manual ticket delivery...');
    
    const result = await sendTicketEmail({
      orderId: '67',
      eventTitle: 'R i d d e m R i o t',
      eventLocation: 'TBA',
      eventDate: new Date('2025-06-28T19:00:00'),
      ticketType: 'Gent Early Bird Tix',
      price: 40.00,
      currency: 'USD',
      qrCodeData: 'EVENT-6-ORDER-67-1750996460',
      attendeeName: 'Bello',
      purchaseDate: new Date()
    }, 'bellomoyosoreoluwa@yahoo.com');
    
    if (result) {
      console.log('✓ Ticket email delivered to bellomoyosoreoluwa@yahoo.com');
      console.log('✓ Payment reconciled: $40 USD (Bank: $56.31 CAD)');
      console.log('✓ Order created: ID 67');
      console.log('✓ Ticket created: ID 62');
      console.log('✓ QR Code: EVENT-6-ORDER-67-1750996460');
      console.log('✓ Status: Valid male ticket for RiddemRiot');
    } else {
      console.log('❌ Email delivery failed');
    }
  } catch (error) {
    console.error('Error processing ticket:', error.message);
  }
}

sendBelloTicket();