import { db } from '../server/db';
import { events, tickets, ticketAddons } from '../shared/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  console.log('🔒 Staging MOVE YUH RASS Tickets (STAGING MODE: NOT LIVE)...\n');

  // 1. Locate or update event
  const existingEvents = await db.select().from(events).where(ilike(events.title, '%move%yuh%'));
  let eventId = 4;

  if (existingEvents.length > 0) {
    eventId = existingEvents[0].id;
    console.log(`ℹ️ Updating Event ID ${eventId} to MOVE YUH RASS...`);
    await db.update(events).set({
      title: 'MOVE YUH RASS',
      description: 'When de bass rumble and de riddim take over, yuh have no choice but to move. Savage Gentlemen presents MOVE YUH RASS — an unapologetic explosion of authentic Caribbean energy, sound, and culture. We bringing pure carnival vibes with non-stop Soca, raw Dancehall heat, and infectious Afrobeats commanded by top-tier selectors. Grab yuh team, rep yuh island, hoist yuh flag high, and prepare for high-octane waistline pressure all night long. Premium bottle service tables available. Lock in and stay ready — official tickets dropping soon. Don\'t stick!',
      date: new Date('2026-11-27T22:00:00-05:00'),
      time: '22:00',
      endTime: '02:30',
      duration: 270,
      location: 'The Ainsworth, 310 Sinatra Dr, Hoboken, NJ 07030',
      price: 2000,
      currency: 'USD',
      imageUrl: '/images/early_bird_official_9x16.jpg',
      additionalImages: [
        '/images/sexy_waterfront_fete_square.jpg',
        '/images/sexy_waterfront_fete_story.jpg',
        '/images/vip_bottle_service_flyer_1790806993340.jpg',
        '/images/cyber_carnival_poster_9x16.jpg'
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
  }

  // 2. Clear any existing tickets to ensure clean staging
  await db.delete(tickets).where(eq(tickets.eventId, eventId));
  console.log('🧹 Cleared existing tickets for Event', eventId);

  // 3. Insert all ticket tiers in STAGING / OFF-SALE mode (NOT LIVE)
  const stagedTiers = [
    {
      eventId,
      name: 'Free Unisex Admission',
      description: 'Complimentary unisex RSVP admission before 11:30 PM. Very limited (20 tickets total). Arrive early.',
      price: 0, // $0 (Free)
      quantity: 20,
      remainingQuantity: 20,
      gender: 'unisex',
      tierLevel: 'standard',
      badgeColor: '#06B6D4',
      badgeIcon: 'sparkles',
      benefits: ['Complimentary Admission before 11:30 PM', '75 Soca Passport Credits', 'Guaranteed Entry with Early Arrival'],
      includedItems: ['Complimentary Admission Ticket'],
      maxPerPurchase: 2,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
      salesEndDate: new Date('2026-11-27T23:30:00-05:00'),
    },
    {
      eventId,
      name: 'Early Bird Female Admission',
      description: 'Limited early bird rate for ladies. General admission into Move Yuh Rass at The Ainsworth.',
      price: 2000, // $20
      quantity: 30,
      remainingQuantity: 30,
      gender: 'female',
      tierLevel: 'standard',
      badgeColor: '#EC4899',
      badgeIcon: 'sparkles',
      benefits: ['Express Entry line before 11 PM', '75 Soca Passport Credits', 'Guaranteed Entry'],
      includedItems: ['Female Admission Ticket'],
      maxPerPurchase: 4,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
      salesEndDate: new Date('2026-10-29T23:59:59-04:00'),
    },
    {
      eventId,
      name: 'Early Bird Male Admission',
      description: 'Limited early bird rate for gentlemen. General admission into Move Yuh Rass at The Ainsworth.',
      price: 2500, // $25
      quantity: 20,
      remainingQuantity: 20,
      gender: 'male',
      tierLevel: 'standard',
      badgeColor: '#3B82F6',
      badgeIcon: 'sparkles',
      benefits: ['Express Entry line before 11 PM', '75 Soca Passport Credits', 'Guaranteed Entry'],
      includedItems: ['Male Admission Ticket'],
      maxPerPurchase: 4,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
      salesEndDate: new Date('2026-10-29T23:59:59-04:00'),
    },
    {
      eventId,
      name: 'General Admission (Female)',
      description: 'Standard admission for ladies into Move Yuh Rass. Access to main room, bar, and dancefloor.',
      price: 3000, // $30
      quantity: 50,
      remainingQuantity: 50,
      gender: 'female',
      tierLevel: 'standard',
      badgeColor: '#F43F5E',
      badgeIcon: 'ticket',
      benefits: ['General Admission', '75 Soca Passport Credits'],
      includedItems: ['Female Admission Ticket'],
      maxPerPurchase: 6,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-30T00:00:00-04:00'),
      salesEndDate: new Date('2026-11-12T23:59:59-05:00'),
    },
    {
      eventId,
      name: 'General Admission (Male)',
      description: 'Standard admission for gentlemen into Move Yuh Rass. Access to main room, bar, and dancefloor.',
      price: 3500, // $35
      quantity: 40,
      remainingQuantity: 40,
      gender: 'male',
      tierLevel: 'standard',
      badgeColor: '#2563EB',
      badgeIcon: 'ticket',
      benefits: ['General Admission', '75 Soca Passport Credits'],
      includedItems: ['Male Admission Ticket'],
      maxPerPurchase: 6,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-30T00:00:00-04:00'),
      salesEndDate: new Date('2026-11-12T23:59:59-05:00'),
    },
    {
      eventId,
      name: 'Late Release (Female)',
      description: 'Final tier online admission for ladies. Lock in your spot before door prices.',
      price: 4000, // $40
      quantity: 25,
      remainingQuantity: 25,
      gender: 'female',
      tierLevel: 'standard',
      badgeColor: '#F59E0B',
      badgeIcon: 'flame',
      benefits: ['General Admission', '75 Soca Passport Credits'],
      includedItems: ['Female Admission Ticket'],
      maxPerPurchase: 6,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-11-13T00:00:00-05:00'),
      salesEndDate: new Date('2026-11-26T23:59:59-05:00'),
    },
    {
      eventId,
      name: 'Late Release (Male)',
      description: 'Final tier online admission for gentlemen. Lock in your spot before door prices.',
      price: 4500, // $45
      quantity: 25,
      remainingQuantity: 25,
      gender: 'male',
      tierLevel: 'standard',
      badgeColor: '#D97706',
      badgeIcon: 'flame',
      benefits: ['General Admission', '75 Soca Passport Credits'],
      includedItems: ['Male Admission Ticket'],
      maxPerPurchase: 6,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-11-13T00:00:00-05:00'),
      salesEndDate: new Date('2026-11-26T23:59:59-05:00'),
    },
    {
      eventId,
      name: 'Door Admission (Female)',
      description: 'Admission at the door for ladies. Subject to venue capacity limit.',
      price: 5000, // $50
      quantity: 15,
      remainingQuantity: 15,
      gender: 'female',
      tierLevel: 'standard',
      badgeColor: '#EF4444',
      badgeIcon: 'door',
      benefits: ['Entry Subject to Venue Capacity'],
      includedItems: ['Female Admission Ticket'],
      maxPerPurchase: 2,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-11-27T22:00:00-05:00'),
      salesEndDate: new Date('2026-11-28T02:00:00-05:00'),
    },
    {
      eventId,
      name: 'Door Admission (Male)',
      description: 'Admission at the door for gentlemen. Subject to venue capacity limit.',
      price: 6000, // $60
      quantity: 15,
      remainingQuantity: 15,
      gender: 'male',
      tierLevel: 'standard',
      badgeColor: '#DC2626',
      badgeIcon: 'door',
      benefits: ['Entry Subject to Venue Capacity'],
      includedItems: ['Male Admission Ticket'],
      maxPerPurchase: 2,
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
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
      gender: 'unisex',
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
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
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
      gender: 'unisex',
      tierLevel: 'ultra_vip',
      badgeColor: '#D4AF37',
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
      isActive: false, // NOT LIVE
      status: 'off_sale', // NOT LIVE
      salesStartDate: new Date('2026-10-16T00:00:00-04:00'),
      salesEndDate: new Date('2026-11-27T18:00:00-05:00'),
    },
  ];

  for (const t of stagedTiers) {
    await db.insert(tickets).values(t);
    console.log(`  🔒 Staged (NOT LIVE): ${t.name} ($${t.price / 100}) - Status: ${t.status}`);
  }

  // 4. Staged Merch Add-ons
  await db.delete(ticketAddons).where(eq(ticketAddons.eventId, eventId));
  const addons = [
    {
      eventId,
      name: 'Caribbean Flag Bandana',
      description: 'Authentic Caribbean flag satin bandana. Wear it, wave it, rep your island.',
      price: 1000,
      category: 'merchandise',
      maxQuantity: 50,
    },
    {
      eventId,
      name: 'Savage Gentlemen Holographic Sticker Pack (3-Pack)',
      description: 'Limited edition holographic SG flaming lion weatherproof sticker pack.',
      price: 500,
      category: 'merchandise',
      maxQuantity: 100,
    },
    {
      eventId,
      name: 'Savage Gentlemen Luxury Snapback',
      description: 'Black & metallic gold embroidered SG snapback hat. Premium Caribbean street luxury.',
      price: 3000,
      category: 'merchandise',
      maxQuantity: 25,
    },
  ];

  for (const a of addons) {
    await db.insert(ticketAddons).values(a);
    console.log(`  👕 Staged Add-on: ${a.name} ($${a.price / 100})`);
  }

  console.log('\n✅ SUCCESS: Tickets and Tables are fully configured in the database, but are completely OFF-SALE / NOT LIVE.');
  console.log('Visitors to https://www.savgent.com/events/4 will see "Coming Soon" with the updated artwork.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
