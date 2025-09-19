import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, eventId?: number, eventTitle?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(date: string | Date, eventId?: number, eventTitle?: string, time?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format the date part
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Format time if provided, otherwise use the dateObj time
  let formattedTime = '';
  if (time) {
    // Parse time string (assumes format like "09:00 PM" or "09:00:00")
    try {
      const timeDate = new Date(`2000-01-01T${time}`);
      formattedTime = timeDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      // Fallback to just using the time string as is
      formattedTime = time;
    }
  } else {
    // Use time from the date object
    formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return `${formattedDate} at ${formattedTime}`;
}

export function formatTimeAgo(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMillis = now.getTime() - dateObj.getTime();
  
  const diffInSeconds = Math.floor(diffInMillis / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Determines if an event is in the past
 * @param event - Event object with date and optional time/endTime
 * @returns true if the event has ended, false otherwise
 */
export function isEventPast(event: { date: string | Date; time?: string; endTime?: string; duration?: number }): boolean {
  try {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // If we have an end time, use that for comparison
    if (event.endTime) {
      const [hours, minutes] = event.endTime.split(':').map(Number);
      const eventEndDateTime = new Date(eventDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);
      return eventEndDateTime < now;
    }
    
    // If we have a duration, calculate the end time
    if (event.duration && event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventStartDateTime = new Date(eventDate);
      eventStartDateTime.setHours(hours, minutes, 0, 0);
      const eventEndDateTime = new Date(eventStartDateTime.getTime() + event.duration * 60 * 1000);
      return eventEndDateTime < now;
    }
    
    // If we have a start time but no end time/duration, assume event lasts until end of day
    if (event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      const eventStartDateTime = new Date(eventDate);
      eventStartDateTime.setHours(hours, minutes, 0, 0);
      // Add 4 hours as default event duration if no end time/duration specified
      const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
      return eventEndDateTime < now;
    }
    
    // If no time specified, compare just the date (event is past if date < today)
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return eventDateOnly < todayDateOnly;
  } catch (error) {
    console.error('Error determining if event is past:', error);
    return false; // Default to not past if there's an error
  }
}
