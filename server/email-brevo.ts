import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// Brevo (formerly Sendinblue) SMTP Configuration
const BREVO_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN || 'info@savgent.com',
    pass: process.env.BREVO_SMTP_KEY || 'ZmKA8246OLSjhGOO',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(BREVO_CONFIG);

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'info@savgent.com';
const DEFAULT_FROM_NAME = 'Savage Gentlemen';

interface EmailOptions {
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
 * Send an email using Brevo SMTP
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, text, html, from = DEFAULT_FROM_EMAIL, attachments, cc, bcc } = options;
    
    console.log(`[BREVO] Attempting to send email to: ${to}, subject: ${subject}`);
    console.log(`[BREVO] From: ${from}`);
    console.log(`[BREVO] SMTP configured: ${process.env.BREVO_SMTP_LOGIN ? 'Yes' : 'No'}`);
    
    // Verify transporter connection
    await transporter.verify();
    console.log('[BREVO] SMTP connection verified successfully');
    
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
    console.log(`[BREVO] Email sent successfully:`, result.messageId);
    return true;
    
  } catch (error) {
    console.error('[BREVO] Error sending email:', error);
    return false;
  }
};

/**
 * Send a ticket confirmation email with QR code using Brevo
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
  },
  recipientEmail: string
): Promise<boolean> => {
  try {
    console.log(`[BREVO] Generating QR code for ticket: ${ticketInfo.ticketId}`);
    
    // Generate QR code as base64 image
    const qrCodeDataUrl = await QRCode.toDataURL(ticketInfo.qrCodeDataUrl, {
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
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
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
          <p>Thank you for your registration! Your ticket has been confirmed.</p>
          
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
            <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 300px; height: auto;">
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              QR Code: ${ticketInfo.qrCodeDataUrl}
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
            <p>Questions? Contact us at: info@savgent.com</p>
            <p>Follow us for updates and future events</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Your Ticket Confirmation - ${ticketInfo.eventName}

Thank you for your registration! Your ticket has been confirmed.

Event Details:
- Event: ${ticketInfo.eventName}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Location: ${ticketInfo.eventLocation}
- Ticket Type: ${ticketInfo.ticketType}
${ticketInfo.ticketPrice > 0 ? `- Price: $${ticketInfo.ticketPrice}` : ''}

QR Code: ${ticketInfo.qrCodeDataUrl}

Important:
- Save this email on your phone
- Present the QR code at the event entrance
- Arrive early to avoid lines
- This ticket is valid for one entry only

Questions? Contact us at: info@savgent.com
    `;
    
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
      from: DEFAULT_FROM_EMAIL
    });
    
    if (result) {
      console.log(`[BREVO] Ticket email sent successfully to ${recipientEmail}`);
    } else {
      console.error(`[BREVO] Failed to send ticket email to ${recipientEmail}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('[BREVO] Error in sendTicketEmail:', error);
    return false;
  }
};

/**
 * Test email connectivity
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    console.log('[BREVO] Testing email connection...');
    await transporter.verify();
    console.log('[BREVO] Connection test successful');
    return true;
  } catch (error) {
    console.error('[BREVO] Connection test failed:', error);
    return false;
  }
};