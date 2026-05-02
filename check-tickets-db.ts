import { db } from './server/db.js';
import { ticketPurchases } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
  const tickets = await db.select().from(ticketPurchases).where(eq(ticketPurchases.eventId, 7));
  console.log(`Total tickets for Soca Noir (Event 7): ${tickets.length}`);
  
  const freeTickets = tickets.filter(t => Number(t.price) === 0);
  console.log(`Free tickets: ${freeTickets.length}`);
  process.exit(0);
}
check();
