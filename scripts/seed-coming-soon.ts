/**
 * Seed Script: Move Yuh RasŚ — COMING SOON
 * 
 * Usage:
 *   npx tsx --env-file=.env scripts/seed-coming-soon.ts
 * 
 * Sets up Move Yuh RasŚ on the site in "Coming Soon" status:
 * - Event published on www.savgent.com/events
 * - Official teaser flyer assets attached
 * - ZERO tickets created (tickets NOT for sale yet)
 * - Price set to NULL so badges & buttons display "Coming Soon"
 */

import { db } from '../server/db';
import { events, tickets } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔥 Publishing MOVE YUH RASŚ as COMING SOON on savgent.com...\n');

  const existingEvents = await db.select().from(events).where(eq(events.title, 'MOVE YUH RASŚ'));
  let eventId: number;

  if (existingEvents.length > 0) {
    eventId = existingEvents[0].id;
    console.log(`ℹ️ Found existing event (ID: ${eventId}). Updating to Coming Soon...`);
    await db.update(events).set({
      description: 'Savage Gentlemen presents MOVE YUH RASŚ at The Ainsworth in Hoboken, NJ. Bringing the highest energy Soca, Dancehall, and Afrobeats with 2 of the top selectors in the circuit. 250 capacity intimate luxury waterfront fete. Authentic Caribbean flags, premium bottle service tables, and non-stop energy. Official tickets dropping soon.',
      date: new Date('2026-11-27T22:00:00-05:00'),
      time: '22:00',
      endTime: '02:30',
      duration: 270,
      location: 'The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030',
      price: null, // null triggers "Coming Soon" throughout the UI
      currency: 'USD',
      imageUrl: '/images/move_yuh_rass_teaser_9x16.jpg',
      additionalImages: [
        '/images/move_yuh_rass_teaser_4x5_perfect.jpg',
        '/images/move_yuh_rass_teaser_1x1_perfect.jpg'
      ],
      category: 'Nightlife & Caribbean Fete',
      featured: true,
      organizerName: 'Savage Gentlemen',
      organizerEmail: 'info@savgent.com',
      isSocaPassportEnabled: true,
      stampPointsDefault: 75,
      isPremiumPassport: true,
      countryCode: 'US',
      carnivalCircuit: 'Hoboken / NYC Caribbean Circuit',
      venueLatitude: '40.7408',
      venueLongitude: '-74.0270',
      checkinRadiusMeters: 250,
      updatedAt: new Date(),
    }).where(eq(events.id, eventId));
  } else {
    console.log('✨ Creating new MOVE YUH RASŚ Coming Soon event...');
    const [newEvent] = await db.insert(events).values({
      title: 'MOVE YUH RASŚ',
      description: 'Savage Gentlemen presents MOVE YUH RASŚ at The Ainsworth in Hoboken, NJ. Bringing the highest energy Soca, Dancehall, and Afrobeats with 2 of the top selectors in the circuit. 250 capacity intimate luxury waterfront fete. Authentic Caribbean flags, premium bottle service tables, and non-stop energy. Official tickets dropping soon.',
      date: new Date('2026-11-27T22:00:00-05:00'),
      time: '22:00',
      endTime: '02:30',
      duration: 270,
      location: 'The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030',
      price: null, // null triggers "Coming Soon"
      currency: 'USD',
      imageUrl: '/images/move_yuh_rass_teaser_9x16.jpg',
      additionalImages: [
        '/images/move_yuh_rass_teaser_4x5_perfect.jpg',
        '/images/move_yuh_rass_teaser_1x1_perfect.jpg'
      ],
      category: 'Nightlife & Caribbean Fete',
      featured: true,
      organizerName: 'Savage Gentlemen',
      organizerEmail: 'info@savgent.com',
      isSocaPassportEnabled: true,
      stampPointsDefault: 75,
      isPremiumPassport: true,
      countryCode: 'US',
      carnivalCircuit: 'Hoboken / NYC Caribbean Circuit',
      venueLatitude: '40.7408',
      venueLongitude: '-74.0270',
      checkinRadiusMeters: 250,
    }).returning();
    eventId = newEvent.id;
    console.log(`✅ Created event ID: ${eventId}`);
  }

  // Ensure NO tickets are active or published for this event
  const deletedTickets = await db.delete(tickets).where(eq(tickets.eventId, eventId)).returning();
  if (deletedTickets.length > 0) {
    console.log(`🔒 Removed ${deletedTickets.length} pre-existing tickets to ensure NO tickets are up.`);
  } else {
    console.log('🔒 Confirmed 0 tickets exist in DB for this event.');
  }

  console.log(`\n🎉 Success! MOVE YUH RASŚ is live on site as COMING SOON:`);
  console.log(`   🔗 Event Page: https://www.savgent.com/events/${eventId}`);
  console.log(`   🎟️ Tickets: NONE active (Coming Soon banner active)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error publishing coming soon event:', err);
  process.exit(1);
});
