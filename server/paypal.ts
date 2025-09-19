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
    const { intent, eventId, eventTitle, ticketId, ticketName, currency = "usd" } = req.body;

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    // SECURITY: Validate that eventId is provided for pricing validation
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required for secure payment processing" });
    }

    // SECURITY: Get authoritative pricing from database
    const storage = (global as any).storage;
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    let authoritativeAmount: number;
    let authoritativeCurrency: string;
    let finalTicketName = ticketName;
    
    if (ticketId) {
      // Get ticket-specific pricing
      const ticket = await storage.getTicket(ticketId);
      if (!ticket || ticket.eventId !== eventId) {
        return res.status(404).json({ error: "Invalid ticket for this event" });
      }
      
      // Check ticket availability
      if (!ticket.isActive || (ticket.remainingQuantity !== null && ticket.remainingQuantity <= 0)) {
        return res.status(400).json({ error: "Ticket type is no longer available" });
      }
      
      authoritativeAmount = (ticket.price || 0) / 100; // Convert from cents to dollars
      finalTicketName = ticket.name;
    } else {
      // Use event base pricing
      authoritativeAmount = (event.price || 0) / 100; // Convert from cents to dollars
    }
    
    // Handle free tickets
    if (authoritativeAmount === 0) {
      return res.status(400).json({ 
        error: "This is a free ticket. Please use the free ticket claim process instead.",
        isFreeTicket: true
      });
    }
    
    // Determine currency from event location or database
    authoritativeCurrency = event.currency?.toLowerCase() || 
      (event.location && event.location.toLowerCase().includes('canad') ? 'cad' : 'usd');
    
    // Validate amount is positive
    if (authoritativeAmount <= 0) {
      return res.status(400).json({ error: "Invalid pricing configuration for this event" });
    }

    // Create descriptive item name using server-validated data
    let itemDescription = finalTicketName || event.title || "SG Event Ticket";
    if (event.title && finalTicketName && finalTicketName !== event.title) {
      itemDescription = `${event.title} - ${finalTicketName}`;
    }

    // SECURITY: Create purchase unit with SERVER-VALIDATED pricing
    const purchaseUnit = {
      amount: {
        currencyCode: authoritativeCurrency.toUpperCase(),
        value: authoritativeAmount.toFixed(2), // Ensure 2 decimal places
      },
      // Add custom metadata for tracking and validation
      custom_id: `event_${eventId}${ticketId ? `_ticket_${ticketId}` : ''}_validated_${Date.now()}`,
      description: itemDescription,
      // Add additional metadata for security audit
      reference_id: `sg_${eventId}_${ticketId || 'base'}_${authoritativeAmount}`
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
        // SECURITY: Validate that the captured order matches the requested event/ticket
        const purchaseUnit = jsonResponse.purchase_units[0];
        if (!purchaseUnit) {
          throw new Error('No purchase unit found in PayPal response');
        }
        
        // Parse the server-set custom_id to validate against client request
        const customId = purchaseUnit.custom_id;
        if (!customId) {
          throw new Error('Missing custom_id in PayPal order - security validation failed');
        }
        
        // Extract event and ticket IDs from the custom_id we set during order creation
        // Format: "event_{eventId}_ticket_{ticketId}_validated_{timestamp}" or "event_{eventId}_validated_{timestamp}"
        const customIdMatch = customId.match(/^event_(\d+)(?:_ticket_(\d+))?_validated_\d+$/);
        if (!customIdMatch) {
          throw new Error(`Invalid custom_id format: ${customId} - security validation failed`);
        }
        
        const authorizedEventId = parseInt(customIdMatch[1]);
        const authorizedTicketId = customIdMatch[2] ? parseInt(customIdMatch[2]) : null;
        
        // SECURITY: Verify the client-supplied event/ticket IDs match what was paid for
        if (authorizedEventId !== parseInt(eventId)) {
          console.error(`PayPal security violation: Authorized event ${authorizedEventId}, requested event ${eventId}`);
          throw new Error(`Security violation: Event ID mismatch. Order was for event ${authorizedEventId}, not ${eventId}`);
        }
        
        if (ticketId && authorizedTicketId !== parseInt(ticketId)) {
          console.error(`PayPal security violation: Authorized ticket ${authorizedTicketId}, requested ticket ${ticketId}`);
          throw new Error(`Security violation: Ticket ID mismatch. Order was for ticket ${authorizedTicketId}, not ${ticketId}`);
        }
        
        // If we reach here, the order is legitimate - proceed with ticket creation
        console.log(`PayPal order ${orderID} validated: Event ${authorizedEventId}, Ticket ${authorizedTicketId}`);
        
        // Import storage and email functions dynamically to avoid circular dependencies
        const { storage } = await import('./storage');
        const { sendTicketEmail } = await import('./email');
        
        // Extract purchase details (using server-validated amount from PayPal response)
        const amount = parseFloat(purchaseUnit.amount?.value || '0');
        const payerEmail = jsonResponse.payer?.email_address;
        const payerName = jsonResponse.payer?.name?.given_name + ' ' + jsonResponse.payer?.name?.surname;
        
        // Get event details (using validated event ID)
        const event = await storage.getEvent(authorizedEventId);
        if (!event) {
          throw new Error(`Event ${authorizedEventId} not found`);
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