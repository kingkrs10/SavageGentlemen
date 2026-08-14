import 'dotenv/config';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const BREVO_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
};

const transporter = nodemailer.createTransport(BREVO_CONFIG);

const requests = [
  {
    email: 'kyle1coonjah@gmail.com',
    ticketName: 'ELYSIUM FEMALE GEN ADMISSION EARLY BIRD',
    price: 100.0,
    qrPrefix: 'EVENT-3-ORDER-22-TKT-0-1779158060.674922',
    count: 1
  }
];

async function main() {
  console.log('=== SENDING EMAILS FOR ELYSIUM TICKET ===\n');

  try {
    for (const req of requests) {
      console.log(`Sending ${req.count} email(s) to ${req.email}...`);

      for (let i = 0; i < req.count; i++) {
        const qrData = req.qrPrefix; // Use the exact QR data from DB
        
        console.log(`   Generating QR for: ${qrData}`);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

        const html = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff;">
            <div style="background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%); padding: 30px; text-align: center;">
              <h1 style="color: #0a0a0a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">SAVAGE GENTLEMEN</h1>
              <p style="color: #1a1a1a; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 3px;">YOUR TICKET CONFIRMATION</p>
            </div>
            
            <div style="padding: 30px; text-align: center;">
              <h2 style="color: #d4af37; font-size: 24px; margin-bottom: 5px;">ELYSIUM THE PALMS EDITION 🌴</h2>
              <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">Thursday, May 21, 2026</p>
              <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">2:00 PM</p>
              <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">AC MARRIOT OLGE, GEORGETOWN GUYANA</p>
            </div>
            
            <div style="padding: 20px; text-align: center; background-color: #ffffff; margin: 0 30px; border-radius: 12px;">
              <p style="color: #333333; font-size: 14px; margin-bottom: 15px; font-weight: 600;">SCAN THIS QR CODE AT THE DOOR</p>
              <img src="cid:qrcode" alt="Ticket QR Code" style="width: 250px; height: 250px;" />
            </div>
            
            <div style="padding: 20px 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #333;">Ticket Type</td>
                  <td style="padding: 10px 0; color: #fff; font-size: 13px; text-align: right; border-bottom: 1px solid #333;">${req.ticketName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #333;">Price</td>
                  <td style="padding: 10px 0; color: #fff; font-size: 13px; text-align: right; border-bottom: 1px solid #333;">$${Number(req.price).toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="padding: 30px; text-align: center; background-color: #111;">
              <p style="color: #888; font-size: 12px; margin: 0;">This is a system generated email. Please do not reply.</p>
              <p style="color: #888; font-size: 12px; margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: 'Savage Gentlemen <info@savgent.com>',
          to: req.email,
          subject: 'Your Savage Gentlemen Ticket Details',
          html,
          attachments: [{
            filename: 'qrcode.png',
            content: qrCodeBase64,
            encoding: 'base64',
            cid: 'qrcode'
          }]
        });
        console.log(`   ✅ Sent ticket to ${req.email}`);
      }
      console.log('');
    }
    console.log('✅ ALL EMAILS SENT SUCCESSFULLY');
  } catch (error) {
    console.error('❌ Error sending emails:', error);
  }
}

main().catch(console.error);
