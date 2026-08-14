import { Router, Request, Response } from "express";
import { printifyService } from "../services/printify-service";
import Stripe from "stripe";

export const merchRouter = Router();

// Lazy Stripe initialization
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripeClient;
}

// Public: Get Merch Catalog
merchRouter.get("/catalog", async (req: Request, res: Response) => {
  try {
    const catalog = await printifyService.getCatalog();
    res.json(catalog);
  } catch (error: any) {
    console.error("Error fetching merch catalog:", error);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// Public: Create Stripe Checkout Session for Merch Cart
merchRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { items, customerEmail, shippingDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const stripe = getStripe();
    const origin = req.headers.origin || "http://localhost:5000";

    // If Stripe is configured, create live checkout session
    if (stripe) {
      const lineItems = items.map((item: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.title} (${item.size}${item.color ? ` - ${item.color}` : ""})`,
            description: item.description?.substring(0, 200) || "Savage Gentlemen Official Streetwear",
            images: item.image ? [item.image] : [],
          },
          unit_amount: item.price, // in cents
        },
        quantity: item.quantity || 1,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: customerEmail || undefined,
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "TT", "JM", "BB", "AG"],
        },
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=merch`,
        cancel_url: `${origin}/shop`,
        metadata: {
          order_type: "merch_printify",
          items_json: JSON.stringify(items.map((i: any) => ({ id: i.id, size: i.size, qty: i.quantity }))),
        },
      });

      return res.json({ url: session.url, sessionId: session.id });
    }

    // Fallback simulated checkout for sandbox testing
    console.log("[MerchRouter] Simulated checkout processed for:", items.length, "items");
    res.json({
      url: `${origin}/payment-success?simulated=true&type=merch`,
      simulated: true,
    });
  } catch (error: any) {
    console.error("Error creating merch checkout:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});
