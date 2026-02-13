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

const LANGUAGE_SENSEI_PRO_PRICE_ID = 'price_1T09xZJR9xpdRiXih5303Ywh';

export async function createCheckoutSession(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await storage.getUser(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is already Pro
        if (user.isPro) {
            return res.status(400).json({ error: 'User is already a Pro member' });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: LANGUAGE_SENSEI_PRO_PRICE_ID,
                    quantity: 1,
                },
            ],
            customer_email: user.email || undefined,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
                type: 'language_sensei_pro_upgrade'
            },
            success_url: `${req.headers.origin}/apps/language-sensei?upgrade=success`,
            cancel_url: `${req.headers.origin}/apps/language-sensei`,
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is for Language Sensei Pro
        if (session.metadata?.type === 'language_sensei_pro_upgrade' && session.metadata?.userId) {
            const userId = parseInt(session.metadata.userId);
            console.log(`Upgrading user ${userId} to Pro status via webhook`);

            try {
                await storage.setUserPro(userId);
                console.log(`Successfully upgraded user ${userId} to Pro`);
            } catch (error) {
                console.error(`Error upgrading user ${userId} to Pro:`, error);
                return res.status(500).send('Error upgrading user');
            }
        }
    }

    res.json({ received: true });
}

export async function getProStatus(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            // Return false for non-authenticated users instead of 401, 
            // simplifies client logic for public pages
            return res.json({ isPro: false });
        }

        const isPro = await storage.getUserProStatus(userId);
        res.json({ isPro });
    } catch (error) {
        console.error('Error getting pro status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
