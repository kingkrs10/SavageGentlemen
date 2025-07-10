import { sendEmail, sendTicketEmail, testEmailConnection } from './server/email-provider.ts';

// Test alternative email providers
async function testAlternativeEmailProviders() {
  console.log('🔄 Testing Alternative Email Providers...');
  console.log('==========================================');
  
  // Test connection first
  console.log('\n1. Testing Email Connection...');
  try {
    const connectionTest = await testEmailConnection();
    if (connectionTest) {
      console.log('✅ Email connection successful');
    } else {
      console.log('❌ Email connection failed');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  
  // Test basic email sending
  console.log('\n2. Testing Basic Email Sending...');
  try {
    const testResult = await sendEmail({
      to: 'info@savgent.com',
      subject: 'Test Email - Alternative Provider',
      html: `
        <h2>Email Provider Test</h2>
        <p>This is a test email to verify the alternative email provider is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Provider: ${process.env.EMAIL_PROVIDER || 'Auto-detected'}</li>
          <li>Time: ${new Date().toLocaleString()}</li>
          <li>Status: Operational</li>
        </ul>
        <p>✅ Alternative email service is ready for ticket delivery!</p>
      `
    });
    
    if (testResult) {
      console.log('✅ Basic email sent successfully');
    } else {
      console.log('❌ Basic email failed');
    }
  } catch (error) {
    console.error('❌ Basic email error:', error.message);
  }
  
  // Test ticket email sending
  console.log('\n3. Testing Ticket Email Sending...');
  try {
    const ticketTestResult = await sendTicketEmail({
      eventName: 'R Y T H Y M > IN< R I D D I M',
      eventDate: new Date('2025-07-15T20:00:00'),
      eventLocation: 'Caribbean Cultural Center',
      ticketId: 'TEST-TICKET-001',
      qrCodeDataUrl: 'EVENT-7-TEST-ALTERNATIVE-EMAIL-PROVIDER',
      ticketType: 'Free Ticket',
      ticketPrice: 0,
      purchaseDate: new Date()
    }, 'info@savgent.com');
    
    if (ticketTestResult) {
      console.log('✅ Ticket email sent successfully');
    } else {
      console.log('❌ Ticket email failed');
    }
  } catch (error) {
    console.error('❌ Ticket email error:', error.message);
  }
  
  console.log('\n==========================================');
  console.log('🎉 Alternative Email Provider Testing Complete!');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Check your email inbox for test messages');
  console.log('2. If successful, run: npx tsx resend-rhythm-riddim-free-tickets-alternative.mjs');
  console.log('3. All 16 free ticket holders will receive their QR codes');
  console.log('==========================================');
}

// Run the test
testAlternativeEmailProviders().catch(console.error);