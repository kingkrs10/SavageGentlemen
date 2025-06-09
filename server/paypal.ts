// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment: Environment.Production, // Always use production
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent, eventId, eventTitle, ticketId, ticketName } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    // Create descriptive item name
    let itemDescription = "SG Event Ticket";
    if (eventTitle) {
      itemDescription = eventTitle;
      if (ticketName) {
        itemDescription = `${eventTitle} - ${ticketName}`;
      }
    } else if (ticketName) {
      itemDescription = ticketName;
    }

    // Create the purchase unit with optional custom fields
    const purchaseUnit = {
      amount: {
        currencyCode: currency,
        value: amount,
      },
      // Add custom metadata if event information is provided
      custom_id: eventId ? `event_${eventId}${ticketId ? `_ticket_${ticketId}` : ''}` : undefined,
      description: itemDescription
    };

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [purchaseUnit],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    // Optional event and ticket data in the request body
    const { eventId, eventTitle, ticketId, ticketName } = req.body;
    
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;
    
    // If this is an event ticket purchase, create a ticket record
    if (jsonResponse.status === 'COMPLETED' && eventId) {
      try {
        // Import storage and email functions dynamically to avoid circular dependencies
        const { storage } = await import('./storage');
        const { sendTicketEmail } = await import('./email');
        
        // Extract purchase details
        const amount = parseFloat(jsonResponse.purchase_units[0]?.amount?.value || '0');
        const payerEmail = jsonResponse.payer?.email_address;
        const payerName = jsonResponse.payer?.name?.given_name + ' ' + jsonResponse.payer?.name?.surname;
        
        // Get event details
        const event = await storage.getEvent(Number(eventId));
        if (!event) {
          throw new Error(`Event ${eventId} not found`);
        }
        
        // Try to find user by email or create guest user
        let user = null;
        if (payerEmail) {
          user = await storage.getUserByEmail(payerEmail);
          
          // If no user found, create a guest user
          if (!user) {
            user = await storage.createUser({
              username: `guest_${Date.now()}`,
              password: '',
              displayName: payerName || 'Guest User',
              email: payerEmail,
              isGuest: true,
              role: 'user'
            });
          }
        }
        
        if (user) {
          // Create order record
          const order = await storage.createOrder({
            userId: user.id,
            totalAmount: Math.round(amount * 100), // Convert to cents
            status: 'completed',
            paymentMethod: 'paypal',
            paymentId: orderID
          });
          
          // Create ticket record
          const ticketData = {
            orderId: order.id,
            eventId: event.id,
            ticketId: ticketId ? Number(ticketId) : 1, // Default to 1 if no specific ticket
            status: 'valid',
            userId: user.id,
            purchaseDate: new Date(),
            qrCodeData: `EVENT-${event.id}-ORDER-${order.id}-${Date.now()}`,
            ticketType: ticketName || 'General Admission',
            price: Math.round(amount * 100).toString(), // Convert to cents and stringify
            attendeeEmail: payerEmail,
            attendeeName: payerName || user.displayName
          };
          
          const ticket = await storage.createTicketPurchase(ticketData);
          
          // Send ticket email automatically with delivery monitoring
          if (payerEmail) {
            try {
              const { ticketMonitor } = await import('./ticket-monitor');
              await ticketMonitor.ensureTicketDelivery(
                ticket.id,
                order.id,
                user.id,
                payerEmail,
                event.title,
                ticket.qrCodeData,
                event.location,
                event.date,
                ticketName || 'General Admission',
                amount
              );
              
              console.log(`Ticket email delivery initiated for ${payerEmail} for PayPal order ${orderID}`);
            } catch (emailError) {
              console.error('Failed to initiate ticket email delivery:', emailError);
            }
          }
          
          console.log(`Successfully processed PayPal payment and created ticket for event ${eventId}: ${eventTitle} - Amount: $${amount}`);
        }
      } catch (err) {
        console.error('Error handling event ticket purchase:', err);
        // We still return success to the client since the payment was successful
        // The ticket creation can be retried separately
      }
    }

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}
// <END_EXACT_CODE>