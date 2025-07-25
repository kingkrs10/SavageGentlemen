import nodemailer from 'nodemailer';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Email configuration for Brevo
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'clayton7j@gmail.com',
    pass: process.env.BREVO_SMTP_KEY
  }
});

async function sendComplimentaryTickets() {
  try {
    console.log('Starting to send complimentary tickets to Jclay...');
    
    // Event details
    const eventDetails = {
      title: 'R Y T H Y M > IN< R I D D I M',
      date: 'Friday, July 25, 2025',
      time: '10:00 PM',
      location: 'The Ainsworth, Hoboken NJ',
      recipientName: 'Jclay',
      recipientEmail: 'clayton7j@gmail.com'
    };

    // QR codes for the two tickets (these were generated in the database)
    const qrCodes = [
      'EVENT-7-ORDER-149-1753404658-1',
      'EVENT-7-ORDER-149-1753404658-2'
    ];

    // Generate QR code images
    const qrCodeBuffers = [];
    for (let i = 0; i < qrCodes.length; i++) {
      const qrBuffer = await qrcode.toBuffer(qrCodes[i], {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      qrCodeBuffers.push(qrBuffer);
    }

    // Email template
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Complimentary Tickets</h1>
            <p>Your tickets for R Y T H Y M > IN< R I D D I M</p>
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
                    <img src="cid:qr1" alt="QR Code 1" style="max-width: 250px;" />
                </div>
            </div>
            <div style="margin: 20px 0;">
                <p><strong>Ticket 2</strong></p>
                <div class="ticket-qr">
                    <img src="cid:qr2" alt="QR Code 2" style="max-width: 250px;" />
                </div>
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

    // Email configuration
    const mailOptions = {
      from: {
        name: 'Savage Gentlemen',
        address: 'info@savgent.com'
      },
      to: eventDetails.recipientEmail,
      subject: '🎉 Your Complimentary Tickets - R Y T H Y M > IN< R I D D I M - July 25',
      html: emailHTML,
      attachments: [
        {
          filename: 'ticket-qr-1.png',
          content: qrCodeBuffers[0],
          cid: 'qr1'
        },
        {
          filename: 'ticket-qr-2.png',
          content: qrCodeBuffers[1],
          cid: 'qr2'
        }
      ]
    };

    console.log('Sending email to:', eventDetails.recipientEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
    
    return {
      success: true,
      messageId: result.messageId,
      recipient: eventDetails.recipientEmail,
      ticketCount: 2
    };

  } catch (error) {
    console.error('❌ Failed to send complimentary tickets:', error);
    throw error;
  }
}

// Execute the function
sendComplimentaryTickets()
  .then(result => {
    console.log('\n🎉 COMPLIMENTARY TICKETS SENT SUCCESSFULLY!');
    console.log(`📧 Delivered to: ${result.recipient}`);
    console.log(`🎫 Ticket count: ${result.ticketCount}`);
    console.log(`📮 Message ID: ${result.messageId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });