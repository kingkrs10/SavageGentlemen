import React from 'react';
import { Calendar } from 'lucide-react';
import { Event } from '@/types';

type EventPageHeaderProps = {
  event: Event;
};

const EventPageHeader: React.FC<EventPageHeaderProps> = ({ event }) => {
  // For the specific Riddem Riot event, override values
  const displayDate = (event.id === 4 && event.title === "Riddem Riot") 
    ? "June 27, 2025" 
    : new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const displayTime = (event.id === 4 && event.title === "Riddem Riot") 
    ? "11:00 PM" 
    : event.time 
      ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      : "8:00 PM"; // Default time
  
  // Calculate the lowest ticket price from all available tickets
  const lowestPrice = event.tickets && event.tickets.length > 0
    ? Math.min(...event.tickets.map(ticket => ticket.price))
    : 0;
  
  const displayPrice = lowestPrice > 0 
    ? `$${(lowestPrice / 100).toFixed(2)}` 
    : "Free";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-background border-b">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold uppercase">{event.title}</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          <span>{displayDate} at {displayTime}</span>
        </div>
        <div className="px-4 py-2 rounded-full bg-yellow-500 text-black font-bold">
          {displayPrice}
        </div>
      </div>
    </div>
  );
};

export default EventPageHeader;