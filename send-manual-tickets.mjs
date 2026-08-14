import 'dotenv/config';
import pg from 'pg';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    email: 'shanices814@gmail.com',
    ticketId: 3,
    ticketName: 'Soca Noir Rose Early Bird female',
    price: 10.0,
    count: 1
  },
  {
    email: 'karishmaa_@hotmail.com',
    ticketId: 6,
    ticketName: 'SNR TEAM TIX',
    price: 0.0,
    count: 5
  },
  {
    email: 'natashapeters65@yahoo.com',
    ticketId: 1,
    ticketName: 'Soca Noir Rose Early Bird female 2 for 1',
    price: 15.0,
    count: 1
  }
];

async function main() {
  console.log('=== SENDING MANUAL TICKETS ===\n');

  const client = await pool.connect();
  
  try {
    for (const req of requests) {
      console.log(`Processing ${req.count} ticket(s) for ${req.email}...`);

      // 1. Create a dummy order for this request
      const paymentId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderRes = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, payment_method, payment_id, created_at)
         VALUES ($1, $2, 'completed', 'manual', $3, now())
         RETURNING id`,
        [101, req.price * req.count * 100, paymentId] // Using user_id 101 as dummy admin
      );
      const orderId = orderRes.rows[0].id;
      console.log(`   ✅ Created Order ID: ${orderId}`);

      for (let i = 0; i < req.count; i++) {
        const qrData = `EVENT-2-MANUAL-${req.email.split('@')[0].toUpperCase()}-${Date.now()}-${i}`;
        
        // 2. Create ticket purchase
        const ticketRes = await client.query(
          `INSERT INTO ticket_purchases (
            user_id, ticket_id, event_id, order_id, purchase_date, 
            status, qr_code_data, ticket_type, price, attendee_email, attendee_name
          ) VALUES ($1, $2, $3, $4, now(), 'valid', $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            101, req.ticketId, 2, orderId,
            qrData, req.ticketName, req.price, req.email, req.email.split('@')[0]
          ]
        );
        console.log(`   ✅ Created Ticket Purchase ID: ${ticketRes.rows[0].id}`);

        // 3. Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

        // 4. Send Email
        const html = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff;">
            <div style="background: linear-gradient(135deg, #d4af37 0%, #f5e6a3 50%, #d4af37 100%); padding: 30px; text-align: center;">
              <h1 style="color: #0a0a0a; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">SAVAGE GENTLEMEN</h1>
              <p style="color: #1a1a1a; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 3px;">YOUR TICKET CONFIRMATION</p>
            </div>
            
            <div style="padding: 30px; text-align: center;">
              <h2 style="color: #d4af37; font-size: 24px; margin-bottom: 5px;">SOCA NOIŘ ROSE</h2>
              <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">Sunday, May 17, 2026</p>
              <p style="color: #cccccc; font-size: 16px; margin: 5px 0;">6:00 PM</p>
              <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">AINSWORTH HOBOKEN NJ</p>
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
        console.log(`   ✅ Sent ticket ${i+1}/${req.count} to ${req.email}`);
      }
      console.log('');
    }
    console.log('✅ ALL TICKETS SENT SUCCESSFULLY');
  } catch (err) {
    console.error('❌ Error executing operations:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
