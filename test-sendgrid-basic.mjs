import sgMail from '@sendgrid/mail';

// Test basic SendGrid functionality
async function testSendGridBasic() {
  try {
    console.log('🔍 Testing basic SendGrid functionality...');
    
    // Check if API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY not found in environment variables');
      return;
    }
    
    console.log('✅ SendGrid API key found');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Test with a simple email to a verified address
    const msg = {
      to: 'info@savgent.com', // Send to your own email
      from: 'no-reply@trial-k68zxl2jmjzgj905.mlsender.net', // SendGrid verified sender
      subject: 'SendGrid Test Email - Savage Gentlemen',
      text: 'This is a test email to verify SendGrid is working correctly.',
      html: `
        <h2>SendGrid Test Email</h2>
        <p>This is a test email to verify SendGrid is working correctly.</p>
        <p>If you receive this email, the SendGrid configuration is operational.</p>
        <p>Next step: Send tickets to all 16 free registrations for R Y T H Y M > IN< R I D D I M</p>
      `
    };
    
    console.log('📧 Sending test email...');
    const result = await sgMail.send(msg);
    
    console.log('✅ Test email sent successfully!');
    console.log('📊 Response status:', result[0]?.statusCode);
    console.log('🎉 SendGrid is operational - ready to send ticket emails');
    
  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('📋 Error details:', error.response?.body);
      console.error('🔢 Status code:', error.response?.statusCode);
    }
  }
}

// Run the test
testSendGridBasic();