import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, EVENT_CATEGORIES } from "@/lib/constants";
import { Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Badge as BadgeIcon, ExternalLink, Clock, CalendarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/home/EventCard";
import BrandLoader from "@/components/ui/BrandLoader";
import { useToast } from "@/hooks/use-toast";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";
import { Link } from "wouter";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import { AdSpace } from "@/components/home/AdSpace";


const Events = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();

  const { data: upcomingEvents, isLoading: upcomingLoading, isError: upcomingError, error: upcomingErrorDetails } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS, 'upcoming'],
    queryFn: () => fetch(`${API_ROUTES.EVENTS}?status=upcoming`).then(res => res.json())
  });

  const { data: pastEvents, isLoading: pastLoading, isError: pastError, error: pastErrorDetails } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS, 'past'],
    queryFn: () => fetch(`${API_ROUTES.EVENTS}?status=past`).then(res => res.json())
  });

  // Get the appropriate events based on active tab
  const currentEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;
  const isCurrentLoading = activeTab === "upcoming" ? upcomingLoading : pastLoading;
  const isCurrentError = activeTab === "upcoming" ? upcomingError : pastError;
  const currentError = activeTab === "upcoming" ? upcomingErrorDetails : pastErrorDetails;

  const filteredEvents = Array.isArray(currentEvents) ? currentEvents.filter(
    (event) => selectedCategory === "all" || event.category === selectedCategory
  ) : [];

  // Featured event should always be from upcoming events
  const featuredEvent = Array.isArray(upcomingEvents) ? upcomingEvents.find((event) => event.featured) : undefined;

  const handleGetTicket = (eventId: number) => {
    // Find the event to get its price from current events
    const event = currentEvents?.find(e => e.id === eventId);

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
      description: "Loading ticket options..."
    });

    // Navigate to the event detail page first to show tickets
    window.location.href = `/events/${eventId}`;
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Ticker Ad */}
      <AdSpace placement="header_ticker" className="rounded-xl overflow-hidden" />

      {/* Hero Event */}
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        {upcomingLoading ? (
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
              <Link href={`/events/${featuredEvent.id}`}>
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
                <Link href={`/events/${featuredEvent.id}`}>
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
          <div className="glass-obsidian-strong border border-gold-500/30 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold-400 font-bold block mb-1">
                2026 CARNIVAL SEASON
              </span>
              <h2 className="text-2xl md:text-4xl font-heading font-extrabold uppercase text-white tracking-wide">
                OFFICIAL SCHEDULE <span className="gold-gradient-text">DROPPING SOON</span>
              </h2>
              <p className="text-xs md:text-sm text-white/70 max-w-xl mt-2 leading-relaxed">
                Tickets for our upcoming luxury fete series, sunrise boat rides, and carnival gala will be announced shortly. Soca Passport holders receive 48-hour early presale access.
              </p>
            </div>
            <Link href="/passport">
              <Button className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 text-black font-bold uppercase tracking-wider text-xs px-6 py-6 rounded-xl shadow-lg shadow-gold-500/20 flex-shrink-0">
                Unlock Soca Passport VIP
              </Button>
            </Link>
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

      {/* Event Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="upcoming"
            className="flex items-center gap-2"
            data-testid="tab-upcoming-events"
          >
            <Clock className="w-4 h-4" />
            Upcoming Events
            {Array.isArray(upcomingEvents) && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {upcomingEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="flex items-center gap-2"
            data-testid="tab-past-events"
          >
            <CalendarOff className="w-4 h-4" />
            Past Events
            {Array.isArray(pastEvents) && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pastEvents.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingLoading ? (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl">
              <BrandLoader size="lg" message="Loading upcoming events..." />
            </div>
          ) : upcomingError ? (
            <div className="text-center py-8 bg-red-900/30 rounded-xl border border-red-700">
              <BadgeIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-red-500">ERROR LOADING UPCOMING EVENTS</h3>
              <p className="text-gray-300 mb-2">
                We're having trouble loading upcoming events at the moment.
              </p>
              <code className="text-xs text-gray-400 bg-black/30 p-2 rounded block max-w-md mx-auto overflow-auto">
                {upcomingErrorDetails instanceof Error ? upcomingErrorDetails.message : 'Unknown error'}
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
                data-testid={`event-card-${event.id}`}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Events Found</h3>
              <p className="text-gray-400">
                {selectedCategory !== "all"
                  ? "There are no upcoming events matching your filter. Try changing your selection."
                  : "There are no upcoming events scheduled at this time. Check back later!"
                }
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastLoading ? (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-xl">
              <BrandLoader size="lg" message="Loading past events..." />
            </div>
          ) : pastError ? (
            <div className="text-center py-8 bg-red-900/30 rounded-xl border border-red-700">
              <BadgeIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-red-500">ERROR LOADING PAST EVENTS</h3>
              <p className="text-gray-300 mb-2">
                We're having trouble loading past events at the moment.
              </p>
              <code className="text-xs text-gray-400 bg-black/30 p-2 rounded block max-w-md mx-auto overflow-auto">
                {pastErrorDetails instanceof Error ? pastErrorDetails.message : 'Unknown error'}
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
                isPastEvent={true}
                data-testid={`event-card-past-${event.id}`}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Past Events Found</h3>
              <p className="text-gray-400">
                {selectedCategory !== "all"
                  ? "There are no past events matching your filter. Try changing your selection."
                  : "No past events to display."
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Inline Feature / Sponsored Offer */}
      <AdSpace placement="article_inline" className="mt-8" />
    </div>
  );
};

export default Events;
