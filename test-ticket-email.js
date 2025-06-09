import { sendTicketEmail } from './server/email.js';

// Test ticket email delivery for user "Blitzz8125"
async function testTicketEmailForBlitzz8125() {
  try {
    console.log('Testing ticket email delivery for user Blitzz8125...');
    
    const ticketData = {
      ticketId: 'TEST-BLITZZ-123',
      qrCodeDataUrl: 'EVENT-6-ORDER-BLITZZ-1749440000000',
      eventName: 'R i d d e m R i o t',
      eventLocation: 'Port of Spain, Trinidad and Tobago',
      eventDate: new Date('2025-06-14T22:00:00.000Z'),
      ticketType: 'General Admission',
      ticketPrice: 50,
      purchaseDate: new Date()
    };
    
    // Actual email address for Blitzz8125
    const blitzzEmail = 'suttonnathan4@gmail.com';
    
    console.log('Sending test ticket email to:', blitzzEmail);
    const result = await sendTicketEmail(ticketData, blitzzEmail);
    
    if (result) {
      console.log('✓ Ticket email successfully sent to Blitzz8125 at:', blitzzEmail);
      console.log('✓ Email delivery system is operational and ready for real purchases');
    } else {
      console.log('✗ Ticket email delivery failed - checking email configuration');
    }
    
  } catch (error) {
    console.error('Error testing ticket email for Blitzz8125:', error.message);
  }
}

// Run the test
testTicketEmailForBlitzz8125();