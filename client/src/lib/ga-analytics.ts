// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Check if GA already initialized
  if (document.querySelector('script[src*="googletagmanager"]')) {
    console.log('Google Analytics appears to be already initialized');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag - Safe approach without innerHTML
  const script2 = document.createElement('script');
  script2.textContent = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    'gtag("js", new Date());',
    `gtag("config", "${measurementId.replace(/"/g, '\\"')}", {`,
    '  send_page_view: false',
    '});'
  ].join('\n');
  document.head.appendChild(script2);

  console.log('Google Analytics initialized with ID:', measurementId);
};

// Track page views - useful for single-page applications
export const trackGAPageView = (url: string) => {
  if (typeof window === 'undefined') return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  // Wait for gtag to be available
  if (!window.gtag) {
    console.log('Waiting for gtag to be available...');
    setTimeout(() => trackGAPageView(url), 1000);
    return;
  }
  
  try {
    window.gtag('config', measurementId, {
      page_path: url
    });
    console.log('GA page view tracked:', url);
  } catch (error) {
    console.warn('Failed to track GA page view:', error);
  }
};

// Track events
export const trackGAEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track product events
export const trackGAProductEvent = (
  action: string,
  productId: number,
  productName?: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: 'Product',
    event_label: productName || `Product ID: ${productId}`,
    product_id: productId
  });
};

// Track event/ticket events
export const trackGAEventTicket = (
  action: string,
  eventId: number,
  eventName?: string,
  ticketPrice?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: 'Event Ticket',
    event_label: eventName || `Event ID: ${eventId}`,
    event_id: eventId,
    value: ticketPrice
  });
};

// Track e-commerce transactions
export const trackGATransaction = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items: any[] = []
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items
  });
};