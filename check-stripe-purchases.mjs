import { db } from './server/db.ts';
import { orders, orderItems, ticketPurchases, events, users } from './shared/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

async function checkStripePurchases() {
  console.log('🔍 Checking for completed Stripe orders...');
  
  // 1. Get all completed Stripe orders
  const stripeOrders = await db.select().from(orders).where(
    and(
      eq(orders.paymentMethod, 'stripe'),
      eq(orders.status, 'completed')
    )
  );

  console.log(`📝 Found ${stripeOrders.length} completed Stripe orders.`);

  if (stripeOrders.length === 0) {
    console.log('No Stripe orders found.');
    return;
  }

  // 2. Get order items for these orders that are tickets
  const orderIds = stripeOrders.map(o => o.id);
  const items = await db.select().from(orderItems).where(
    and(
      inArray(orderItems.orderId, orderIds),
      eq(orderItems.itemType, 'ticket')
    )
  );

  console.log(`🎫 Found ${items.length} ticket items in those Stripe orders.`);

  // 3. Get existing ticket purchases for these orders
  const existingTickets = await db.select().from(ticketPurchases).where(
    inArray(ticketPurchases.orderId, orderIds)
  );

  console.log(`✅ Found ${existingTickets.length} generated tickets for these orders in the database.`);

  // Calculate missing tickets
  let expectedTotalTickets = 0;
  for (const item of items) {
    expectedTotalTickets += item.quantity;
  }

  console.log(`\n📊 Summary:`);
  console.log(`Total expected tickets from Stripe orders: ${expectedTotalTickets}`);
  console.log(`Total actual tickets generated in DB: ${existingTickets.length}`);
  
  if (expectedTotalTickets > existingTickets.length) {
    console.log(`\n⚠️  WARNING: There are ${expectedTotalTickets - existingTickets.length} tickets that were purchased via Stripe but not fully generated in the system!`);
  } else {
    console.log(`\n✅ All purchased tickets seem to be generated in the system.`);
  }
}

checkStripePurchases().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
