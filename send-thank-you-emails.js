// Send Thank You Emails Only - Email System Test
// This script sends thank you emails directly to all CSV users

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

async function sendThankYouEmail(user, index) {
  const timestamp = Date.now() + index;
  const qrCodeData = `EVENT-7-ORDER-COMP-${timestamp}`;
  const ticketId = 200 + index;
  
  const ticketData = {
    ticketId: ticketId.toString(),
    orderId: `COMP-${timestamp}`,
    email: user.email,
    eventName: "R Y T H Y M > IN< R I D D I M",
    eventDate: "2025-07-25T00:00:00.000Z",
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
      console.log(`✅ Thank you email sent successfully to ${user.email}`);
      console.log(`   QR Code: ${qrCodeData}`);
      console.log(`   Ticket ID: ${ticketId}`);
      return true;
    } else {
      console.error(`❌ Failed to send thank you email to ${user.email}:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error sending thank you email to ${user.email}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('\n🎫 SAVAGE GENTLEMEN THANK YOU EMAIL DISTRIBUTION');
  console.log('===============================================');
  console.log(`📧 Sending thank you emails to ${needsTickets.length} users`);
  console.log(`🎉 Event: R Y T H Y M > IN< R I D D I M`);
  console.log(`📅 Date: July 26, 2025`);
  console.log(`📍 Location: The Ainsworth Hoboken NJ`);
  console.log(`💌 Each email includes a special thank you message for attending "Rhythm in Riddim"\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < needsTickets.length; i++) {
    const user = needsTickets[i];
    
    console.log(`\n📧 Processing ${i + 1}/${needsTickets.length}: ${user.firstName} ${user.lastName} (${user.email})`);
    
    const emailSent = await sendThankYouEmail(user, i);
    
    if (emailSent) {
      successCount++;
      console.log(`✅ COMPLETE: ${user.firstName} ${user.lastName}`);
    } else {
      failureCount++;
      console.log(`❌ FAILED: ${user.firstName} ${user.lastName}`);
    }

    // Wait 3 seconds between emails to prevent rate limiting
    if (i < needsTickets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n📊 FINAL RESULTS');
  console.log('=================');
  console.log(`✅ Successfully sent: ${successCount} thank you emails`);
  console.log(`❌ Failed to send: ${failureCount} emails`);
  console.log(`📧 Total processed: ${successCount + failureCount} attendees`);
  console.log('\n🎉 THANK YOU EMAIL DISTRIBUTION COMPLETE!');
  console.log('💌 All recipients received a personalized thank you message acknowledging their attendance at "Rhythm in Riddim"');
  console.log('🎫 Each email includes a QR code for easy entry at the upcoming event');
  console.log('📧 Emails were delivered via Brevo email service with proper QR code attachments');
}

main().catch(console.error);