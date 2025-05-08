import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable must be set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// The sender email that will be used for all communications
const DEFAULT_FROM_EMAIL = 'noreply@sgxmedia.com';
const ADMIN_EMAIL = 'admin@sgxmedia.com'; // Replace with actual admin email

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
    
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
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
          <img src="${qrCodeDataUrl}" alt="Ticket QR Code" width="250" />
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
    html
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