import fetch from 'node-fetch';

async function sendComplimentaryTickets() {
  try {
    console.log('Starting to send complimentary tickets to Jclay...');
    
    // Event and ticket details
    const ticketData = {
      userId: 824,
      userName: 'Jclay',
      userEmail: 'clayton7j@gmail.com',
      eventId: 7,
      eventTitle: 'R Y T H Y M > IN< R I D D I M',
      eventDate: 'Friday, July 25, 2025',
      eventTime: '10:00 PM',
      eventLocation: 'The Ainsworth, Hoboken NJ',
      orderId: 149,
      ticketPurchases: [
        {
          id: 110,
          qrCode: 'EVENT-7-ORDER-149-1753404658-1',
          ticketType: 'Ladies General Admission'
        },
        {
          id: 111,
          qrCode: 'EVENT-7-ORDER-149-1753404658-2',
          ticketType: 'Ladies General Admission'
        }
      ]
    };

    // Use the backend email API to send tickets
    const response = await fetch('http://localhost:5000/api/tickets/send-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-id': '8',
        'Authorization': 'Bearer ODpLcnM6MTc1MjIwMDcyMzIzNQ=='
      },
      body: JSON.stringify({
        email: ticketData.userEmail,
        userName: ticketData.userName,
        eventTitle: ticketData.eventTitle,
        eventDate: ticketData.eventDate,
        eventTime: ticketData.eventTime,
        eventLocation: ticketData.eventLocation,
        orderId: ticketData.orderId,
        tickets: ticketData.ticketPurchases.map(purchase => ({
          id: purchase.id,
          qrCode: purchase.qrCode,
          ticketType: purchase.ticketType,
          isComplimentary: true
        })),
        complimentary: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Email sent successfully!');
    console.log('✅ 2 complimentary tickets delivered to Jclay at clayton7j@gmail.com');
    
    return {
      success: true,
      result: result,
      recipient: ticketData.userEmail,
      ticketCount: ticketData.ticketPurchases.length
    };

  } catch (error) {
    console.error('❌ Failed to send complimentary tickets:', error.message);
    throw error;
  }
}

// Execute the function
sendComplimentaryTickets()
  .then(result => {
    console.log('\n🎉 COMPLIMENTARY TICKETS SENT SUCCESSFULLY!');
    console.log(`📧 Delivered to: ${result.recipient}`);
    console.log(`🎫 Ticket count: ${result.ticketCount}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ FAILED TO SEND TICKETS:');
    console.error(error.message);
    process.exit(1);
  });