import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Generic / PrivateEmail SMTP Configuration
// Supports Namecheap PrivateEmail (mail.privateemail.com) and custom SMTP servers
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined 
  ? process.env.SMTP_SECURE === 'true' 
  : SMTP_PORT === 465;

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || process.env.SMTP_LOGIN || 'info@savgent.com',
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@savgent.com';
const DEFAULT_FROM_NAME = 'Savage Gentlemen';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  from?: string;
  attachments?: any[];
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email using SMTP (PrivateEmail / custom SMTP)
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, text, html, from = DEFAULT_FROM_EMAIL, attachments, cc, bcc } = options;
    
    console.log(`[SMTP] Attempting to send email to: ${to}, subject: ${subject}`);
    console.log(`[SMTP] From: ${from}`);
    console.log(`[SMTP] Server: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port} (secure: ${SMTP_CONFIG.secure})`);
    
    // Verify transporter connection
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully');
    
    const mailOptions = {
      from: `${DEFAULT_FROM_NAME} <${from}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
      attachments,
      cc,
      bcc
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully:`, result.messageId);
    return true;
    
  } catch (error: any) {
    console.error('[SMTP] Error sending email:', error?.message || error);
    return false;
  }
};

/**
 * Send a ticket confirmation email with QR code using SMTP
 */
export const sendTicketEmail = async (
  ticketInfo: {
    eventName: string;
    eventDate: Date;
    eventLocation: string;
    ticketId: string;
    qrCodeDataUrl: string;
    ticketType: string;
    ticketPrice: number;
    purchaseDate: Date;
    eventTime?: string;
  },
  recipientEmail: string
): Promise<boolean> => {
  try {
    console.log(`[SMTP] Generating QR code for ticket: ${ticketInfo.ticketId}`);
    
    // Generate QR code as buffer for email attachment
    const qrCodeBuffer = await QRCode.toBuffer(ticketInfo.qrCodeDataUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Format event date
    const eventDate = new Date(ticketInfo.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    let formattedTime = '';
    if (ticketInfo.eventTime) {
      const timeParts = ticketInfo.eventTime.match(/^(\d{1,2}):(\d{2})/);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = timeParts[2];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        formattedTime = `${hours}:${minutes} ${ampm}`;
      } else {
        formattedTime = ticketInfo.eventTime;
      }
    } else {
      formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    const subject = `Your ticket for ${ticketInfo.eventName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Ticket - ${ticketInfo.eventName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #c01c28; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; }
          .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 Your Ticket Confirmation</h1>
          <h2>${ticketInfo.eventName}</h2>
        </div>
        
        <div class="content">
          ${ticketInfo.ticketType === 'complimentary' || ticketInfo.ticketType?.includes('Thank You') ? 
            `<div style="background: #e8f5e8; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #2e7d32; margin-top: 0;">🎉 Thank You for Supporting Savage Gentlemen!</h3>
              <p style="color: #2e7d32; font-size: 16px; line-height: 1.6;">
                Thank you for joining us! Your presence and energy made it an incredible experience. 
                As a token of our appreciation, we're excited to offer you this complimentary ticket.
              </p>
            </div>` : 
            `<p>Thank you for your registration! Your ticket has been confirmed.</p>`}
          
          <div class="event-details">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> ${ticketInfo.eventName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Location:</strong> ${ticketInfo.eventLocation}</p>
            <p><strong>Ticket Type:</strong> ${ticketInfo.ticketType}</p>
            ${ticketInfo.ticketPrice > 0 ? `<p><strong>Price:</strong> $${ticketInfo.ticketPrice}</p>` : ''}
          </div>
          
          <div class="qr-section">
            <h3>Your QR Code</h3>
            <p>Present this QR code at the event entrance:</p>
            <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; height: auto;">
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Ticket ID: ${ticketInfo.ticketId}
            </p>
          </div>
          
          <div class="important">
            <strong>Important:</strong> 
            <ul>
              <li>Save this email on your phone</li>
              <li>Present the QR code at the event entrance</li>
              <li>Arrive early to avoid lines</li>
              <li>This ticket is valid for one entry only</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Savage Gentlemen!</p>
            <p>Questions? Contact us at: ${DEFAULT_FROM_EMAIL}</p>
            <p>Follow us for updates and future events</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
      from: DEFAULT_FROM_EMAIL,
      attachments: [
        {
          content: qrCodeBuffer,
          filename: 'qrcode.png',
          type: 'image/png',
          disposition: 'inline',
          cid: 'qrcode'
        }
      ]
    });
    
    return result;
  } catch (error) {
    console.error('[SMTP] Error in sendTicketEmail:', error);
    return false;
  }
};

/**
 * Test SMTP connectivity
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    console.log(`[SMTP] Testing connection to ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}...`);
    await transporter.verify();
    console.log('[SMTP] Connection test successful');
    return true;
  } catch (error: any) {
    console.error('[SMTP] Connection test failed:', error?.message || error);
    return false;
  }
};
