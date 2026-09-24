// Email Provider Configuration
// This file manages switching between different email providers and dispatches all system emails.

import * as sendgrid from './email.js';
import * as mailersend from './email-mailersend.js';
import * as brevo from './email-brevo.js';
import * as gmail from './email-gmail.js';
import * as smtp from './email-smtp.js';

export type EmailProvider = 'sendgrid' | 'mailersend' | 'brevo' | 'gmail' | 'smtp' | 'privateemail';

const providers: Record<string, any> = {
  sendgrid,
  mailersend,
  brevo,
  gmail,
  smtp,
  privateemail: smtp
};

export const getActiveProvider = () => {
  const selected = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase();
  return providers[selected] || providers.brevo || providers.smtp;
};

const getAdminEmail = () => {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    process.env.SENDGRID_VERIFIED_SENDER_EMAIL ||
    'info@savgent.com'
  );
};

// Core sending primitives delegated to the active provider
export const sendEmail = async (options: any): Promise<boolean> => {
  return getActiveProvider().sendEmail(options);
};

export const sendTicketEmail = async (ticketInfo: any, recipientEmail: string): Promise<boolean> => {
  const provider = getActiveProvider();
  if (provider.sendTicketEmail) {
    return provider.sendTicketEmail(ticketInfo, recipientEmail);
  }
  return providers.brevo.sendTicketEmail(ticketInfo, recipientEmail);
};

export const testEmailConnection = async (): Promise<boolean> => {
  const provider = getActiveProvider();
  if (provider.testEmailConnection) {
    return provider.testEmailConnection();
  }
  return Promise.resolve(true);
};

/**
 * Send order confirmation email across any active provider
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .order-container { border: 2px solid #cccccc; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .order-header { font-size: 24px; font-weight: bold; color: #c01c28; margin-bottom: 20px; }
        .order-details { margin: 20px 0; }
        .order-details div { margin-bottom: 8px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background-color: #f7f7f7; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        .total-row { font-weight: bold; font-size: 18px; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
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
          <tbody>${itemsHtml}</tbody>
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
        <p>If you have any questions, please contact us at info@savgent.com</p>
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
 * Send admin notification email across any active provider
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .notification { background-color: #f7f7f7; border-left: 4px solid #c01c28; padding: 20px; margin: 20px 0; }
        .header { font-size: 20px; font-weight: bold; margin-bottom: 15px; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
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
    to: getAdminEmail(),
    subject: `[Admin Alert] ${subject}`,
    html
  });
};

/**
 * Send a welcome email to new users across any active provider
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .welcome-container { border: 2px solid #cccccc; border-radius: 8px; padding: 30px; margin-top: 20px; }
        .welcome-header { font-size: 28px; font-weight: bold; color: #c01c28; margin-bottom: 20px; text-align: center; }
        .cta-button { display: inline-block; background-color: #c01c28; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .social-links { text-align: center; margin-top: 20px; }
        .social-links a { margin: 0 10px; text-decoration: none; }
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
        <div style="text-align: center;">
          <a href="https://www.savgent.com" class="cta-button">Explore Now</a>
        </div>
        <p>If you have any questions or need assistance, our team is always ready to help.</p>
        <p>Welcome aboard!<br>The Savage Gentlemen Team</p>
      </div>
      <div class="footer">
        <p>This email was sent to ${userEmail} by Savage Gentlemen.</p>
        <p>Questions? Contact us at: info@savgent.com</p>
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
 * Send a password reset email across any active provider
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .reset-container { border: 2px solid #cccccc; border-radius: 8px; padding: 30px; margin-top: 20px; }
        .reset-header { font-size: 24px; font-weight: bold; color: #c01c28; margin-bottom: 20px; text-align: center; }
        .reset-button { display: inline-block; background-color: #c01c28; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 20px 0; }
        .reset-link { word-break: break-all; background-color: #f7f7f7; padding: 10px; border-radius: 4px; font-family: monospace; margin: 15px 0; border: 1px solid #eee; }
        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .logo { text-align: center; margin-bottom: 20px; }
        .note { font-size: 14px; color: #666; margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 4px; }
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
        <p>Questions? Contact us at: info@savgent.com</p>
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

// Test all providers and return the first working one
export const findWorkingEmailProvider = async (): Promise<EmailProvider | null> => {
  const providersToTest: EmailProvider[] = ['brevo', 'smtp', 'gmail', 'mailersend', 'sendgrid'];
  
  for (const provider of providersToTest) {
    try {
      console.log(`[EMAIL_PROVIDER] Testing provider: ${provider}`);
      const providerModule = providers[provider];
      
      if (providerModule && providerModule.testEmailConnection) {
        const isWorking = await providerModule.testEmailConnection();
        if (isWorking) {
          console.log(`[EMAIL_PROVIDER] Provider ${provider} is working`);
          return provider;
        }
      }
    } catch (error: any) {
      console.error(`[EMAIL_PROVIDER] Provider ${provider} failed:`, error?.message || error);
    }
  }
  
  return null;
};

// Auto-detect and switch to working provider
export const autoSwitchToWorkingProvider = async (): Promise<boolean> => {
  const workingProvider = await findWorkingEmailProvider();
  
  if (workingProvider) {
    console.log(`[EMAIL_PROVIDER] Auto-switching to working provider: ${workingProvider}`);
    process.env.EMAIL_PROVIDER = workingProvider;
    return true;
  }
  
  console.error('[EMAIL_PROVIDER] No working email provider found');
  return false;
};