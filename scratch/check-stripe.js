import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function main() {
  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });
    console.log("Recent Checkout Sessions:");
    sessions.data.forEach(s => {
      console.log(`ID: ${s.id}, Customer Details: ${JSON.stringify(s.customer_details)}, Amount: ${s.amount_total}, Status: ${s.payment_status}`);
    });

    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10,
    });
    console.log("\nRecent Payment Intents:");
    paymentIntents.data.forEach(p => {
      console.log(`ID: ${p.id}, Amount: ${p.amount}, Status: ${p.status}, Receipt Email: ${p.receipt_email}`);
    });

  } catch (err) {
    console.error(err);
  }
}

main();
