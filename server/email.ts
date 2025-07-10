import sgMail from '@sendgrid/mail';
import QRCode from 'qrcode';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable must be set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// The sender email that will be used for all communications
// Using a verified SendGrid sender email to bypass DNS authentication issues
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_VERIFIED_SENDER_EMAIL || 'no-reply@trial-k68zxl2jmjzgj905.mlsender.net';
const ADMIN_EMAIL = process.env.SENDGRID_VERIFIED_SENDER_EMAIL || 'no-reply@trial-k68zxl2jmjzgj905.mlsender.net'; // Official organizer email

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
 * Send an email using SendGrid
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, subject, text, html, from = DEFAULT_FROM_EMAIL, attachments, cc, bcc } = options;
    
    console.log(`[EMAIL] Attempting to send email to: ${to}, subject: ${subject}`);
    console.log(`[EMAIL] From: ${from}`);
    console.log(`[EMAIL] SendGrid API Key configured: ${process.env.SENDGRID_API_KEY ? 'Yes' : 'No'}`);
    
    const msg = {
      to,
      from,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags as fallback text version
      html,
      attachments,
      cc,
      bcc
    };
    
    console.log(`[EMAIL] Message object prepared:`, {
      to: msg.to,
      from: msg.from,
      subject: msg.subject,
      hasHtml: Boolean(msg.html),
      hasText: Boolean(msg.text)
    });
    
    const result = await sgMail.send(msg);
    console.log(`[EMAIL] SendGrid response:`, result[0]?.statusCode);
    console.log(`[EMAIL] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] SendGrid error details:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('[EMAIL] SendGrid response body:', sgError.response?.body);
      console.error('[EMAIL] SendGrid status code:', sgError.response?.statusCode);
    }
    
    return false;
  }
};

/**
 * Send a ticket confirmation email with QR code
 */
export const sendTicketEmail = async (
  ticketInfo: {
    eventName: string;
    eventDate: Date;
    eventLocation: string;
    ticketId: string;
    ticketType: string;
    ticketPrice: number;
    purchaseDate: Date;
    qrCodeDataUrl: string;
  }, 
  userEmail: string
): Promise<boolean> => {
  const { eventName, eventDate, eventLocation, ticketId, ticketType, ticketPrice, purchaseDate, qrCodeDataUrl } = ticketInfo;
  
  // Generate QR code as buffer for email attachment
  let qrCodeBuffer: Buffer;
  try {
    qrCodeBuffer = await QRCode.toBuffer(qrCodeDataUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return false;
  }
  
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const formattedPurchaseDate = new Date(purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedPrice = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(ticketPrice);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .ticket-container {
          border: 2px solid #cccccc;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }
        .event-name {
          font-size: 24px;
          font-weight: bold;
          color: #c01c28;
        }
        .ticket-details {
          margin: 20px 0;
        }
        .ticket-details div {
          margin-bottom: 8px;
        }
        .qr-container {
          text-align: center;
          margin: 30px 0;
        }
        .ticket-id {
          font-size: 14px;
          color: #666;
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #666;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src="https://sgxmedia.com/logo.png" alt="Savage Gentlemen" width="200" />
      </div>
      
      <p>Thank you for your purchase!</p>
      
      <p>Here is your ticket for <strong>${eventName}</strong>. Please present the QR code below at the event entrance.</p>
      
      <div class="ticket-container">
        <div class="event-name">${eventName}</div>
        
        <div class="ticket-details">
          <div><strong>Date & Time:</strong> ${formattedDate}</div>
          <div><strong>Location:</strong> ${eventLocation}</div>
          <div><strong>Ticket Type:</strong> ${ticketType}</div>
          <div><strong>Price:</strong> ${formattedPrice}</div>
          <div><strong>Purchase Date:</strong> ${formattedPurchaseDate}</div>
        </div>
        
        <div class="qr-container">
          <img src="cid:qrcode" alt="Ticket QR Code" width="250" />
        </div>
        
        <div class="ticket-id">Ticket ID: ${ticketId}</div>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${userEmail} by Savage Gentlemen.</p>
        <p>If you have any questions, please contact us at support@sgxmedia.com</p>
        <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Your ticket for ${eventName}`,
    html,
    attachments: [
      {
        content: qrCodeBuffer.toString('base64'),
        filename: 'qrcode.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'qrcode'
      }
    ]
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (
  orderInfo: {
    orderId: string;
    orderDate: Date;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    shippingAddress?: string;
  },
  userEmail: string
): Promise<boolean> => {
  const { orderId, orderDate, items, totalAmount, shippingAddress } = orderInfo;
  
  const formattedDate = new Date(orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTotal = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(totalAmount);
  
  let itemsHtml = '';
  items.forEach(item => {
    const formattedPrice = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(item.price);
    
    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formattedPrice}</td>
      </tr>
    `;
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .order-container {
          border: 2px solid #cccccc;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }
        .order-header {
          font-size: 24px;
          font-weight: bold;
          color: #c01c28;
          margin-bottom: 20px;
        }
        .order-details {
          margin: 20px 0;
        }
        .order-details div {
          margin-bottom: 8px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th {
          background-color: #f7f7f7;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #666;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src="https://sgxmedia.com/logo.png" alt="Savage Gentlemen" width="200" />
      </div>
      
      <p>Thank you for your order!</p>
      
      <div class="order-container">
        <div class="order-header">Order Confirmation</div>
        
        <div class="order-details">
          <div><strong>Order ID:</strong> ${orderId}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          ${shippingAddress ? `<div><strong>Shipping Address:</strong> ${shippingAddress}</div>` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2" style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">Total:</td>
              <td style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${userEmail} by Savage Gentlemen.</p>
        <p>If you have any questions, please contact us at support@sgxmedia.com</p>
        <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Order Confirmation #${orderId}`,
    html
  });
};

/**
 * Send admin notification about important events
 */
export const sendAdminNotification = async (
  subject: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> => {
  let dataHtml = '';
  
  if (data) {
    dataHtml = '<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">';
    for (const [key, value] of Object.entries(data)) {
      dataHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
        </tr>
      `;
    }
    dataHtml += '</table>';
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .notification {
          background-color: #f7f7f7;
          border-left: 4px solid #c01c28;
          padding: 20px;
          margin: 20px 0;
        }
        .header {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="notification">
        <div class="header">${subject}</div>
        <p>${message}</p>
        ${dataHtml}
      </div>
      
      <div class="footer">
        <p>This is an automated notification from the Savage Gentlemen platform.</p>
        <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin Alert] ${subject}`,
    html
  });
};

/**
 * Send a welcome email to new users
 */
export const sendWelcomeEmail = async (
  userName: string,
  userEmail: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .welcome-container {
          border: 2px solid #cccccc;
          border-radius: 8px;
          padding: 30px;
          margin-top: 20px;
        }
        .welcome-header {
          font-size: 28px;
          font-weight: bold;
          color: #c01c28;
          margin-bottom: 20px;
          text-align: center;
        }
        .cta-button {
          display: inline-block;
          background-color: #c01c28;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #666;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .social-links {
          text-align: center;
          margin-top: 20px;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src="https://sgxmedia.com/logo.png" alt="Savage Gentlemen" width="200" />
      </div>
      
      <div class="welcome-container">
        <div class="welcome-header">Welcome to Savage Gentlemen!</div>
        
        <p>Hello ${userName},</p>
        
        <p>Thank you for joining the Savage Gentlemen community! We're excited to have you as part of our growing family.</p>
        
        <p>With your new account, you can:</p>
        <ul>
          <li>Purchase tickets to exclusive events</li>
          <li>Shop our merchandise collection</li>
          <li>Watch livestreams</li>
          <li>Connect with other community members</li>
          <li>Get notified of new releases and events</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="https://sgxmedia.com" class="cta-button">Explore Now</a>
        </div>
        
        <p>If you have any questions or need assistance, our team is always ready to help.</p>
        
        <p>Welcome aboard!</p>
        <p>The Savage Gentlemen Team</p>
        
        <div class="social-links">
          <a href="https://instagram.com/savage_gentlemen" target="_blank">Instagram</a> |
          <a href="https://facebook.com/savagegentlemen" target="_blank">Facebook</a> |
          <a href="https://twitter.com/savage_gent" target="_blank">Twitter</a>
        </div>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${userEmail} by Savage Gentlemen.</p>
        <p>If you have any questions, please contact us at support@sgxmedia.com</p>
        <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Welcome to Savage Gentlemen!`,
    html
  });
};

/**
 * Send a password reset email with a reset link
 */
export const sendPasswordResetEmail = async (
  userName: string,
  userEmail: string,
  resetUrl: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .reset-container {
          border: 2px solid #cccccc;
          border-radius: 8px;
          padding: 30px;
          margin-top: 20px;
        }
        .reset-header {
          font-size: 24px;
          font-weight: bold;
          color: #c01c28;
          margin-bottom: 20px;
          text-align: center;
        }
        .reset-button {
          display: inline-block;
          background-color: #c01c28;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .reset-link {
          word-break: break-all;
          background-color: #f7f7f7;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          margin: 15px 0;
          border: 1px solid #eee;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #666;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .note {
          font-size: 14px;
          color: #666;
          margin-top: 20px;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="logo">
        <img src="https://sgxmedia.com/logo.png" alt="Savage Gentlemen" width="200" />
      </div>
      
      <div class="reset-container">
        <div class="reset-header">Reset Your Password</div>
        
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password for your Savage Gentlemen account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="reset-button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <div class="reset-link">${resetUrl}</div>
        
        <div class="note">
          <strong>Note:</strong> This link will expire in 1 hour for security reasons.
        </div>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${userEmail} by Savage Gentlemen.</p>
        <p>If you have any questions, please contact us at support@sgxmedia.com</p>
        <p>&copy; ${new Date().getFullYear()} Savage Gentlemen. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: userEmail,
    subject: `Reset Your Password - Savage Gentlemen`,
    html
  });
};