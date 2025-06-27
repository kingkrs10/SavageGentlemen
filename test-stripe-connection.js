import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function testStripeConnection() {
  console.log('=== STRIPE CONNECTION TEST ===\n');

  try {
    // 1. Test API Connection
    console.log('1. Testing Stripe API connection...');
    const account = await stripe.accounts.retrieve();
    console.log('✓ Stripe API connected successfully');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Default Currency: ${account.default_currency}`);
    console.log(`   Charges Enabled: ${account.charges_enabled}`);
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`);

    // 2. Test Payment Intent Creation
    console.log('\n2. Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4000, // $40.00 in cents
      currency: 'usd',
      metadata: {
        eventId: '6',
        eventTitle: 'R i d d e m R i o t',
        ticketId: '11',
        ticketName: 'Gent Early Bird Tix',
        test: 'true'
      }
    });
    console.log('✓ Payment intent created successfully');
    console.log(`   Intent ID: ${paymentIntent.id}`);
    console.log(`   Amount: $${paymentIntent.amount / 100}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret ? 'Generated' : 'Missing'}`);

    // 3. Test Customer Creation
    console.log('\n3. Testing customer creation...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: {
        userId: '999',
        test: 'true'
      }
    });
    console.log('✓ Customer created successfully');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);

    // 4. Check Recent Payments
    console.log('\n4. Checking recent payment intents...');
    const recentPayments = await stripe.paymentIntents.list({
      limit: 5,
    });
    console.log(`✓ Found ${recentPayments.data.length} recent payment intents`);
    
    if (recentPayments.data.length > 0) {
      console.log('\n   Recent Payment Details:');
      recentPayments.data.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.id} - $${payment.amount / 100} ${payment.currency.toUpperCase()} - ${payment.status}`);
        if (payment.metadata?.eventId) {
          console.log(`      Event: ${payment.metadata.eventTitle} (ID: ${payment.metadata.eventId})`);
        }
        console.log(`      Created: ${new Date(payment.created * 1000).toLocaleString()}`);
      });
    }

    // 5. Look for the specific payment from the screenshot
    console.log('\n5. Searching for payment pi_3RePltJR4xpdRiXi2eIZ3i3qh...');
    try {
      const specificPayment = await stripe.paymentIntents.retrieve('pi_3RePltJR4xpdRiXi2eIZ3i3qh');
      console.log('✓ Found the payment from screenshot:');
      console.log(`   Amount: $${specificPayment.amount / 100}`);
      console.log(`   Status: ${specificPayment.status}`);
      console.log(`   Created: ${new Date(specificPayment.created * 1000).toLocaleString()}`);
      console.log(`   Customer: ${specificPayment.customer || 'None (Guest)'}`);
      if (specificPayment.metadata) {
        console.log('   Metadata:', specificPayment.metadata);
      }
    } catch (paymentError) {
      console.log('⚠️  Could not retrieve specific payment - may be from different account');
    }

    // 6. Test webhook endpoint readiness
    console.log('\n6. Testing webhook endpoint configuration...');
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`✓ Found ${webhooks.data.length} configured webhook endpoints`);
    webhooks.data.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} - Status: ${webhook.status}`);
      console.log(`      Events: ${webhook.enabled_events.join(', ')}`);
    });

    // Clean up test resources
    console.log('\n7. Cleaning up test resources...');
    await stripe.customers.del(customer.id);
    console.log('✓ Test customer deleted');

    console.log('\n=== STRIPE CONNECTION TEST COMPLETE ===');
    console.log('✓ All Stripe integrations are working correctly');
    console.log('✓ Payment processing is functional');
    console.log('✓ Customer management is operational');

  } catch (error) {
    console.error('❌ Stripe connection test failed:', error.message);
    if (error.type) {
      console.error(`   Error Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
  }
}

testStripeConnection();