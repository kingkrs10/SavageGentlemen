/**
 * Currency utility functions for location-based pricing
 */

export type CurrencyCode = 'USD' | 'CAD';

/**
 * Determines currency based on event location
 */
export function getCurrencyFromLocation(location: string): CurrencyCode {
  const locationLower = location.toLowerCase();
  
  // Canadian indicators
  const canadianIndicators = [
    'canada', 'ontario', 'quebec', 'british columbia', 'alberta', 'manitoba',
    'saskatchewan', 'nova scotia', 'new brunswick', 'newfoundland', 'yukon',
    'northwest territories', 'nunavut', 'toronto', 'vancouver', 'montreal',
    'calgary', 'ottawa', 'edmonton', 'winnipeg', 'hamilton', 'kitchener',
    'london', 'oshawa', 'windsor', 'saskatoon', 'regina', 'halifax',
    'victoria', 'st. johns', 'thunder bay', 'sudbury', 'kingston',
    ' on ', ' qc ', ' bc ', ' ab ', ' mb ', ' sk ', ' ns ', ' nb ', 
    ' nl ', ' yt ', ' nt ', ' nu '
  ];
  
  // Check if location contains Canadian indicators
  const isCanadian = canadianIndicators.some(indicator => 
    locationLower.includes(indicator)
  );
  
  return isCanadian ? 'CAD' : 'USD';
}

/**
 * Formats price with appropriate currency symbol and locale
 */
export function formatPrice(price: number, currency: CurrencyCode): string {
  const locale = currency === 'CAD' ? 'en-CA' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Formats price from cents to currency display
 */
export function formatPriceFromCents(priceInCents: number, currency: CurrencyCode): string {
  return formatPrice(priceInCents / 100, currency);
}

/**
 * Gets currency symbol for display
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return currency === 'CAD' ? 'C$' : '$';
}

/**
 * Auto-detects and formats event price based on location
 */
export function formatEventPrice(event: {
  price?: number | null;
  currency?: string | null;
  location: string;
}): string {
  if (!event.price) return 'Free';
  
  // Use event's currency if available, otherwise determine from location
  const currency = (event.currency as CurrencyCode) || getCurrencyFromLocation(event.location);
  
  return formatPriceFromCents(event.price, currency);
}