import 'dotenv/config';
import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Load .env.local overrides
config({ path: '.env.local', override: true });

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

// April 27 purchases from unified_payments.csv
const purchases = [
  {
    chargeId: 'ch_3TQyPPRYYQixBBH20zXTzObh',
    paymentIntent: 'pi_3TQyPPRYYQixBBH20',
    date: '2026-04-27 23:20:17',
    amount: 10.00,
    email: 'gmilligan4@gmail.com',
    userId: 101,
    ticketId: 3,
    eventId: 2,
    eventTitle: 'SOCA NOIŘ ROSE',
    ticketName: 'Soca Noir Rose Early Bird female',
  },
  {
    chargeId: 'ch_3TQovaRYYQixBBH207rkimpv',
    paymentIntent: 'pi_3TQovaRYYQixBBH20',
    date: '2026-04-27 13:11:16',
    amount: 15.00,
    email: 'gmilligan4@gmail.com',
    userId: 101,
    ticketId: 2,
    eventId: 2,
    eventTitle: 'SOCA NOIŘ ROSE',
    ticketName: 'Soca Noir Rose Early Bird Men',
  },
];

async function sendTicketEmail(purchase) {
  const qrData = `EVENT-${purchase.eventId}-CHARGE-${purchase.chargeId}-USER-${purchase.userId}-${Date.now()}`;
  
  console.log(`\n📧 Sending ticket to: ${purchase.email}`);
  console.log(`   Ticket: ${purchase.ticketName} ($${purchase.amount})`);
  console.log(`   QR Data: ${qrData}`);

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const eventDate = new Date('2026-06-21T21:00:00');
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff;">
      <div style="background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%); padding: 30px; text-align: center;">
        <h1 style="color: #0a0a0a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">SAVAGE GENTLEMEN</h1>
        <p style="color: #1a1a1a; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 3px;">YOUR TICKET CONFIRMATION</p>
      </div>
      
      <div style="padding: 30px; text-align: center;">
        <h2 style="color: #d4af37; font-size: 24px; margin-bottom: 5px;">${purchase.eventTitle}</h2>
        <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">${formattedDate}</p>
        <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">${formattedTime}</p>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">Newark, NJ</p>
      </div>
      
      <div style="padding: 20px; text-align: center; background-color: #ffffff; margin: 0 30px; border-radius: 12px;">
        <p style="color: #333333; font-size: 14px; margin-bottom: 15px; font-weight: 600;">SCAN THIS QR CODE AT THE DOOR</p>
        <img src="cid:qrcode" alt="Ticket QR Code" style="width: 250px; height: 250px;" />
      </div>
      
      <div style="padding: 20px 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #333;">Ticket Type</td>
            <td style="padding: 10px 0; color: #fff; font-size: 13px; text-align: right; border-bottom: 1px solid #333;">${purchase.ticketName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #333;">Price</td>
            <td style="padding: 10px 0; color: #d4af37; font-size: 13px; text-align: right; border-bottom: 1px solid #333;">$${purchase.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #999; font-size: 13px; border-bottom: 1px solid #333;">Purchase Date</td>
            <td style="padding: 10px 0; color: #fff; font-size: 13px; text-align: right; border-bottom: 1px solid #333;">${purchase.date}</td>
          </tr>
        </table>
      </div>
      
      <div style="padding: 20px 30px; text-align: center; border-top: 1px solid #333;">
        <p style="color: #999; font-size: 12px;">This ticket is non-transferable. Present this QR code at the venue entrance.</p>
        <p style="color: #666; font-size: 11px; margin-top: 15px;">© 2026 Savage Gentlemen Events</p>
      </div>
    </div>
  `;

  const result = await transporter.sendMail({
    from: 'Savage Gentlemen <info@savgent.com>',
    to: purchase.email,
    subject: `🎟️ Your Ticket: ${purchase.eventTitle} - ${purchase.ticketName}`,
    html: html,
    attachments: [{
      filename: 'qrcode.png',
      content: qrCodeBase64,
      encoding: 'base64',
      cid: 'qrcode'
    }]
  });

  console.log(`   ✅ Sent! Message ID: ${result.messageId}`);
  return result;
}

async function main() {
  console.log('=== TICKET RECOVERY: April 27 Purchases ===');
  console.log(`SMTP Login: ${process.env.BREVO_SMTP_LOGIN ? '✅ Set' : '❌ Missing'}`);
  console.log(`SMTP Key: ${process.env.BREVO_SMTP_KEY ? '✅ Set' : '❌ Missing'}`);
  
  // Verify SMTP connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');
  } catch (err) {
    console.error('❌ SMTP connection failed:', err.message);
    process.exit(1);
  }

  let success = 0;
  let failed = 0;

  for (const purchase of purchases) {
    try {
      await sendTicketEmail(purchase);
      success++;
      // Small delay between emails
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`✅ Sent: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${purchases.length}`);
}

main().catch(console.error);
