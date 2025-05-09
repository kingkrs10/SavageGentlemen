import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, EVENT_CATEGORIES } from "@/lib/constants";
import { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Badge as BadgeIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/home/EventCard";
import BrandLoader from "@/components/ui/BrandLoader";
import { useToast } from "@/hooks/use-toast";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";
import { Link } from "wouter";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";

const Events = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  
  const { data: events, isLoading, isError, error } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS]
  });
  
  const filteredEvents = events?.filter(
    (event) => selectedCategory === "all" || event.category === selectedCategory
  );
  
  const featuredEvent = events?.find((event) => event.featured);
  
  const handleGetTicket = (eventId: number) => {
    // Find the event to get its price
    const event = events?.find(e => e.id === eventId);
    
    if (!event) {
      toast({
        title: "Error",
        description: "Could not find event details. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Processing",
      description: "Redirecting to secure checkout..."
    });
    
    // Redirect to our checkout page with the event details
    window.location.href = `/checkout?eventId=${eventId}&amount=${event.price}&currency=USD&title=${encodeURIComponent(event.title)}`;
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  return (
    <div>
      {/* Hero Event */}
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        {isLoading ? (
          <div className="w-full h-64 bg-gray-900 flex items-center justify-center">
            <BrandLoader size="md" message="Loading featured event" />
          </div>
        ) : featuredEvent ? (
          <>
            <img 
              src={getNormalizedImageUrl(featuredEvent.imageUrl)} 
              alt={featuredEvent.title} 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <Badge variant="secondary" className="bg-primary text-white text-sm px-3 py-1 rounded-full mb-2 inline-block">
                Featured
              </Badge>
              <Link href={`/event/${featuredEvent.id}`}>
                <h2 className="text-3xl font-heading text-white hover:underline">{featuredEvent.title}</h2>
              </Link>
              <p className="text-lg text-gray-200 mb-2">{featuredEvent.description.length > 150 ? 
                `${featuredEvent.description.substring(0, 150)}...` : featuredEvent.description}</p>
              <div className="flex items-center text-sm text-gray-300 mb-4">
                <span className="flex items-center mr-4">
                  <Calendar className="w-4 h-4 mr-1" /> 
                  {new Date(featuredEvent.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> 
                  {featuredEvent.location}
                </span>
              </div>
              <div className="flex space-x-3">
                <Button 
                  className="bg-primary text-white hover:bg-red-800 transition"
                  onClick={() => handleGetTicket(featuredEvent.id)}
                >
                  Get Tickets
                </Button>
                <Link href={`/event/${featuredEvent.id}`}>
                  <Button variant="outline" className="border-white text-white hover:bg-white/20">
                    View Details
                  </Button>
                </Link>
                <AddToCalendarButton 
                  event={featuredEvent} 
                  variant="outline" 
                  size="default" 
                  className="border-white text-white hover:bg-white/20" 
                  showText={false}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-900 h-64 flex items-center justify-center">
            <p className="text-gray-400">No featured event available</p>
          </div>
        )}
      </div>

      {/* Event Filter */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Find Events</h3>
          <Button 
            variant="link" 
            className="text-sm text-primary p-0 h-auto"
            onClick={() => setSelectedCategory("all")}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={
                selectedCategory === category.id 
                  ? "bg-primary text-white" 
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }
              size="sm"
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl">
            <BrandLoader size="lg" message="Loading events..." />
          </div>
        ) : isError ? (
          <div className="text-center py-8 bg-red-900/30 rounded-xl border border-red-700">
            <BadgeIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-red-500">ERROR LOADING EVENTS</h3>
            <p className="text-gray-300 mb-2">
              We're having trouble loading events at the moment.
            </p>
            <code className="text-xs text-gray-400 bg-black/30 p-2 rounded block max-w-md mx-auto overflow-auto">
              {error instanceof Error ? error.message : 'Unknown error'}
            </code>
            <Button className="mt-4 bg-primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              variant="horizontal"
              onGetTicket={handleGetTicket}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <BadgeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
            <p className="text-gray-400">
              There are no events matching your filter. Try changing your selection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
