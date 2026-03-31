import { db } from './db';
import { 
  promoterSubscriptionPlans, 
  promoterPlanBillingOptions,
  type InsertPromoterSubscriptionPlan,
  type InsertPromoterPlanBillingOption
} from '@shared/schema';

async function seedPromoterPlans() {
  try {
    console.log('🌱 Seeding promoter subscription plans...');

    // Check if plans already exist
    const existingPlans = await db.select().from(promoterSubscriptionPlans);
    if (existingPlans.length > 0) {
      console.log('⚠️  Plans already seeded. Skipping...');
      return;
    }

    // Define the 4 subscription tiers
    const plans: InsertPromoterSubscriptionPlan[] = [
      {
        slug: 'FREE',
        displayName: 'Free',
        description: 'Basic scanner and dashboard for small events',
        isEnterprise: false,
        hasBasicScanner: true,
        hasBasicDashboard: true,
        hasAdvancedAnalytics: false,
        hasDataExports: false,
        hasCrossEventInsights: false,
        hasWhiteLabel: false,
        hasPrioritySupport: false,
        hasCustomIntegrations: false,
        earlyAdopterSlotsTotal: 0,
        earlyAdopterSlotsFilled: 0,
        earlyAdopterTrialDays: 0,
        earlyAdopterDiscountPercent: 0,
        isActive: true,
        sortOrder: 1,
      },
      {
        slug: 'STARTER',
        displayName: 'Starter',
        description: 'Enhanced analytics and insights for growing promoters',
        isEnterprise: false,
        hasBasicScanner: true,
        hasBasicDashboard: true,
        hasAdvancedAnalytics: true,
        hasDataExports: true,
        hasCrossEventInsights: false,
        hasWhiteLabel: false,
        hasPrioritySupport: false,
        hasCustomIntegrations: false,
        earlyAdopterSlotsTotal: 5, // First 5 promoters
        earlyAdopterSlotsFilled: 0,
        earlyAdopterTrialDays: 90, // 3 months free trial
        earlyAdopterDiscountPercent: 50, // 50% lifetime discount
        isActive: true,
        sortOrder: 2,
      },
      {
        slug: 'PRO',
        displayName: 'Pro',
        description: 'Advanced analytics, trends, and cross-event insights',
        isEnterprise: false,
        hasBasicScanner: true,
        hasBasicDashboard: true,
        hasAdvancedAnalytics: true,
        hasDataExports: true,
        hasCrossEventInsights: true,
        hasWhiteLabel: false,
        hasPrioritySupport: true,
        hasCustomIntegrations: false,
        earlyAdopterSlotsTotal: 0,
        earlyAdopterSlotsFilled: 0,
        earlyAdopterTrialDays: 0,
        earlyAdopterDiscountPercent: 0,
        isActive: true,
        sortOrder: 3,
      },
      {
        slug: 'ENTERPRISE',
        displayName: 'Enterprise',
        description: 'Custom features, white-label, and dedicated support',
        isEnterprise: true,
        hasBasicScanner: true,
        hasBasicDashboard: true,
        hasAdvancedAnalytics: true,
        hasDataExports: true,
        hasCrossEventInsights: true,
        hasWhiteLabel: true,
        hasPrioritySupport: true,
        hasCustomIntegrations: true,
        earlyAdopterSlotsTotal: 0,
        earlyAdopterSlotsFilled: 0,
        earlyAdopterTrialDays: 0,
        earlyAdopterDiscountPercent: 0,
        isActive: true,
        sortOrder: 4,
      },
    ];

    // Insert plans
    const insertedPlans = await db.insert(promoterSubscriptionPlans)
      .values(plans)
      .returning();

    console.log(`✅ Created ${insertedPlans.length} subscription plans`);

    // Define billing options for each plan
    const billingOptions: InsertPromoterPlanBillingOption[] = [];

    for (const plan of insertedPlans) {
      if (plan.slug === 'FREE') {
        // Free plan - $0 per event
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'event',
          priceCents: 0,
          stripePriceId: null,
          isActive: true,
        });
      } else if (plan.slug === 'STARTER') {
        // Starter - $39 per event or $299/year
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'event',
          priceCents: 3900, // $39.00
          stripePriceId: null, // Will be set when Stripe is configured
          isActive: true,
        });
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'year',
          priceCents: 29900, // $299.00
          stripePriceId: null,
          isActive: true,
        });
      } else if (plan.slug === 'PRO') {
        // Pro - $99 per event or $899/year
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'event',
          priceCents: 9900, // $99.00
          stripePriceId: null,
          isActive: true,
        });
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'year',
          priceCents: 89900, // $899.00
          stripePriceId: null,
          isActive: true,
        });
      } else if (plan.slug === 'ENTERPRISE') {
        // Enterprise - Custom pricing (placeholder)
        billingOptions.push({
          planId: plan.id,
          billingInterval: 'year',
          priceCents: 0, // Custom pricing - contact sales
          stripePriceId: null,
          isActive: true,
        });
      }
    }

    // Insert billing options
    const insertedOptions = await db.insert(promoterPlanBillingOptions)
      .values(billingOptions)
      .returning();

    console.log(`✅ Created ${insertedOptions.length} billing options`);
    console.log('🎉 Promoter subscription plans seeded successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    for (const plan of insertedPlans) {
      const options = insertedOptions.filter(opt => opt.planId === plan.id);
      console.log(`\n${plan.displayName} (${plan.slug}):`);
      console.log(`  Features: ${Object.entries({
        'Basic Scanner': plan.hasBasicScanner,
        'Basic Dashboard': plan.hasBasicDashboard,
        'Advanced Analytics': plan.hasAdvancedAnalytics,
        'Data Exports': plan.hasDataExports,
        'Cross-Event Insights': plan.hasCrossEventInsights,
        'White Label': plan.hasWhiteLabel,
        'Priority Support': plan.hasPrioritySupport,
        'Custom Integrations': plan.hasCustomIntegrations,
      }).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}`);
      console.log(`  Pricing:`);
      for (const option of options) {
        const price = option.priceCents === 0 ? 'Free' : `$${(option.priceCents / 100).toFixed(2)}`;
        console.log(`    - ${option.billingInterval}: ${price}`);
      }
      if (plan.earlyAdopterSlotsTotal > 0) {
        console.log(`  🌟 Early Adopter: ${plan.earlyAdopterTrialDays} days free + ${plan.earlyAdopterDiscountPercent}% lifetime discount (${plan.earlyAdopterSlotsTotal} slots)`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding promoter plans:', error);
    throw error;
  }
}

// Run the seeding function
seedPromoterPlans()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
