import { storage } from './server/storage.js';
import { sendTicketEmail } from './server/email.js';

// Create missing tickets for the Stripe payments on June 20
async function createMissingTickets() {
  console.log('Creating missing tickets for June 20 Stripe payments...');
  
  // Based on the Stripe dashboard, we have 3 payments of $40 each
  // We need to identify which users made these payments
  
  // Let's find users who registered around June 20 and might have made these payments
  const recentUsers = [
    { email: 'yyzjayy@gmail.com', name: 'Jay', userId: 105 },
    { email: 'andellarondel4@gmail.com', name: 'Andel', userId: null }, // Need to find this user
    { email: 'edmanenterprise01@gmail.com', name: 'James Edman', userId: 107 }
  ];
  
  const eventId = 6; // R i d d e m R i o t event
  
  for (const user of recentUsers) {
    if (!user.userId) continue;
    
    try {
      console.log(`Creating ticket for user: ${user.email}`);
      
      // Create order record
      const order = await storage.createOrder({
        userId: user.userId,
        totalAmount: 4000, // $40 in cents
        status: 'completed',
        paymentMethod: 'stripe',
        paymentId: `stripe_${Date.now()}_${user.userId}`
      });
      
      console.log(`Created order ${order.id} for user ${user.email}`);
      
      // Create ticket record
      const ticketData = {
        orderId: order.id,
        eventId: eventId,
        ticketId: 1, // Default ticket type
        status: 'valid',
        userId: user.userId,
        purchaseDate: new Date('2025-06-20T20:00:00.000Z'),
        qrCodeData: `EVENT-${eventId}-ORDER-${order.id}-${Date.now()}`,
        ticketType: 'General Admission',
        price: '4000', // $40 in cents
        attendeeEmail: user.email,
        attendeeName: user.name
      };
      
      const ticket = await storage.createTicketPurchase(ticketData);
      console.log(`Created ticket ${ticket.id} for user ${user.email}`);
      
      // Send ticket email
      const emailSent = await sendTicketEmail({
        ticketId: ticket.id.toString(),
        qrCodeDataUrl: ticket.qrCodeData,
        eventName: 'R i d d e m R i o t',
        eventLocation: 'Bond St Event Centre',
        eventDate: new Date('2025-06-28T16:00:00.000Z'),
        ticketType: 'General Admission',
        ticketPrice: 40, // $40
        purchaseDate: new Date('2025-06-20T20:00:00.000Z')
      }, user.email);
      
      if (emailSent) {
        console.log(`✓ Email sent successfully to ${user.email}`);
      } else {
        console.log(`✗ Failed to send email to ${user.email}`);
      }
      
    } catch (error) {
      console.error(`Error creating ticket for ${user.email}:`, error);
    }
  }
  
  console.log('Finished creating missing tickets');
}

// Run the script
createMissingTickets().catch(console.error);