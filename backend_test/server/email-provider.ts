// Email Provider Configuration
// This file manages switching between different email providers

// Import all available email providers
import * as sendgrid from './email.js';
import * as mailersend from './email-mailersend.js';
import * as brevo from './email-brevo.js';
import * as gmail from './email-gmail.js';

// Email provider types
type EmailProvider = 'sendgrid' | 'mailersend' | 'brevo' | 'gmail';

// Get the current email provider from environment variable
const EMAIL_PROVIDER: EmailProvider = 'sendgrid';

// Provider configuration
const providers = {
  sendgrid,
  mailersend,
  brevo,
  gmail
};

// Get the current provider
const currentProvider = providers[EMAIL_PROVIDER];

console.log(`[EMAIL_PROVIDER] Using email provider: ${EMAIL_PROVIDER}`);

// Export the functions from the current provider
export const sendEmail = currentProvider.sendEmail;
export const sendTicketEmail = currentProvider.sendTicketEmail;
export const testEmailConnection = currentProvider.testEmailConnection || (() => Promise.resolve(true));

// For missing functions, fall back to sendgrid
export const sendOrderConfirmation = sendgrid.sendOrderConfirmation;
export const sendAdminNotification = sendgrid.sendAdminNotification;
export const sendWelcomeEmail = sendgrid.sendWelcomeEmail;
export const sendPasswordResetEmail = sendgrid.sendPasswordResetEmail;

// Test all providers and return the first working one
export const findWorkingEmailProvider = async (): Promise<EmailProvider | null> => {
  const providersToTest: EmailProvider[] = ['gmail', 'brevo', 'mailersend', 'sendgrid'];
  
  for (const provider of providersToTest) {
    try {
      console.log(`[EMAIL_PROVIDER] Testing provider: ${provider}`);
      const providerModule = providers[provider];
      
      if (providerModule.testEmailConnection) {
        const isWorking = await providerModule.testEmailConnection();
        if (isWorking) {
          console.log(`[EMAIL_PROVIDER] Provider ${provider} is working`);
          return provider;
        }
      }
    } catch (error) {
      console.error(`[EMAIL_PROVIDER] Provider ${provider} failed:`, error.message);
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