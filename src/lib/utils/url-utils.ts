/**
 * Creates a URL-friendly slug from a string by:
 * - Converting to lowercase
 * - Replacing spaces with hyphens
 * - Removing special characters
 * - Ensuring the slug contains only a-z, 0-9, and hyphens
 */
export const createSlug = (text: string | null | undefined): string => {
  // Handle null/undefined text
  if (!text) return 'event';
  
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '');         // Trim hyphens from end
};

/**
 * Generates a complete event URL with ID and slug
 */
export const getEventUrl = (eventId: number, eventTitle: string | null | undefined): string => {
  const slug = createSlug(eventTitle);
  return `/events/${eventId}/${slug}`;
};

/**
 * Parses an event ID from either format of URL
 * - /events/123
 * - /events/123/event-name-slug
 */
export const parseEventId = (idParam: string): number | null => {
  // Check if the ID is a valid number
  const id = parseInt(idParam, 10);
  return isNaN(id) ? null : id;
};