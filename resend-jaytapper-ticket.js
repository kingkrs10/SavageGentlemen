const { sendTicketEmail } = require('./server/email.js');

async function resendJaytapperTicket() {
  try {
    console.log('Resending ticket email to Jaytapper@hotmail.com...');
    
    const result = await sendTicketEmail({
      email: 'Jaytapper@hotmail.com',
      name: 'Jay',
      ticketCode: 'EVENT-6-ORDER-MANUAL-1751038715755',
      eventTitle: 'R i d d e m R i o t',
      eventDate: new Date('2025-06-28T00:00:00Z'),
      eventLocation: 'Bond St Event Centre, Toronto, ON',
      ticketType: 'Gent Early Bird Tix',
      purchaseDate: new Date('2025-06-27T15:38:47.149Z'),
      orderId: '999'
    });
    
    if (result) {
      console.log('✅ Successfully resent ticket email to Jaytapper@hotmail.com');
    } else {
      console.log('❌ Failed to send ticket email');
    }
    
  } catch (error) {
    console.error('Error resending ticket:', error);
  }
  
  process.exit(0);
}

resendJaytapperTicket();
