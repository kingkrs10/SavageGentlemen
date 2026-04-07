import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/lib/types";
import { API_ROUTES } from "@/lib/constants";
import { LazyImage } from "@/components/ui/LazyImage";

const EventsBanner = () => {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS],
  });

  if (isLoading) {
    return (
      <div className="bg-background border-y border-white/5 py-4 overflow-hidden">
        <div className="animate-pulse flex space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-80 bg-card rounded-2xl p-4">
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
    <div className="bg-gradient-to-r from-background via-card/50 to-background py-8 overflow-hidden border-y border-white/5">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-heading tracking-widest text-white mb-1 uppercase">Upcoming Events</h2>
        <p className="text-gray-400 text-xs uppercase tracking-wider">Don't miss the vibe</p>
      </div>

      <div className="relative">
        <div className="flex space-x-6 animate-scroll hover:animation-paused px-4">
          {/* Duplicate events for seamless scrolling */}
          {[...activeEvents, ...activeEvents].map((event, index) => (
            <Link
              key={`${event.id}-${index}`}
              href={`/events/${event.id}`}
              className="flex-shrink-0 group"
            >
              <div className="w-80 bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-neon transition-all duration-300 hover:scale-105 border border-white/5">
                <div className="relative h-32">
                  <LazyImage
                    src={event.imageUrl || ''}
                    alt={event.title}
                    className="w-full h-full"
                    context="card"
                    adaptive={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-80 transition-opacity duration-300"></div>
                  {event.featured && (
                    <Badge className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-heading text-white text-xl mb-1 group-hover:text-primary transition-colors duration-300 truncate tracking-wide">
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                      <span className="text-xs uppercase tracking-wide">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
                      <span className="truncate text-xs">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="text-white font-bold text-lg">
                      {event.price && event.price > 0 ? `$${event.price}` : 'Free'}
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl h-8 text-xs uppercase font-bold tracking-wider">
                      <Ticket className="w-3 h-3 mr-1" />
                      Gets Tickets
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