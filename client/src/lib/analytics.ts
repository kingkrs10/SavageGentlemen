import { queryClient } from "./queryClient";
import { trackGAPageView } from "./ga-analytics";

/**
 * Tracks page views in the application
 * @param path The current path being viewed
 * @param userId Optional user ID if user is logged in
 */
export async function trackPageView(path: string, userId?: number) {
  try {
    const sessionId = getOrCreateSessionId();
    
    const deviceInfo = {
      deviceType: getDeviceType(),
      browser: getBrowser(),
      referrer: document.referrer || null
    };
    
    await fetch('/api/analytics/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path,
        userId: userId || null,
        sessionId,
        ...deviceInfo
      })
    });
    
    // Track in Google Analytics as well
    trackGAPageView(path);
    
    // Update analytics cache after recording view
    queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
    
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

/**
 * Tracks product view events
 * @param productId The ID of the product being viewed
 * @param productName Optional product name for GA tracking
 */
export async function trackProductView(productId: number, productName?: string) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/products/${productId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAProductEvent }) => {
      trackGAProductEvent('view_item', productId, productName);
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track product view:', error);
  }
}

/**
 * Tracks product detail click events
 * @param productId The ID of the product being viewed in detail
 * @param productName Optional product name for GA tracking
 */
export async function trackProductDetailClick(productId: number, productName?: string) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/products/${productId}/detail-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAProductEvent }) => {
      trackGAProductEvent('select_item', productId, productName);
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track product detail click:', error);
  }
}

/**
 * Tracks product purchase click events
 * @param productId The ID of the product being purchased
 * @param productName Optional product name for GA tracking
 */
export async function trackProductPurchaseClick(productId: number, productName?: string) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/products/${productId}/purchase-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAProductEvent }) => {
      trackGAProductEvent('begin_checkout', productId, productName);
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track product purchase click:', error);
  }
}

/**
 * Tracks event view events
 * @param eventId The ID of the event being viewed
 * @param eventName Optional event name for GA tracking
 */
export async function trackEventView(eventId: number, eventName?: string) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/events/${eventId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAEventTicket }) => {
      trackGAEventTicket('view_event', eventId, eventName);
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track event view:', error);
  }
}

/**
 * Tracks event ticket click events
 * @param eventId The ID of the event
 * @param eventName Optional event name for GA tracking
 * @param ticketPrice Optional ticket price for GA tracking
 */
export async function trackEventTicketClick(eventId: number, eventName?: string, ticketPrice?: number) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/events/${eventId}/ticket-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAEventTicket }) => {
      trackGAEventTicket('select_ticket', eventId, eventName, ticketPrice);
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track event ticket click:', error);
  }
}

/**
 * Tracks ticket sale events
 * @param eventId The ID of the event
 * @param ticketId The ID of the ticket purchased
 * @param amount The amount of the purchase
 * @param currency The currency code
 * @param eventName Optional event name for GA tracking
 */
export async function trackTicketSale(
  eventId: number, 
  ticketId: number, 
  amount: number, 
  currency: string = 'USD',
  eventName?: string
) {
  try {
    // Track in our custom analytics system
    await fetch(`/api/analytics/events/${eventId}/ticket-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId,
        ticketId,
        amount,
        currency
      })
    });
    
    // Track in Google Analytics with Enhanced Ecommerce
    import('./ga-analytics').then(({ trackGATransaction, trackGAEventTicket }) => {
      // Track as both an event and a transaction
      trackGAEventTicket('purchase_ticket', eventId, eventName, amount);
      
      // Track as ecommerce transaction
      trackGATransaction(
        `ticket-${ticketId}-${Date.now()}`, // Generate unique transaction ID
        amount,
        currency,
        [{
          item_id: `ticket-${ticketId}`,
          item_name: eventName || `Event Ticket ${eventId}`,
          price: amount,
          quantity: 1
        }]
      );
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track ticket sale:', error);
  }
}

/**
 * Tracks general user events
 * @param userId The ID of the user
 * @param eventType The type of event (login, register, etc.)
 * @param eventData Additional data for the event
 */
export async function trackUserEvent(
  userId: number,
  eventType: string,
  eventData: Record<string, any> = {}
) {
  try {
    const sessionId = getOrCreateSessionId();
    
    // Track in our custom analytics system
    await fetch('/api/analytics/user-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        eventType,
        eventData,
        sessionId
      })
    });
    
    // Track in Google Analytics
    import('./ga-analytics').then(({ trackGAEvent }) => {
      trackGAEvent(
        eventType, 
        'User', 
        eventData.label || `User ID: ${userId}`,
        eventData.value
      );
    }).catch(err => {
      console.error('Failed to load GA module:', err);
    });
  } catch (error) {
    console.error('Failed to track user event:', error);
  }
}

// Helper functions
function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('sg_session_id');
  
  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('sg_session_id', sessionId);
  }
  
  return sessionId;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf("Firefox") > -1) {
    return "Firefox";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    return "Opera";
  } else if (ua.indexOf("Trident") > -1) {
    return "Internet Explorer";
  } else if (ua.indexOf("Edge") > -1) {
    return "Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    return "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    return "Safari";
  } else {
    return "Unknown";
  }
}