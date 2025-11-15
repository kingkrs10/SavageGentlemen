import { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';

// Reuse existing Stripe client configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  appInfo: { 
    name: 'SGX Media',
    version: '1.0.0',
    url: 'https://sgxmedia.com'
  }
});

export async function createPromoterSubscription(req: Request, res: Response) {
  try {
    const { planSlug, billingInterval } = req.body;
    
    // SECURITY: Get authenticated user from Firebase token
    const userId = res.locals.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from database
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // SECURITY: Check if user already has ANY non-cancelled subscription to prevent slot exhaustion
    const existingSubscription = await storage.getPromoterSubscriptionByUserId(user.id);
    if (existingSubscription && existingSubscription.status !== 'CANCELLED' && existingSubscription.status !== 'EXPIRED') {
      return res.status(400).json({ 
        error: 'User already has a subscription', 
        status: existingSubscription.status,
        subscription: existingSubscription
      });
    }

    // Get the plan
    const plan = await storage.getPromoterPlanBySlug(planSlug);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get billing options for the plan
    const billingOptions = await storage.getBillingOptionsByPlanId(plan.id);
    const selectedBilling = billingOptions.find(opt => opt.billingInterval === billingInterval);
    
    if (!selectedBilling) {
      return res.status(404).json({ error: 'Billing option not found for this plan' });
    }

    // FREE plan - create subscription without Stripe
    if (plan.slug === 'FREE') {
      const subscription = await storage.createPromoterSubscription({
        userId: user.id,
        planId: plan.id,
        billingOptionId: selectedBilling.id,
        status: 'ACTIVE',
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null, // Free plan has no end date
        trialEnd: null,
        isEarlyAdopter: false,
        earlyAdopterNumber: null,
        lifetimeDiscountPercent: 0,
        metadata: {},
      });

      return res.json({ 
        success: true, 
        subscription,
        message: 'Free subscription created successfully'
      });
    }

    // ENTERPRISE plan - requires custom pricing (contact sales)
    if (plan.isEnterprise) {
      return res.status(400).json({ 
        error: 'Enterprise plan requires custom setup. Please contact sales.' 
      });
    }

    // Check early adopter eligibility for STARTER plan
    let isEarlyAdopter = false;
    let earlyAdopterNumber: number | null = null;
    let trialEnd: Date | null = null;
    
    const slotsFilled = plan.earlyAdopterSlotsFilled ?? 0;
    const slotsTotal = plan.earlyAdopterSlotsTotal ?? 0;
    const trialDays = plan.earlyAdopterTrialDays ?? 0;
    const discountPercent = plan.earlyAdopterDiscountPercent ?? 0;
    
    if (plan.slug === 'STARTER' && slotsFilled < slotsTotal) {
      isEarlyAdopter = true;
      earlyAdopterNumber = slotsFilled + 1;
      
      // Set trial end date (90 days from now)
      trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = existingSubscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.username ?? undefined,
        metadata: {
          userId: user.id.toString(),
        },
      });
      stripeCustomerId = customer.id;
    }

    // Determine pricing (apply early adopter discount if eligible)
    let finalPriceCents = selectedBilling.priceCents;
    if (isEarlyAdopter && discountPercent > 0) {
      finalPriceCents = Math.round(finalPriceCents * (1 - discountPercent / 100));
    }

    // Create Stripe subscription
    const stripeSubscriptionData: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.displayName} Plan`,
              description: plan.description ?? undefined,
              metadata: {
                planId: plan.id.toString(),
                billingOptionId: selectedBilling.id.toString(),
              },
            },
            recurring: billingInterval === 'year' 
              ? { interval: 'year' }
              : { interval: 'month' }, // Fallback to monthly
            unit_amount: finalPriceCents,
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id.toString(),
        planId: plan.id.toString(),
        billingOptionId: selectedBilling.id.toString(),
        isEarlyAdopter: isEarlyAdopter.toString(),
        earlyAdopterNumber: earlyAdopterNumber?.toString() ?? '',
        lifetimeDiscountPercent: discountPercent.toString(),
      },
    };

    // Add trial period for early adopters
    if (isEarlyAdopter && trialEnd) {
      stripeSubscriptionData.trial_end = Math.floor(trialEnd.getTime() / 1000);
    }

    const stripeSubscription = await stripe.subscriptions.create(stripeSubscriptionData);

    // SECURITY: Create subscription in database with PENDING status
    // Early adopter slots will be incremented ONLY after payment confirmation in webhook
    const subscription = await storage.createPromoterSubscription({
      userId: user.id,
      planId: plan.id,
      billingOptionId: selectedBilling.id,
      status: 'TRIAL', // Will be updated to ACTIVE after first payment
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialEnd,
      isEarlyAdopter,
      earlyAdopterNumber,
      lifetimeDiscountPercent: isEarlyAdopter ? discountPercent : 0,
      metadata: {
        earlyAdopterSlotPending: isEarlyAdopter, // Track if slot increment is pending payment
      },
    });

    // NOTE: Early adopter slot increment moved to webhook after payment confirmation
    // This prevents slot exhaustion attacks where users create subscriptions without paying

    // Extract client secret for frontend
    const latestInvoice = stripeSubscription.latest_invoice;
    let clientSecret: string | null = null;
    
    if (latestInvoice && typeof latestInvoice === 'object' && 'payment_intent' in latestInvoice) {
      const paymentIntent = latestInvoice.payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
        clientSecret = paymentIntent.client_secret as string;
      }
    }

    return res.json({
      success: true,
      subscription,
      clientSecret,
      isEarlyAdopter,
      earlyAdopterNumber,
      message: isEarlyAdopter 
        ? `Congratulations! You're early adopter #${earlyAdopterNumber}. You get ${trialDays} days free trial and ${discountPercent}% lifetime discount!`
        : 'Subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating promoter subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function cancelPromoterSubscription(req: Request, res: Response) {
  try {
    // SECURITY: Get authenticated user from Firebase token
    const userId = res.locals.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from database
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's subscription
    const subscription = await storage.getPromoterSubscriptionByUserId(user.id);
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel in Stripe if not FREE plan
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update in database
    const cancelledSubscription = await storage.cancelPromoterSubscription(subscription.id);

    return res.json({
      success: true,
      subscription: cancelledSubscription,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling promoter subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getPromoterSubscriptionStatus(req: Request, res: Response) {
  try {
    // SECURITY: Get authenticated user from Firebase token
    const userId = res.locals.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from database
    const user = await storage.getUserByFirebaseId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's subscription
    const subscription = await storage.getPromoterSubscriptionByUserId(user.id);
    if (!subscription) {
      return res.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    // Get plan details
    const plan = await storage.getPromoterPlan(subscription.planId);
    const billingOption = await storage.getBillingOption(subscription.billingOptionId);

    return res.json({
      hasSubscription: true,
      subscription,
      plan,
      billingOption,
    });
  } catch (error) {
    console.error('Error getting promoter subscription status:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getAvailablePlans(req: Request, res: Response) {
  try {
    const plans = await storage.getAllPromoterPlans();
    
    // Get billing options for each plan
    const plansWithOptions = await Promise.all(
      plans.map(async (plan) => {
        const billingOptions = await storage.getBillingOptionsByPlanId(plan.id);
        return {
          ...plan,
          billingOptions,
          earlyAdopterSlotsAvailable: plan.earlyAdopterSlotsTotal - plan.earlyAdopterSlotsFilled,
        };
      })
    );

    return res.json({ plans: plansWithOptions });
  } catch (error) {
    console.error('Error getting available plans:', error);
    return res.status(500).json({ 
      error: 'Failed to get available plans',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET_SUBSCRIPTIONS not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionFromStripe(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSubscription = await storage.getPromoterSubscriptionByStripeId(subscription.id);
        if (dbSubscription) {
          await storage.cancelPromoterSubscription(dbSubscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await updateSubscriptionFromStripe(subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (subscriptionId) {
          const dbSubscription = await storage.getPromoterSubscriptionByStripeId(subscriptionId);
          if (dbSubscription) {
            await storage.updatePromoterSubscription(dbSubscription.id, {
              status: 'EXPIRED',
            });
          }
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ 
      error: 'Webhook signature verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateSubscriptionFromStripe(stripeSubscription: Stripe.Subscription) {
  const dbSubscription = await storage.getPromoterSubscriptionByStripeId(stripeSubscription.id);
  if (!dbSubscription) {
    console.error('Subscription not found in database:', stripeSubscription.id);
    return;
  }

  let status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED' = 'ACTIVE';
  if (stripeSubscription.status === 'trialing') {
    status = 'TRIAL';
  } else if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
    status = 'CANCELLED';
  } else if (stripeSubscription.status === 'past_due') {
    status = 'EXPIRED';
  }

  // SECURITY: Increment early adopter slots only after first successful payment (ACTIVE status)
  // This prevents slot exhaustion from abandoned checkouts
  const metadata = dbSubscription.metadata as any;
  const wasTrialBefore = dbSubscription.status === 'TRIAL';
  const isNowActive = status === 'ACTIVE';
  const isEarlyAdopterSlotPending = metadata?.earlyAdopterSlotPending === true;
  
  if (wasTrialBefore && isNowActive && isEarlyAdopterSlotPending && dbSubscription.isEarlyAdopter) {
    // First payment succeeded - NOW we can safely increment the early adopter counter
    await storage.incrementEarlyAdopterSlots(dbSubscription.planId);
    console.log(`Early adopter slot #${dbSubscription.earlyAdopterNumber} confirmed for plan ${dbSubscription.planId}`);
    
    // Update metadata to mark slot as confirmed
    await storage.updatePromoterSubscription(dbSubscription.id, {
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      metadata: {
        ...metadata,
        earlyAdopterSlotPending: false,
        earlyAdopterSlotConfirmed: true,
        paymentConfirmedAt: new Date().toISOString(),
      },
    });
  } else {
    await storage.updatePromoterSubscription(dbSubscription.id, {
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });
  }
}
