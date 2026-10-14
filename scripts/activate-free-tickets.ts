/**
 * Activate Free Member Tickets: MOVE YUH RASS
 * 
 * Sets tickets_live_enabled = 'true' in siteSettings,
 * sets the Free Unisex Admission tier (20 qty, $0) to isActive: true, status: 'on_sale',
 * and ensures all paid admission tiers (Early Bird, GA, Late Release, Door) remain queued off-sale.
 * 
 * Usage:
 *   npx tsx scripts/activate-free-tickets.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { siteSettings, tickets, events } from '../shared/schema';
import { eq, ilike } from 'drizzle-orm';

async function activateFreeTickets() {
  console.log('===============================================================');
  console.log('🎟️ ACTIVATING FREE MEMBER TICKETS: MOVE YUH RASS');
  console.log('===============================================================\n');

  try {
    // 1. Enable tickets live gate in siteSettings
    const existingGate = await db.select().from(siteSettings).where(eq(siteSettings.key, 'tickets_live_enabled')).limit(1);
    if (existingGate.length > 0) {
      await db.update(siteSettings).set({ value: 'true' }).where(eq(siteSettings.key, 'tickets_live_enabled'));
      console.log('✅ Site setting "tickets_live_enabled" set to "true".');
    } else {
      await db.insert(siteSettings).values({
        key: 'tickets_live_enabled',
        value: 'true',
        description: 'Controls whether ticket sales are live or locked in staging mode',
      });
      console.log('✅ Created site setting "tickets_live_enabled" = "true".');
    }

    // 2. Find MOVE YUH RASS event
    const foundEvents = await db.select().from(events).where(ilike(events.title, '%move%yuh%rass%'));
    let event = foundEvents[0];
    if (!event) {
      const fallback = await db.select().from(events).where(eq(events.id, 4));
      event = fallback[0];
    }

    if (!event) {
      console.error('❌ Could not locate MOVE YUH RASS event in database.');
      process.exit(1);
    }

    console.log(`📍 Found Event [ID: ${event.id}]: "${event.title}"`);

    // 3. Fetch all tickets for this event
    const eventTickets = await db.select().from(tickets).where(eq(tickets.eventId, event.id));
    console.log(`📋 Found ${eventTickets.length} ticket tiers in database.\n`);

    const isTable = (t: any) =>
      t.tierLevel === 'vip' ||
      t.tierLevel === 'ultra_vip' ||
      t.name.toLowerCase().includes('table') ||
      t.name.toLowerCase().includes('bottle') ||
      t.price >= 15000;

    let freeTierActivated = false;

    for (const t of eventTickets) {
      if (t.price === 0) {
        // Free tier -> ACTIVATE ON SALE (20 tickets)
        await db.update(tickets).set({
          isActive: true,
          status: 'on_sale',
          remainingQuantity: t.remainingQuantity && t.remainingQuantity > 0 ? t.remainingQuantity : 20,
          quantity: 20,
          updatedAt: new Date(),
        }).where(eq(tickets.id, t.id));
        console.log(`🔥 [LIVE NOW] ${t.name} (ID: ${t.id}) -> $0.00 | Qty: ${t.remainingQuantity ?? 20}/20 | Status: ON SALE`);
        freeTierActivated = true;
      } else if (isTable(t)) {
        // VIP Table packages -> ACTIVATE ON SALE
        await db.update(tickets).set({
          isActive: true,
          status: 'on_sale',
          updatedAt: new Date(),
        }).where(eq(tickets.id, t.id));
        console.log(`🍾 [LIVE NOW] ${t.name} (ID: ${t.id}) -> $${t.price / 100} | Status: ON SALE (VIP Table Package)`);
      } else {
        // Paid admission tiers (Early Bird, GA, Late, Door) -> REMAIN QUEUED OFF-SALE
        await db.update(tickets).set({
          isActive: false,
          status: 'off_sale',
          updatedAt: new Date(),
        }).where(eq(tickets.id, t.id));
        console.log(`⏳ [QUEUED]   ${t.name.padEnd(30)} (ID: ${t.id}) -> $${(t.price / 100).toFixed(2).padStart(6)} | Status: OFF SALE (Auto-activates upon progression)`);
      }
    }

    console.log('\n===============================================================');
    if (freeTierActivated) {
      console.log('🚀 SUCCESS: Free Tier Tickets are now LIVE on SavGent.com!');
      console.log('⚡ Dynamic Progression Engine: Once all 20 free tickets are claimed,');
      console.log('   Early Bird Female ($20) and Early Bird Male ($25) will AUTO-ACTIVATE simultaneously.');
    } else {
      console.warn('⚠️ Warning: No $0 Free Tier ticket was found for Event ID', event.id);
    }
    console.log('===============================================================\n');

  } catch (err: any) {
    console.error('❌ Error activating tickets:', err.message);
    if (err.message?.includes('exceeded the quota')) {
      console.error('\n⚠️ NEON DATABASE COMPUTE SUSPENDED:');
      console.error('The database project reached its free-tier monthly compute limit.');
      console.error('Please visit https://console.neon.tech/app/projects/curly-field-17830607 to resume/upgrade.');
    }
    process.exit(1);
  }
}

activateFreeTickets();
