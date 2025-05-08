import { createEvents, DateArray } from 'ics';
import { saveAs } from 'file-saver';
import type { Event } from './types';

/**
 * Convert a Date object or date string to the format required by ics library
 */
const toIcsDate = (dateInput: Date | string): DateArray => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return [
    date.getFullYear(),
    date.getMonth() + 1, // JavaScript months are 0-indexed, ics expects 1-indexed
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];
};

/**
 * Generate and save an ICS file for the given event
 */
export const saveEventToCalendar = (event: Event): void => {
  // Assume end time is 3 hours after start if not provided
  const startDate = new Date(event.date);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);
  
  // Prepare event data for ics format
  const eventData = {
    start: toIcsDate(startDate),
    end: toIcsDate(endDate),
    title: event.title,
    description: event.description,
    location: event.location,
    url: window.location.href,
    status: 'CONFIRMED' as const,
    organizer: { name: 'Savage Gentlemen', email: 'info@savagegentlemen.com' }
  };
  
  // Create the calendar event
  createEvents([eventData], (error, value) => {
    if (error) {
      console.error('Error creating calendar event:', error);
      return;
    }
    
    // Create a blob and download it
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `savage-gentlemen-event-${event.id}.ics`);
  });
};

/**
 * Generate Google Calendar URL for the event
 */
export const getGoogleCalendarUrl = (event: Event): string => {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook.com calendar URL for the event
 */
export const getOutlookCalendarUrl = (event: Event): string => {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString()
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar URL for the event
 */
export const getYahooCalendarUrl = (event: Event): string => {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 3);
  
  // Yahoo uses different date format
  const formatYahooDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    desc: event.description,
    in_loc: event.location,
    st: formatYahooDate(startDate),
    et: formatYahooDate(endDate)
  });
  
  return `https://calendar.yahoo.com/?${params.toString()}`;
};