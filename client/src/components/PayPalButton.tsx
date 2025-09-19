// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  eventId?: number | null;
  eventTitle?: string;
  ticketId?: number | null;
  ticketName?: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  eventId,
  eventTitle,
  ticketId,
  ticketName,
}: PayPalButtonProps) {
  const createOrder = async () => {
    // SECURITY: Server-side pricing validation - DO NOT send client amounts
    const orderPayload = {
      // REMOVED: amount - server validates pricing from database
      currency: currency, // Currency preference only
      intent: intent,
      // Include event information for server pricing validation
      eventId: eventId || undefined,     // Required for server pricing validation
      eventTitle: eventTitle || undefined,
      ticketId: ticketId || undefined,   // Required for ticket-specific pricing
      ticketName: ticketName || undefined
    };
    const response = await fetch("/payment/paypal-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    // Include event and ticket information in the capture request if available
    const capturePayload = eventId ? { 
      eventId, 
      eventTitle,
      ticketId: ticketId || undefined,
      ticketName: ticketName || undefined
    } : {};
    
    const response = await fetch(`/payment/paypal-order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(capturePayload)
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
    
    // Build the redirect URL with any event and ticket information
    let redirectUrl = '/payment-success?provider=paypal&order_id=' + data.orderId;
    
    // Add event information if available
    if (eventId && eventTitle) {
      redirectUrl += `&eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
      
      // Add ticket information if available
      if (ticketId && ticketName) {
        redirectUrl += `&ticketId=${ticketId}&ticketName=${encodeURIComponent(ticketName)}`;
      }
    }
    
    // Redirect to success page after successful payment
    window.location.href = redirectUrl;
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          // Always use production PayPal SDK since the site is now live
          script.src = "https://www.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);
  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/payment/paypal-setup")
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error(e);
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>