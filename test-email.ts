import 'dotenv/config';
import { testEmailConnection, sendTicketEmail, getActiveProvider } from './server/email-provider';

async function test() {
  console.log(`\n========================================`);
  console.log(`Testing Email Configuration`);
  console.log(`Active Provider: ${process.env.EMAIL_PROVIDER || 'brevo'}`);
  console.log(`========================================\n`);

  console.log("1. Verifying SMTP / API connection...");
  const isConnected = await testEmailConnection();
  console.log(`Connection test result: ${isConnected ? '✓ SUCCESS' : '✗ FAILED'}`);

  if (process.argv.includes('--send')) {
    const targetEmail = process.argv[3] || 'info@savgent.com';
    console.log(`\n2. Attempting to send test ticket email to: ${targetEmail}...`);
    const res = await sendTicketEmail({
      eventName: "Test Ticket Event",
      eventDate: new Date(),
      eventLocation: "Savage Gentlemen VIP Lounge",
      ticketId: "TEST-001",
      qrCodeDataUrl: "https://savgent.com/tickets/test-001",
      ticketType: "VIP Admission",
      ticketPrice: 25,
      purchaseDate: new Date(),
      eventTime: "10:00 PM"
    }, targetEmail);
    console.log(`Send ticket email result: ${res ? '✓ DELIVERED' : '✗ FAILED'}`);
  } else {
    console.log(`\nTip: Run 'npx tsx test-email.ts --send <recipient@example.com>' to dispatch a test ticket email.`);
  }
}

test();
