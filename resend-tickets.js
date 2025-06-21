const { sendTicketEmail } = require('./server/email.ts');
const { DatabaseStorage } = require('./server/storage.ts');

// Script to resend ticket emails for recent purchases
async function resendRecentTickets() {
  const storage = new DatabaseStorage();
  
  // Get recent ticket purchases from June 18-19, 2025
  const recentTickets = [
    {
      id: 38,
      userId: 14,
      email: 'Ejarvis473@gmail.com',
      qrCode: 'EVENT-6-ORDER-45-1750305940346',
      purchaseDate: '2025-06-19 04:05:40.346',
      username: 'Savagegentleman'
    },
    {
      id: 37,
      userId: 8,
      email: 'info@savgent.com',
      qrCode: 'EVENT-6-ORDER-44-1750294742666',
      purchaseDate: '2025-06-19 00:59:02.666',
      username: 'Krs'
    },
    {
      id: 36,
      userId: 55,
      email: 'hello.tenika@gmail.com',
      qrCode: 'EVENT-6-ORDER-43-1750275187106',
      purchaseDate: '2025-06-18 19:33:07.106',
      username: 'hellotenika'
    },
    {
      id: 35,
      userId: 55,
      email: 'hello.tenika@gmail.com',
      qrCode: 'EVENT-6-ORDER-42-1750275147147',
      purchaseDate: '2025-06-18 19:32:27.147',
      username: 'hellotenika'
    },
    {
      id: 34,
      userId: 2,
      email: 'savgmen@gmail.com',
      qrCode: 'EVENT-6-ORDER-41-1750274749336',
      purchaseDate: '2025-06-18 19:25:49.336',
      username: 'SavageGentlemen'
    },
    {
      id: 33,
      userId: 8,
      email: 'info@savgent.com',
      qrCode: 'EVENT-6-ORDER-40-1750274549911',
      purchaseDate: '2025-06-18 19:22:29.911',
      username: 'Krs'
    },
    {
      id: 32,
      userId: 2,
      email: 'savgmen@gmail.com',
      qrCode: 'EVENT-6-ORDER-39-1750272702356',
      purchaseDate: '2025-06-18 18:51:42.356',
      username: 'SavageGentlemen'
    }
  ];

  console.log(`Found ${recentTickets.length} recent ticket purchases to verify/resend emails`);

  for (const ticket of recentTickets) {
    try {
      console.log(`\nProcessing ticket ${ticket.id} for ${ticket.username} (${ticket.email})`);
      
      // Send ticket email with proper QR code
      const emailSent = await sendTicketEmail({
        ticketId: ticket.id.toString(),
        qrCodeDataUrl: ticket.qrCode,
        eventName: 'R i d d e m R i o t',
        eventLocation: 'Bond St Event Centre',
        eventDate: new Date('2025-06-28T16:00:00.000Z'),
        ticketType: 'Ladies Free w/RSVP ... Early Bird 💃🏽',
        ticketPrice: 0,
        purchaseDate: new Date(ticket.purchaseDate)
      }, ticket.email);
      
      if (emailSent) {
        console.log(`✓ Email successfully sent to ${ticket.email}`);
      } else {
        console.log(`✗ Failed to send email to ${ticket.email}`);
      }
      
    } catch (error) {
      console.error(`Error processing ticket ${ticket.id}:`, error.message);
    }
  }
  
  console.log('\nFinished processing all recent tickets');
}

// Run the script
resendRecentTickets().catch(console.error);