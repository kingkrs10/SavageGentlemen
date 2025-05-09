import { createEvents, DateArray } from 'ics';
import { saveAs } from 'file-saver';

/**
 * Interface for calendar event parameters
 */
export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime?: Date;
  url?: string;
  organizer?: {
    name: string;
    email: string;
  };
}

/**
 * Convert a Date object to a DateArray required by ICS format
 */
function dateToArray(date: Date): DateArray {
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ICS months are 1-indexed
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];
}

/**
 * Generate an ICS file for a single event and trigger a download
 */
export function downloadEventAsICS(event: CalendarEvent): void {
  // If no end time provided, set it to 2 hours after the start time
  const endTime = event.endTime || new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000);
  
  const icsEvent = {
    start: dateToArray(event.startTime),
    end: dateToArray(endTime),
    title: event.title,
    description: event.description,
    location: event.location,
    url: event.url,
    organizer: event.organizer ? {
      name: event.organizer.name,
      email: event.organizer.email
    } : undefined,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  createEvents([icsEvent], (error, value) => {
    if (error) {
      console.error('Error generating ICS file:', error);
      return;
    }
    
    // Create a blob with the ICS data
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    
    // Use FileSaver to save the file
    saveAs(blob, `${event.title.replace(/\s+/g, '-').toLowerCase()}-calendar-event.ics`);
  });
}

/**
 * Create a Google Calendar URL for an event
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const startTime = event.startTime.toISOString().replace(/-|:|\.\d+/g, '');
  const endTime = (event.endTime || new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000))
    .toISOString().replace(/-|:|\.\d+/g, '');

  const url = new URL('https://www.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.title);
  url.searchParams.append('dates', `${startTime}/${endTime}`);
  url.searchParams.append('details', event.description);
  url.searchParams.append('location', event.location);
  
  return url.toString();
}

/**
 * Create an Outlook Calendar URL for an event
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const startTime = event.startTime.toISOString();
  const endTime = (event.endTime || new Date(event.startTime.getTime() + 2 * 60 * 60 * 1000))
    .toISOString();

  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  url.searchParams.append('subject', event.title);
  url.searchParams.append('startdt', startTime);
  url.searchParams.append('enddt', endTime);
  url.searchParams.append('body', event.description);
  url.searchParams.append('location', event.location);
  
  return url.toString();
}

/**
 * Create a Yahoo Calendar URL for an event
 */
export function getYahooCalendarUrl(event: CalendarEvent): string {
  const startTime = Math.round(event.startTime.getTime() / 1000);
  const duration = Math.round((event.endTime?.getTime() || event.startTime.getTime() + 2 * 60 * 60 * 1000) 
    - event.startTime.getTime()) / 60; // Duration in minutes

  const url = new URL('https://calendar.yahoo.com/');
  url.searchParams.append('v', '60');
  url.searchParams.append('title', event.title);
  url.searchParams.append('st', startTime.toString());
  url.searchParams.append('dur', duration.toString());
  url.searchParams.append('desc', event.description);
  url.searchParams.append('in_loc', event.location);
  
  return url.toString();
}