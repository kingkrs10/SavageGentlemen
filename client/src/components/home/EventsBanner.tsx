import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/lib/types";
import { API_ROUTES } from "@/lib/constants";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";

const EventsBanner = () => {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS],
  });

  if (isLoading) {
    return (
      <div className="bg-gray-900 py-4 overflow-hidden">
        <div className="animate-pulse flex space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80 bg-gray-800 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  // Filter for active/upcoming events
  const activeEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate >= now;
  });

  if (activeEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-6 overflow-hidden border-y border-gray-700">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-white mb-1">🎉 Upcoming Events</h2>
        <p className="text-gray-400 text-sm">Don't miss out on these amazing experiences</p>
      </div>
      
      <div className="relative">
        <div className="flex space-x-6 animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
          {/* Duplicate events for seamless scrolling */}
          {[...activeEvents, ...activeEvents].map((event, index) => (
            <Link 
              key={`${event.id}-${index}`} 
              href={`/events/${event.id}`}
              className="flex-shrink-0 group"
            >
              <div className="w-80 bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-700">
                <div className="relative h-32">
                  <img
                    src={getNormalizedImageUrl(event.imageUrl)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300"></div>
                  {event.featured && (
                    <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-primary transition-colors duration-300 truncate">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      <span>
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-primary font-bold">
                      {event.price && event.price > 0 ? `$${event.price}` : 'Free'}
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-red-700">
                      <Ticket className="w-4 h-4 mr-1" />
                      Get Tickets
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsBanner;