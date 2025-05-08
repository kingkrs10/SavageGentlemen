import { createEvent, DateArray } from 'ics';
import { saveAs } from 'file-saver';
import type { Event } from './types';

/**
 * Convert a Date object or date string to the format required by ics library
 */
const toIcsDate = (dateInput: Date | string): DateArray => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return [
    date.getFullYear(),
    date.getMonth() + 1, // months are 0-indexed in JS but 1-indexed in ics
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];
};

/**
 * Generate and save an ICS file for the given event
 */
export const saveEventToCalendar = (event: Event): void => {
  // Parse date to handle both string and Date objects
  const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;

  // Set end time to 3 hours after start time if not specified
  const endDate = new Date(eventDate.getTime());
  endDate.setHours(endDate.getHours() + 3); // default 3-hour event
  
  createEvent(
    {
      title: event.title,
      description: event.description || '',
      location: event.location,
      start: toIcsDate(eventDate),
      end: toIcsDate(endDate),
      url: window.location.href,
      categories: [event.category]
    },
    (error, value) => {
      if (error) {
        console.error(error);
        return;
      }
      
      // Create a Blob from the ICS file content
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      
      // Generate a filename based on the event title
      const filename = `${event.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
      
      // Save the file
      saveAs(blob, filename);
    }
  );
};

/**
 * Generate Google Calendar URL for the event
 */
export const getGoogleCalendarUrl = (event: Event): string => {
  const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;
  const endDate = new Date(eventDate.getTime());
  endDate.setHours(endDate.getHours() + 3); // default 3-hour event

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(eventDate)}/${formatDate(endDate)}`,
    details: event.description || '',
    location: event.location,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook.com calendar URL for the event
 */
export const getOutlookCalendarUrl = (event: Event): string => {
  const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;
  const endDate = new Date(eventDate.getTime());
  endDate.setHours(endDate.getHours() + 3); // default 3-hour event

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: eventDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.description || '',
    location: event.location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar URL for the event
 */
export const getYahooCalendarUrl = (event: Event): string => {
  const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;
  const endDate = new Date(eventDate.getTime());
  endDate.setHours(endDate.getHours() + 3); // default 3-hour event

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: eventDate.toISOString().replace(/-|:|\.\d+/g, ''),
    et: endDate.toISOString().replace(/-|:|\.\d+/g, ''),
    desc: event.description || '',
    in_loc: event.location,
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};