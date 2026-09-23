/**
 * Seed Script: Move Yuh RasŚ Event & Ticket Tiers
 * 
 * Usage:
 *   npx tsx --env-file=.env scripts/seed-move-yuh-rass.ts
 * 
 * This seeds the event into Postgres Neon:
 * - Event: MOVE YUH RASŚ @ The Ainsworth (Nov 27, 2026, 10 PM - 2:30 AM)
 * - 4 Ticket Tiers: Early Bird ($20), GA ($30), Late Release ($40), Door ($50)
 * - 2 Bottle Service Table Packages: Solo ($250, 1 btl/2 tix), Duo ($400, 2 btls/4 tix)
 * - 3 Official Merch Add-ons: Flag Bandana ($10), SG Sticker Pack ($5), SG Snapback ($30)
 */

import { db } from '../server/db';
import { events, tickets, ticketAddons } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔥 Seeding MOVE YUH RASŚ to savgent.com database...\n');

  // 1. Check if event already exists
  const existingEvents = await db.select().from(events).where(eq(events.title, 'MOVE YUH RASŚ'));
  let eventId: number;

  if (existingEvents.length > 0) {
    eventId = existingEvents[0].id;
    console.log(`ℹ️ Event already exists with ID: ${eventId}. Updating details...`);
    await db.update(events).set({
      description: 'Savage Gentlemen presents MOVE YUH RASŚ at The Ainsworth in Hoboken, NJ. Bringing the highest energy Soca, Dancehall, and Afrobeats with 2 of the top selectors in the circuit. 250 capacity intimate luxury waterfront fete. Authentic Caribbean flags, premium bottle service tables, and non-stop energy.',
      date: new Date('2026-11-27T22:00:00-05:00'),
      time: '22:00',
      endTime: '02:30',
      duration: 270,
      location: 'The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030',
      price: 2000,
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
    console.log('✨ Creating new MOVE YUH RASŚ event...');
    const [newEvent] = await db.insert(events).values({
      title: 'MOVE YUH RASŚ',
      description: 'Savage Gentlemen presents MOVE YUH RASŚ at The Ainsworth in Hoboken, NJ. Bringing the highest energy Soca, Dancehall, and Afrobeats with 2 of the top selectors in the circuit. 250 capacity intimate luxury waterfront fete. Authentic Caribbean flags, premium bottle service tables, and non-stop energy.',
      date: new Date('2026-11-27T22:00:00-05:00'),
      time: '22:00',
      endTime: '02:30',
      duration: 270,
      location: 'The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030',
      price: 2000,
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

  // 2. Clear existing tickets for this event (or add if missing)
  const existingTickets = await db.select().from(tickets).where(eq(tickets.eventId, eventId));
  if (existingTickets.length === 0) {
    console.log('\n🎟️ Inserting ticket tiers and bottle packages...');
    const ticketTiers = [
      {
        eventId,
        name: 'Early Bird Admission',
        description: 'Limited early bird rate. General admission into Move Yuh RasŚ at The Ainsworth.',
        price: 2000, // $20
        quantity: 50,
        remainingQuantity: 50,
        tierLevel: 'standard',
        badgeColor: '#10B981',
        badgeIcon: 'sparkles',
        benefits: ['Express Entry line before 11 PM', '75 Soca Passport Credits', 'Guaranteed Entry'],
        includedItems: ['Admission Ticket'],
        maxPerPurchase: 6,
        salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
        salesEndDate: new Date('2026-10-29T23:59:59-04:00'),
      },
      {
        eventId,
        name: 'General Admission',
        description: 'Standard admission into Move Yuh RasŚ. Access to main room, bar, and dancefloor.',
        price: 3000, // $30
        quantity: 80,
        remainingQuantity: 80,
        tierLevel: 'standard',
        badgeColor: '#3B82F6',
        badgeIcon: 'ticket',
        benefits: ['General Admission', '75 Soca Passport Credits'],
        includedItems: ['Admission Ticket'],
        maxPerPurchase: 8,
        salesStartDate: new Date('2026-10-30T00:00:00-04:00'),
        salesEndDate: new Date('2026-11-12T23:59:59-05:00'),
      },
      {
        eventId,
        name: 'Late Release Admission',
        description: 'Final tier online admission. Lock in your spot before door prices.',
        price: 4000, // $40
        quantity: 40,
        remainingQuantity: 40,
        tierLevel: 'standard',
        badgeColor: '#F59E0B',
        badgeIcon: 'flame',
        benefits: ['General Admission', '75 Soca Passport Credits'],
        includedItems: ['Admission Ticket'],
        maxPerPurchase: 8,
        salesStartDate: new Date('2026-11-13T00:00:00-05:00'),
        salesEndDate: new Date('2026-11-26T23:59:59-05:00'),
      },
      {
        eventId,
        name: 'Door Admission',
        description: 'Admission at the door. Subject to 250 venue capacity limit.',
        price: 5000, // $50
        quantity: 20,
        remainingQuantity: 20,
        tierLevel: 'standard',
        badgeColor: '#EF4444',
        badgeIcon: 'door',
        benefits: ['Entry Subject to Venue Capacity'],
        includedItems: ['Admission Ticket'],
        maxPerPurchase: 4,
        salesStartDate: new Date('2026-11-27T22:00:00-05:00'),
        salesEndDate: new Date('2026-11-28T02:00:00-05:00'),
      },
      {
        eventId,
        name: 'Solo Table Package (1 Bottle + 2 Tickets)',
        description: 'Includes reserved lounge table, 1 premium bottle of your choice, and 2 admission tickets.',
        price: 25000, // $250
        quantity: 6,
        remainingQuantity: 6,
        tierLevel: 'vip',
        badgeColor: '#8B5CF6',
        badgeIcon: 'glass',
        benefits: [
          'Reserved Lounge Table',
          '1 Premium Bottle (Hennessy, Ciroc, Casamigos, or D\'Ussé)',
          '2 VIP Admission Tickets Included',
          'VIP Skip-the-Line Entry',
          'Dedicated Cocktail Server',
          '150 Soca Passport Credits'
        ],
        includedItems: ['1 Premium Bottle', 'Reserved Table', '2 VIP Tickets'],
        maxPerPurchase: 2,
        salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
        salesEndDate: new Date('2026-11-27T18:00:00-05:00'),
      },
      {
        eventId,
        name: 'Duo Table Package (2 Bottles + 4 Tickets)',
        description: 'Ultimate VIP experience. Includes prime reserved table, 2 premium bottles, and 4 admission tickets.',
        price: 40000, // $400
        quantity: 6,
        remainingQuantity: 6,
        tierLevel: 'ultra_vip',
        badgeColor: '#D4AF37', // Gold
        badgeIcon: 'crown',
        benefits: [
          'Prime Placement Reserved Table',
          '2 Premium Bottles of your choice',
          '4 VIP Admission Tickets Included',
          'VIP Priority Skip-the-Line Entry',
          'Dedicated Cocktail Server & Mixers',
          'Sparkler Bottle Presentation',
          '250 Soca Passport Credits'
        ],
        includedItems: ['2 Premium Bottles', 'Reserved VIP Table', '4 VIP Tickets', 'Mixers'],
        maxPerPurchase: 2,
        salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
        salesEndDate: new Date('2026-11-27T18:00:00-05:00'),
      },
    ];

    for (const t of ticketTiers) {
      await db.insert(tickets).values(t);
      console.log(`  ✓ Inserted ticket tier: ${t.name} ($${t.price / 100})`);
    }
  } else {
    console.log(`ℹ️ Event already has ${existingTickets.length} ticket tiers in DB.`);
  }

  // 3. Merch Add-ons
  const existingAddons = await db.select().from(ticketAddons).where(eq(ticketAddons.eventId, eventId));
  if (existingAddons.length === 0) {
    console.log('\n👕 Inserting official merchandise add-ons...');
    const addons = [
      {
        eventId,
        name: 'Caribbean Flag Bandana',
        description: 'Authentic Caribbean flag satin bandana. Wear it, wave it, rep your island.',
        price: 1000, // $10
        category: 'merchandise',
        maxQuantity: 50,
      },
      {
        eventId,
        name: 'Savage Gentlemen Holographic Sticker Pack (3-Pack)',
        description: 'Limited edition holographic SG flaming lion weatherproof sticker pack.',
        price: 500, // $5
        category: 'merchandise',
        maxQuantity: 100,
      },
      {
        eventId,
        name: 'Savage Gentlemen Luxury Snapback',
        description: 'Black & metallic gold embroidered SG snapback hat. Premium Caribbean street luxury.',
        price: 3000, // $30
        category: 'merchandise',
        maxQuantity: 25,
      },
    ];

    for (const a of addons) {
      await db.insert(ticketAddons).values(a);
      console.log(`  ✓ Inserted add-on: ${a.name} ($${a.price / 100})`);
    }
  } else {
    console.log(`ℹ️ Event already has ${existingAddons.length} add-ons in DB.`);
  }

  console.log('\n🎉 Seeding complete! Event is ready on https://www.savgent.com/events/' + eventId);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error seeding event:', err);
  process.exit(1);
});
