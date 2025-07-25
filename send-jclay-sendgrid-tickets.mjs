import sgMail from '@sendgrid/mail';
import QRCode from 'qrcode';

// SendGrid configuration - the working service
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not configured');
}

sgMail.setApiKey(SENDGRID_API_KEY);

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
    console.log('Starting to send complimentary tickets to Jclay using SendGrid...');
    
    // Generate QR codes for both tickets
    const qrCode1 = await generateQRCodeBase64('EVENT-7-ORDER-149-1753404658-1');
    const qrCode2 = await generateQRCodeBase64('EVENT-7-ORDER-149-1753404658-2');

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
        .ticket-qr { background: #ffffff; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .important-note { background: #FEF3C7; color: #92400E; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #999999; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
        .thank-you { background: linear-gradient(135deg, #e8f5e8, #d4f4d4); border: 2px solid #4caf50; padding: 25px; border-radius: 12px; margin: 20px 0; color: #2e7d32; text-align: center; }
        .qr-code { max-width: 200px; height: auto; }
        .ticket-info { font-size: 12px; color: #888; margin-top: 10px; }
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
            
            <div style="margin: 25px 0; padding: 20px; background: #1e1e1e; border-radius: 10px;">
                <p><strong>Ticket 1 of 2</strong></p>
                <div class="ticket-qr">
                    <img src="${qrCode1}" alt="QR Code 1" class="qr-code" />
                </div>
                <div class="ticket-info">QR Code: EVENT-7-ORDER-149-1753404658-1</div>
            </div>
            
            <div style="margin: 25px 0; padding: 20px; background: #1e1e1e; border-radius: 10px;">
                <p><strong>Ticket 2 of 2</strong></p>
                <div class="ticket-qr">
                    <img src="${qrCode2}" alt="QR Code 2" class="qr-code" />
                </div>
                <div class="ticket-info">QR Code: EVENT-7-ORDER-149-1753404658-2</div>
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
                <li>Event is TODAY - Friday, July 25, 2025!</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #8B5CF6, #EC4899); border-radius: 12px;">
            <p style="font-size: 20px; margin: 0; font-weight: bold;">
                Get ready for a night of Soca, Kompa & Afrobeat! 🎵
            </p>
            <p style="font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">
                We're excited to celebrate with you tonight!
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

    // SendGrid email message
    const msg = {
      to: 'clayton7j@gmail.com',
      from: {
        email: 'info@savgent.com',
        name: 'Savage Gentlemen'
      },
      subject: '🎉 Your Complimentary Tickets - R Y T H Y M > IN< R I D D I M - TODAY!',
      html: emailHTML,
      text: `
Your Complimentary Tickets - R Y T H Y M > IN< R I D D I M

Thank you for your continued support! We're excited to offer you 2 complimentary tickets for tonight's event.

Event: R Y T H Y M > IN< R I D D I M  
Date: Friday, July 25, 2025
Time: 10:00 PM
Venue: The Ainsworth, Hoboken NJ

Your tickets are available in the "My Tickets" section when you log in, or you can use the QR codes in this email.

QR Codes:
- Ticket 1: EVENT-7-ORDER-149-1753404658-1
- Ticket 2: EVENT-7-ORDER-149-1753404658-2

See you tonight!
- Savage Gentlemen Team
      `
    };

    console.log('Sending email to clayton7j@gmail.com...');
    console.log('From:', msg.from.email);
    console.log('Subject:', msg.subject);

    await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid!');
    console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
    
    return {
      success: true,
      recipient: 'clayton7j@gmail.com',
      ticketCount: 2,
      service: 'SendGrid'
    };

  } catch (error) {
    console.error('❌ Failed to send complimentary tickets:', error);
    
    if (error.response) {
      console.error('SendGrid Error Response:', error.response.body);
    }
    
    throw error;
  }
}

// Execute the function
sendComplimentaryTickets()
  .then(result => {
    console.log('\n🎉 COMPLIMENTARY TICKETS EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 Delivered to: ${result.recipient}`);
    console.log(`🎫 Ticket count: ${result.ticketCount}`);
    console.log(`📨 Service: ${result.service}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });