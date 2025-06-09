const { sendTicketEmail } = require('./server/email');

// Test ticket email delivery for user "blitz"
async function testTicketEmailForBlitz() {
  try {
    console.log('Testing ticket email delivery for user blitz...');
    
    const ticketData = {
      ticketId: 'TEST-123',
      qrCodeDataUrl: 'EVENT-6-ORDER-TEST-1749440000000',
      eventName: 'R i d d e m R i o t',
      eventLocation: 'Port of Spain, Trinidad and Tobago',
      eventDate: new Date('2025-06-14T22:00:00.000Z'),
      ticketType: 'General Admission',
      ticketPrice: 0,
      purchaseDate: new Date()
    };
    
    // Test email address for blitz
    const blitzEmail = 'blitz@example.com'; // Replace with actual email when known
    
    const result = await sendTicketEmail(ticketData, blitzEmail);
    
    if (result) {
      console.log('✓ Ticket email would be successfully sent to blitz at:', blitzEmail);
      console.log('✓ Email system is configured and working');
    } else {
      console.log('✗ Ticket email delivery failed');
    }
    
  } catch (error) {
    console.error('Error testing ticket email:', error.message);
  }
}

// Run the test
testTicketEmailForBlitz();