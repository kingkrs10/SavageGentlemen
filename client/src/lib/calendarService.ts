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
 * Extract and parse event time from event date string
 * Handles different time formats that might be stored in the database
 */
const parseEventDateTime = (event: Event): { startDate: Date; endDate: Date } => {
  let startDate: Date;
  
  // Check if the event date includes time information
  if (typeof event.date === 'string' && event.date.includes('T')) {
    // If there's time information (ISO format), use it directly
    startDate = new Date(event.date);
  } else if (typeof event.date === 'string' && event.time) {
    // If date and time are separate, combine them
    const [hours, minutes] = event.time.split(':').map(Number);
    startDate = new Date(event.date);
    startDate.setHours(hours, minutes, 0, 0);
  } else {
    // Fallback to just the date, default to 19:00 (7 PM) for event start time
    startDate = new Date(event.date);
    startDate.setHours(19, 0, 0, 0);
  }
  
  // Determine end time - for most events this will be 3 hours after start time
  // unless there's a specific duration or end time
  const endDate = new Date(startDate);
  
  if (event.duration) {
    // If duration is provided in minutes, use it
    endDate.setMinutes(endDate.getMinutes() + event.duration);
  } else if (event.endTime) {
    // If explicit end time is provided, use it
    const [hours, minutes] = event.endTime.split(':').map(Number);
    endDate.setHours(hours, minutes, 0, 0);
    
    // If end time is before start time, assume it's the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
  } else {
    // Default duration: 3 hours
    endDate.setHours(endDate.getHours() + 3);
  }
  
  return { startDate, endDate };
};

/**
 * Generate and save an ICS file for the given event
 */
export const saveEventToCalendar = (event: Event): void => {
  try {
    const { startDate, endDate } = parseEventDateTime(event);
    
    // Prepare event data for ics format
    const eventData = {
      start: toIcsDate(startDate),
      end: toIcsDate(endDate),
      title: event.title,
      description: event.description,
      location: event.location,
      url: window.location.href,
      status: 'CONFIRMED' as const,
      organizer: { name: 'Savage Gentlemen', email: 'info@savagegentlemen.com' },
      categories: ['SavageGentlemen', 'Caribbean', 'Event'],
      busyStatus: 'BUSY' as const,
      productId: 'savagegentlemen/events'
    };
    
    // Create the calendar event
    createEvents([eventData], (error, value) => {
      if (error) {
        console.error('Error creating calendar event:', error);
        throw new Error(`Failed to create calendar event: ${error.message}`);
      }
      
      // Create a blob and download it
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const filename = `savage-gentlemen-${event.title.toLowerCase().replace(/\s+/g, '-')}-${event.id}.ics`;
      saveAs(blob, filename);
    });
  } catch (error) {
    console.error('Error in saveEventToCalendar:', error);
    throw error; // Re-throw to allow proper error handling in the UI
  }
};

/**
 * Generate Google Calendar URL for the event
 */
export const getGoogleCalendarUrl = (event: Event): string => {
  try {
    const { startDate, endDate } = parseEventDateTime(event);
    
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
  } catch (error) {
    console.error('Error generating Google Calendar URL:', error);
    // Return a backup URL if there's an error
    return 'https://calendar.google.com/calendar/';
  }
};

/**
 * Generate Outlook.com calendar URL for the event
 */
export const getOutlookCalendarUrl = (event: Event): string => {
  try {
    const { startDate, endDate } = parseEventDateTime(event);
    
    const params = new URLSearchParams({
      subject: event.title,
      body: event.description,
      location: event.location,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      path: '/calendar/action/compose',
      rru: 'addevent'
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  } catch (error) {
    console.error('Error generating Outlook Calendar URL:', error);
    // Return a backup URL if there's an error
    return 'https://outlook.live.com/calendar/';
  }
};

/**
 * Generate Yahoo Calendar URL for the event
 */
export const getYahooCalendarUrl = (event: Event): string => {
  try {
    const { startDate, endDate } = parseEventDateTime(event);
    
    // Duration in minutes for Yahoo Calendar
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
    
    const params = new URLSearchParams({
      v: '60',
      title: event.title,
      desc: event.description,
      in_loc: event.location,
      st: Math.floor(startDate.getTime() / 1000).toString(),
      dur: durationMinutes.toString()
    });
    
    return `https://calendar.yahoo.com/?${params.toString()}`;
  } catch (error) {
    console.error('Error generating Yahoo Calendar URL:', error);
    // Return a backup URL if there's an error
    return 'https://calendar.yahoo.com/';
  }
};

/**
 * Generate Apple Calendar URL (same as ICS download)
 * Apple Calendar supports ICS files
 */
export const getAppleCalendarUrl = (event: Event): string => {
  // No direct URL scheme for Apple Calendar, use ICS download instead
  return 'apple-calendar://';
};