import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Use Brevo SMTP (working email service)
const BREVO_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN || 'info@savgent.com',
    pass: process.env.BREVO_SMTP_KEY || 'xsmtpsib-d7b5f4b8fbe89c7aa5b5a0f2dc4c1e3b4d89ce7f8a1b2c3d4e5f6a7b8c9d0e1f'
  }
};

async function generateQRCodeBase64(data) {
  return await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

async function sendComplimentaryTickets() {
  try {
    console.log('Starting to send complimentary tickets to Jclay using Brevo SMTP...');
    
    // Generate QR codes for both tickets
    const qrCode1 = await generateQRCodeBase64('EVENT-7-ORDER-149-1753404658-1');
    const qrCode2 = await generateQRCodeBase64('EVENT-7-ORDER-149-1753404658-2');

    // Create transporter
    const transporter = nodemailer.createTransport(BREVO_CONFIG);

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Complimentary Tickets - R Y T H Y M > IN< R I D D I M</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #1a1a1a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; background: linear-gradient(135deg, #8B5CF6, #EC4899); border-radius: 15px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
        .event-details { background: #2a2a2a; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #8B5CF6; }
        .event-details h2 { margin-top: 0; color: #8B5CF6; font-size: 24px; }
        .detail-row { display: flex; margin: 10px 0; }
        .detail-label { font-weight: bold; min-width: 80px; color: #cccccc; }
        .detail-value { color: #ffffff; }
        .ticket-section { background: #2a2a2a; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
        .ticket-qr { background: #ffffff; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px; }
        .important-note { background: #FEF3C7; color: #92400E; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999999; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
        .thank-you { background: #e8f5e8; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; margin: 20px 0; color: #2e7d32; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Complimentary Tickets</h1>
            <p>Your tickets for R Y T H Y M > IN< R I D D I M</p>
        </div>

        <div class="thank-you">
            <h3>🎉 Thank You for Supporting Savage Gentlemen!</h3>
            <p>Thank you for your continued support of our community! As a token of our appreciation, we're excited to offer you these complimentary tickets to our upcoming event.</p>
            <p><strong>We can't wait to see you again and continue building this amazing community together!</strong></p>
        </div>

        <div class="event-details">
            <h2>Event Details</h2>
            <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span class="detail-value">R Y T H Y M > IN< R I D D I M</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">Friday, July 25, 2025</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">10:00 PM</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span class="detail-value">The Ainsworth, Hoboken NJ</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Tickets:</span>
                <span class="detail-value">2 x Ladies General Admission (Complimentary)</span>
            </div>
        </div>

        <div class="ticket-section">
            <h3>Your QR Code Tickets</h3>
            <p>Please save these QR codes to your phone and present them at the venue for entry.</p>
            <div style="margin: 20px 0;">
                <p><strong>Ticket 1</strong></p>
                <div class="ticket-qr">
                    <img src="cid:qr-code-1" alt="QR Code 1" style="max-width: 250px;" />
                </div>
                <p style="font-size: 12px; color: #999;">QR Code: EVENT-7-ORDER-149-1753404658-1</p>
            </div>
            <div style="margin: 20px 0;">
                <p><strong>Ticket 2</strong></p>
                <div class="ticket-qr">
                    <img src="cid:qr-code-2" alt="QR Code 2" style="max-width: 250px;" />
                </div>
                <p style="font-size: 12px; color: #999;">QR Code: EVENT-7-ORDER-149-1753404658-2</p>
            </div>
        </div>

        <div class="important-note">
            <h4>🎫 Important Information</h4>
            <ul style="text-align: left; margin: 10px 0;">
                <li>These are complimentary tickets courtesy of Savage Gentlemen</li>
                <li>Each QR code is unique and valid for one person</li>
                <li>Please arrive early - doors open at 9:30 PM</li>
                <li>Valid photo ID required for entry</li>
                <li>Screenshots of QR codes are acceptable</li>
                <li>You can also find these tickets in your "My Tickets" section when you log in</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; color: #8B5CF6;">
                Get ready for a night of Soca, Kompa & Afrobeat! 🎵
            </p>
        </div>

        <div class="footer">
            <div class="logo">SAVAGE GENTLEMEN</div>
            <p>For questions, contact us at info@savgent.com</p>
            <p>Follow us for updates: @SavageGentlemen</p>
        </div>
    </div>
</body>
</html>
    `;

    // Email options with inline QR code attachments
    const mailOptions = {
      from: 'Savage Gentlemen <info@savgent.com>',
      to: 'clayton7j@gmail.com',
      subject: '🎉 Your Complimentary Tickets - R Y T H Y M > IN< R I D D I M - July 25',
      html: emailHTML,
      text: 'Your complimentary tickets for R Y T H Y M > IN< R I D D I M on July 25, 2025 at The Ainsworth, Hoboken NJ. Please check the email for QR codes.',
      attachments: [
        {
          filename: 'qr-code-1.png',
          content: qrCode1.split('data:image/png;base64,')[1],
          encoding: 'base64',
          cid: 'qr-code-1'
        },
        {
          filename: 'qr-code-2.png',
          content: qrCode2.split('data:image/png;base64,')[1],
          encoding: 'base64',
          cid: 'qr-code-2'
        }
      ]
    };

    console.log('Sending email to clayton7j@gmail.com...');
    console.log('From:', mailOptions.from);
    console.log('Subject:', mailOptions.subject);

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
    
    return {
      success: true,
      recipient: 'clayton7j@gmail.com',
      ticketCount: 2,
      messageId: result.messageId
    };

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
    console.log(`📨 Message ID: ${result.messageId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });