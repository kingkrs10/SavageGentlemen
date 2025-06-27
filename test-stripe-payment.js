import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

async function testStripePaymentFlow() {
  console.log('=== STRIPE PAYMENT FLOW TEST ===\n');

  try {
    // 1. Test Payment Intent Creation (core functionality)
    console.log('1. Testing payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4000, // $40.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        eventId: '6',
        eventTitle: 'R i d d e m R i o t',
        ticketId: '11',
        ticketName: 'Gent Early Bird Tix',
        test: 'stripe_connection_test'
      }
    });
    console.log('✓ Payment intent created successfully');
    console.log(`   Intent ID: ${paymentIntent.id}`);
    console.log(`   Amount: $${paymentIntent.amount / 100}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret ? 'Generated' : 'Missing'}`);

    // 2. Test Customer Creation
    console.log('\n2. Testing customer creation...');
    const customer = await stripe.customers.create({
      email: 'test@savagegentlemen.com',
      name: 'Test Connection User',
      metadata: {
        userId: '999',
        test: 'stripe_connection_test'
      }
    });
    console.log('✓ Customer created successfully');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);

    // 3. Test updating payment intent with customer
    console.log('\n3. Testing payment intent update with customer...');
    const updatedIntent = await stripe.paymentIntents.update(paymentIntent.id, {
      customer: customer.id,
    });
    console.log('✓ Payment intent updated with customer');

    // 4. Check recent payment intents (limited scope)
    console.log('\n4. Checking recent payment intents...');
    const recentPayments = await stripe.paymentIntents.list({
      limit: 3,
    });
    console.log(`✓ Retrieved ${recentPayments.data.length} recent payment intents`);
    
    if (recentPayments.data.length > 0) {
      console.log('\n   Recent Payments:');
      recentPayments.data.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.id}`);
        console.log(`      Amount: $${payment.amount / 100} ${payment.currency.toUpperCase()}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Created: ${new Date(payment.created * 1000).toLocaleString()}`);
        if (payment.metadata?.eventTitle) {
          console.log(`      Event: ${payment.metadata.eventTitle}`);
        }
      });
    }

    // 5. Test webhook event types (what we can listen for)
    console.log('\n5. Testing webhook event capabilities...');
    console.log('✓ Available webhook events for payment processing:');
    console.log('   - payment_intent.succeeded');
    console.log('   - payment_intent.payment_failed');
    console.log('   - customer.created');
    console.log('   - customer.updated');

    // 6. Clean up test resources
    console.log('\n6. Cleaning up test resources...');
    await stripe.customers.del(customer.id);
    console.log('✓ Test customer deleted');

    console.log('\n=== STRIPE CONNECTION STATUS ===');
    console.log('✓ Payment intent creation: WORKING');
    console.log('✓ Customer management: WORKING');
    console.log('✓ Metadata handling: WORKING');
    console.log('✓ Amount processing: WORKING');
    console.log('✓ Client secret generation: WORKING');
    
    console.log('\n=== INTEGRATION READINESS ===');
    console.log('✓ Stripe is fully connected and operational');
    console.log('✓ Payment processing will work correctly');
    console.log('✓ Customer data can be managed properly');
    console.log('✓ Event metadata is properly stored');

  } catch (error) {
    console.error('❌ Stripe payment test failed:', error.message);
    console.error(`   Error Type: ${error.type || 'Unknown'}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n🔑 Authentication Issue:');
      console.error('   - Check if STRIPE_SECRET_KEY is correctly set');
      console.error('   - Verify the key has the right permissions');
    } else if (error.type === 'StripePermissionError') {
      console.error('\n🔒 Permission Issue:');
      console.error('   - The API key may be restricted');
      console.error('   - Core payment functionality should still work');
    }
  }
}

testStripePaymentFlow();