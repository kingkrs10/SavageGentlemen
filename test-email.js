import 'dotenv/config';
import { sendTicketEmail } from './server/email-brevo.js';

async function test() {
  console.log("Testing Brevo email...");
  const res = await sendTicketEmail({
    eventName: "Test Event",
    eventDate: new Date(),
    eventLocation: "123 Main St",
    ticketId: "123",
    qrCodeDataUrl: "https://example.com/qr.png",
    ticketType: "General",
    ticketPrice: 10,
    purchaseDate: new Date()
  }, "test@example.com");
  console.log("Result:", res);
}

test();
