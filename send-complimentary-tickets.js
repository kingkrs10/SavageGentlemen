// Send Complimentary Tickets to CSV Users
// This script creates tickets for users from the CSV who don't have tickets yet

import fetch from 'node-fetch';
const baseUrl = 'http://localhost:5000';

// Users who need tickets (from CSV analysis)
const needsTickets = [
  { email: 'Luga.ea@gmail.com', firstName: 'Michael', lastName: 'Hilliman' },
  { email: 'Bdparrish@live.com', firstName: 'Brandon', lastName: 'Parrish' },
  { email: 'Jumoke.charles1@gmail.com', firstName: 'Jumoke', lastName: 'Charles' },
  { email: 'jordan.tapia133@gmail.com', firstName: 'Jordan', lastName: 'Tapia' },
  { email: 'Smarchan1892@gmail.com', firstName: 'Samantha', lastName: 'Marchan' },
  { email: 'Lcampbell973@gmail.com', firstName: 'Lawrence', lastName: 'Campbell' },
  { email: 'Brandonwhite2020@gmail.com', firstName: 'Brandon', lastName: 'White' },
  { email: 'Jeffvisualarts@gmail.com', firstName: 'Jeff', lastName: 'Gee' },
  { email: 'campbelljeff18@gmail.com', firstName: 'JEFF', lastName: 'CAMPBELL' },
  { email: 'clayton7j@gmail.com', firstName: 'Janelle', lastName: 'Clayton' },
  { email: 'EmpressInde@icloud.com', firstName: 'Indira', lastName: 'Singh' },
  { email: 'Queenj101@gmail.com', firstName: 'Jaye', lastName: 'Dee' },
  { email: 'Janayeimani@gmail.com', firstName: 'Janaye', lastName: 'Williams' },
  { email: 'Ianess550@gmail.com', firstName: 'Ruben', lastName: 'Jean-Baptiste' },
  { email: 'carlton.cartyjr@gmail.com', firstName: 'Carlton', lastName: 'Carty Jr' },
  { email: 'Jazzybrown35@gmail.com', firstName: 'Jasmine', lastName: 'Moore' },
  { email: 'Wandamorose12@gmail.com', firstName: 'Wanda', lastName: 'Morose' },
  { email: 'Paulettemarks@gmail.com', firstName: 'Paulette', lastName: 'Marks' },
  { email: 'D.mindful1@gmail.com', firstName: 'Denise', lastName: 'Williams' },
  { email: 'Xolove0711xo@gmail.com', firstName: 'Kea', lastName: 'Coleman' },
  { email: 'Shauntelp90210@gmail.com', firstName: 'Shauntel', lastName: 'Pierre' },
  { email: 'Sobers34@gmail.com', firstName: 'Tiffany', lastName: 'Sobers' },
  { email: 'jparch77@gmail.com', firstName: 'Jeremy', lastName: 'Parchment' },
  { email: 'Gerriemcummings@gmail.com', firstName: 'Gerrie', lastName: 'Cummings' },
  { email: 'samath8975@aol.com', firstName: 'ODETTA', lastName: 'ARTHUR' }
];

async function sendTicketEmail(user, qrCodeData, ticketId, orderId) {
  const ticketData = {
    ticketId: ticketId.toString(),
    orderId: orderId.toString(),
    email: user.email,
    eventName: "R Y T H Y M > IN< R I D D I M",
    eventDate: "2025-07-26T00:00:00.000Z",
    eventLocation: "The Ainsworth Hoboken NJ",
    ticketName: "Complimentary Ticket - Thank You for Supporting Savage Gentlemen",
    ticketType: "complimentary",
    ticketPrice: 0,
    holderName: `${user.firstName} ${user.lastName}`,
    qrCodeDataUrl: qrCodeData
  };

  try {
    const response = await fetch(`${baseUrl}/api/tickets/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Ticket sent successfully to ${user.email}`);
      return true;
    } else {
      console.error(`❌ Failed to send ticket to ${user.email}:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending ticket to ${user.email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('\n🎫 SAVAGE GENTLEMEN COMPLIMENTARY TICKET DISTRIBUTION');
  console.log('====================================================');
  console.log(`📧 Sending complimentary tickets to ${needsTickets.length} users`);
  console.log(`🎉 Event: R Y T H Y M > IN< R I D D I M`);
  console.log(`📅 Date: July 26, 2025`);
  console.log(`📍 Location: The Ainsworth Hoboken NJ\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < needsTickets.length; i++) {
    const user = needsTickets[i];
    const timestamp = Date.now();
    const orderId = timestamp + i;
    const qrCodeData = `EVENT-7-ORDER-COMP-${orderId}`;
    const ticketId = 200 + i; // Starting from 200 to avoid conflicts

    console.log(`\n📧 Processing ${i + 1}/${needsTickets.length}: ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Create ticket purchase record first
    try {
      const createResponse = await fetch(`${baseUrl}/api/admin/manual-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ODpLcnM6MTc1MjIwMDcyMzIzNQ==',
          'user-id': '8'
        },
        body: JSON.stringify({
          eventId: 7,
          ticketId: 14, // Use the hidden free ticket type
          attendeeEmail: user.email,
          attendeeName: `${user.firstName} ${user.lastName}`,
          amount: 0,
          ticketType: 'complimentary'
        })
      });

      if (createResponse.ok) {
        const ticketData = await createResponse.json();
        console.log(`✅ Ticket created with ID: ${ticketData.ticketId}`);
        
        // Send email with ticket
        const emailSent = await sendTicketEmail(user, qrCodeData, ticketData.ticketId, orderId);
        
        if (emailSent) {
          successCount++;
        } else {
          failureCount++;
        }
      } else {
        console.error(`❌ Failed to create ticket for ${user.email}`);
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating ticket for ${user.email}:`, error.message);
      failureCount++;
    }

    // Wait 3 seconds between emails to prevent rate limiting
    if (i < needsTickets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n📊 FINAL RESULTS');
  console.log('=================');
  console.log(`✅ Successfully sent: ${successCount} tickets`);
  console.log(`❌ Failed to send: ${failureCount} tickets`);
  console.log(`📧 Total processed: ${successCount + failureCount} emails`);
  console.log('\n🎉 Complimentary ticket distribution complete!');
}

main().catch(console.error);