import { storage } from './storage';

async function seedPassportData() {
  console.log('Seeding Soca Passport achievements and redemption offers...');

  // ===== ACHIEVEMENT DEFINITIONS =====
  const achievements = [
    // BEGINNER
    { slug: 'first_fete', name: 'First Fête', description: 'Attend your first event', category: 'BEGINNER', criteria: { eventsAttended: 1 }, creditBonus: 25, sortOrder: 1 },
    { slug: 'first_checkin', name: 'First Check-In', description: 'Complete your first QR check-in', category: 'BEGINNER', criteria: { eventsAttended: 1 }, creditBonus: 10, sortOrder: 2 },
    { slug: 'complete_profile', name: 'Profile Complete', description: 'Set up your passport profile', category: 'BEGINNER', criteria: { creditsEarned: 0 }, creditBonus: 15, sortOrder: 3 },
    
    // ATTENDANCE
    { slug: 'party_starter', name: 'Party Starter', description: 'Attend 5 events', category: 'ATTENDANCE', criteria: { eventsAttended: 5 }, creditBonus: 50, sortOrder: 10 },
    { slug: 'party_animal_10', name: 'Party Animal', description: 'Attend 10 events', category: 'ATTENDANCE', criteria: { eventsAttended: 10 }, creditBonus: 100, sortOrder: 11 },
    { slug: 'road_warrior', name: 'Road Warrior', description: 'Attend 25 events', category: 'ATTENDANCE', criteria: { eventsAttended: 25 }, creditBonus: 250, sortOrder: 12 },
    { slug: 'fete_legend', name: 'Fête Legend', description: 'Attend 50 events', category: 'ATTENDANCE', criteria: { eventsAttended: 50 }, creditBonus: 500, sortOrder: 13 },
    { slug: 'carnival_god', name: 'Carnival God', description: 'Attend 100 events', category: 'ATTENDANCE', criteria: { eventsAttended: 100 }, creditBonus: 1000, sortOrder: 14 },
    
    // TRAVEL
    { slug: 'first_country', name: 'First Country', description: 'Visit your first country', category: 'TRAVEL', criteria: { countriesVisited: 1 }, creditBonus: 30, sortOrder: 20 },
    { slug: 'globe_trotter', name: 'Globe Trotter', description: 'Visit 3 countries', category: 'TRAVEL', criteria: { countriesVisited: 3 }, creditBonus: 100, sortOrder: 21 },
    { slug: 'caribbean_explorer', name: 'Caribbean Explorer', description: 'Visit 5 countries', category: 'TRAVEL', criteria: { countriesVisited: 5 }, creditBonus: 200, sortOrder: 22 },
    { slug: 'caribbean_circuit', name: 'Caribbean Circuit', description: 'Visit 6+ carnival countries', category: 'TRAVEL', criteria: { countriesVisited: 6 }, creditBonus: 500, sortOrder: 23 },
  ];

  for (const achievement of achievements) {
    try {
      await storage.createAchievementDefinition(achievement);
      console.log(`✓ Created achievement: ${achievement.name}`);
    } catch (error) {
      console.log(`  Skipping ${achievement.slug} (already exists)`);
    }
  }

  // ===== REDEMPTION OFFERS =====
  const offers = [
    // TICKET BENEFITS
    { slug: 'ticket_discount_5', name: '$5 Off Tickets', description: 'Get $5 off any ticket purchase', category: 'TICKET_BENEFITS', pointsCost: 300, sortOrder: 1 },
    { slug: 'ticket_discount_10', name: '$10 Off Tickets', description: 'Get $10 off any ticket purchase', category: 'TICKET_BENEFITS', pointsCost: 500, sortOrder: 2 },
    { slug: 'skip_the_line', name: 'Skip the Line Access', description: 'Fast track entry at passport-enabled events', category: 'TICKET_BENEFITS', pointsCost: 1000, tierRequirement: 'SILVER', sortOrder: 3 },
    
    // EVENT PERKS
    { slug: 'free_drink', name: '1 Free Drink', description: 'Redeem for one complimentary drink at participating events', category: 'EVENT_PERKS', pointsCost: 250, sortOrder: 10 },
    { slug: 'vip_line_access', name: 'VIP Line Access', description: 'Access to VIP entry line', category: 'EVENT_PERKS', pointsCost: 1200, tierRequirement: 'GOLD', sortOrder: 11 },
    { slug: 'plus_one_upgrade', name: '+1 Guest Upgrade', description: 'Bring one guest for free', category: 'EVENT_PERKS', pointsCost: 700, sortOrder: 12 },
    { slug: 'dj_booth_access', name: 'DJ Booth / Side-Stage Access', description: 'Exclusive backstage experience', category: 'EVENT_PERKS', pointsCost: 2500, tierRequirement: 'ELITE', sortOrder: 13 },
    
    // MERCH REWARDS
    { slug: 'merch_discount_10', name: '10% Off Merchandise', description: 'Get 10% off official merchandise', category: 'MERCH_REWARDS', pointsCost: 300, sortOrder: 20 },
    { slug: 'passport_sticker', name: 'Exclusive Passport Sticker', description: 'Collectible passport sticker', category: 'MERCH_REWARDS', pointsCost: 150, sortOrder: 21 },
    { slug: 'bandana_accessory', name: 'Soca Passport Bandana', description: 'Official branded bandana', category: 'MERCH_REWARDS', pointsCost: 400, sortOrder: 22 },
  ];

  for (const offer of offers) {
    try {
      await storage.createRedemptionOffer(offer);
      console.log(`✓ Created redemption offer: ${offer.name}`);
    } catch (error) {
      console.log(`  Skipping ${offer.slug} (already exists)`);
    }
  }

  console.log('\n✅ Soca Passport data seeding complete!');
}

export { seedPassportData };

// Auto-execute when run directly (ES modules)
seedPassportData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding data:', error);
    process.exit(1);
  });
