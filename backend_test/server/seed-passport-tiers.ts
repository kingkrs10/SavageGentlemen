import { storage } from './storage';

/**
 * Seed default Soca Passport tiers
 * Bronze (0pts), Silver (500pts), Gold (1500pts), Elite (3000pts)
 */
export async function seedPassportTiers() {
  console.log('🎫 Seeding Soca Passport tiers...');

  const tiers = [
    {
      name: 'BRONZE' as const,
      minPoints: 0,
      perks: {
        description: 'Welcome to the Soca Passport community!',
        perks: [
          'Access to exclusive passport member events',
          'Track your carnival journey',
          'Earn points at participating events',
          'Member-only newsletter'
        ],
        discounts: [],
        earlyAccess: false
      }
    },
    {
      name: 'SILVER' as const,
      minPoints: 500,
      perks: {
        description: 'You\'re climbing the ranks!',
        perks: [
          'All Bronze benefits',
          '5% discount on event tickets',
          'Priority customer support',
          'Exclusive Silver member badge',
          'Birthday month bonus points'
        ],
        discounts: ['5% off all event tickets'],
        earlyAccess: false
      }
    },
    {
      name: 'GOLD' as const,
      minPoints: 1500,
      perks: {
        description: 'Elite status unlocked!',
        perks: [
          'All Silver benefits',
          '10% discount on event tickets',
          'Early access to ticket sales (24 hours)',
          'Exclusive Gold member merchandise',
          'VIP check-in lanes',
          'Complimentary drink vouchers at select events',
          'Double points during carnival season'
        ],
        discounts: ['10% off all event tickets', '15% off merchandise'],
        earlyAccess: true,
        earlyAccessHours: 24
      }
    },
    {
      name: 'ELITE' as const,
      minPoints: 3000,
      perks: {
        description: 'The ultimate carnival experience!',
        perks: [
          'All Gold benefits',
          '15% discount on event tickets',
          'Early access to ticket sales (48 hours)',
          'VIP lounge access at major events',
          'Exclusive Elite member gifts',
          'Priority seating and upgrades',
          'Meet & greet opportunities with artists',
          'Triple points year-round',
          'Concierge service for event planning',
          'Annual Elite member appreciation event'
        ],
        discounts: ['15% off all event tickets', '20% off merchandise', 'Free standard shipping'],
        earlyAccess: true,
        earlyAccessHours: 48,
        vipPerks: ['VIP lounge access', 'Priority seating', 'Artist meet & greets', 'Concierge service']
      }
    }
  ];

  for (const tierData of tiers) {
    try {
      // Check if tier already exists
      const existingTiers = await storage.getAllPassportTiers();
      const exists = existingTiers.some(t => t.name === tierData.name);

      if (exists) {
        console.log(`  ✓ ${tierData.name} tier already exists`);
        continue;
      }

      await storage.createPassportTier(tierData);
      console.log(`  ✓ Created ${tierData.name} tier (${tierData.minPoints} points required)`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${tierData.name} tier:`, error);
    }
  }

  console.log('✅ Passport tiers seeded successfully!');
}
