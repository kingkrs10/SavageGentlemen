import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/constants";
import { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { parseEventId, getEventUrl, createSlug } from "@/lib/utils/url-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { Calendar, MapPin, Clock, ArrowLeft, CalendarClock, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getNormalizedImageUrl, normalizeAdditionalImages } from "@/lib/utils/image-utils";
import { format } from "date-fns";
import BrandLoader from "@/components/ui/BrandLoader";
import { useToast } from "@/hooks/use-toast";
import LazyImage from "@/components/ui/LazyImage";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";
import EventPageHeader from "@/components/event/EventPageHeader";
import { 
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  getYahooCalendarUrl,
  saveEventToCalendar
} from "@/lib/calendarService";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { FaGoogle, FaMicrosoft, FaYahoo, FaApple, FaCalendarAlt } from "react-icons/fa";
import { formatPriceFromCents, getCurrencyFromLocation } from "@/lib/currency";
import EventReviews from "@/components/social/EventReviews";
import { useUser } from "@/context/UserContext";

const EventDetail = () => {
  // Support both URL formats: /events/:id and /events/:id/:slug
  const [matchSimple, paramsSimple] = useRoute("/events/:id");
  const [matchWithSlug, paramsWithSlug] = useRoute("/events/:id/:slug");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useUser();
  
  // Get the event ID from either URL format
  const eventIdParam = matchWithSlug ? paramsWithSlug?.id : paramsSimple?.id;
  const eventId = eventIdParam ? parseEventId(eventIdParam) : null;
  
  // Query to fetch event details
  const { 
    data: event,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [API_ROUTES.EVENTS, eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText}`);
      }
      return response.json() as Promise<Event>;
    },
    enabled: !!eventId,
  });
  
  // If we have the event data and user arrived via the simple URL (/events/id),
  // redirect to the SEO-friendly URL with the slug
  useEffect(() => {
    if (matchSimple && event && !matchWithSlug) {
      const seoFriendlyUrl = getEventUrl(event.id, event.title);
      setLocation(seoFriendlyUrl, { replace: true });
    }
  }, [event, matchSimple, matchWithSlug, setLocation]);

  // Function to handle adding to calendar based on provider
  const handleAddToCalendar = (provider: string) => {
    if (!event) return;
    
    switch(provider) {
      case 'google':
        window.open(getGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
        toast({
          title: 'Calendar Opened',
          description: 'Event details sent to Google Calendar. Please complete the addition in the new tab.',
        });
        break;
      case 'outlook':
        window.open(getOutlookCalendarUrl(event), '_blank', 'noopener,noreferrer');
        toast({
          title: 'Calendar Opened',
          description: 'Event details sent to Outlook Calendar. Please complete the addition in the new tab.',
        });
        break;
      case 'yahoo':
        window.open(getYahooCalendarUrl(event), '_blank', 'noopener,noreferrer');
        toast({
          title: 'Calendar Opened',
          description: 'Event details sent to Yahoo Calendar. Please complete the addition in the new tab.',
        });
        break;
      case 'ics':
      case 'apple':
        try {
          saveEventToCalendar(event);
          toast({
            title: 'Success',
            description: 'Event saved to calendar file. Check your downloads.',
          });
        } catch (error) {
          console.error('Error saving to calendar:', error);
          toast({
            title: 'Error',
            description: 'Failed to save event to calendar.',
            variant: 'destructive',
          });
        }
        break;
      default:
        toast({
          title: 'Error',
          description: 'Unknown calendar provider',
          variant: 'destructive',
        });
    }
  };

  // Function to handle sharing the event
  const handleShare = async () => {
    if (!event) return;
    
    const shareText = `Check out this event: ${event.title} at ${event.location} on ${format(new Date(event.date), 'MMMM d, yyyy')}`;
    const shareUrl = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: 'Link Copied',
          description: 'Event link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatEventDate = (dateString: string | Date) => {
    // Always use the actual date from the database
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (dateString: string | Date, timeString?: string | null) => {
    if (timeString) {
      // Convert 24-hour format to 12-hour format with AM/PM
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return format(date, 'h:mm a');
      }
      return timeString;
    }
    
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  if (isLoading) {
    return (
      <div className="pt-6">
        <div className="flex items-center mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Button>
          </Link>
        </div>
        <div className="w-full h-[300px] bg-gray-800 rounded-lg mb-6 animate-pulse"></div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-40 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pt-6">
        <div className="flex items-center mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Button>
          </Link>
        </div>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Event</h2>
          <p className="mb-4">We couldn't load the event details. Please try again later.</p>
          <p className="text-sm text-gray-400">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pt-6">
        <div className="flex items-center mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events">
            <Button className="mt-4">Browse Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Event exists, render the detail page
  return (
    <>
      <SEOHead 
        title={`${event.title} | Savage Gentlemen Events`}
        description={`Join us for ${event.title} at ${event.location} on ${formatEventDate(event.date)}. ${event.description ? event.description.substring(0, 120) + '...' : 'Join us for this exciting event!'}`}
      />

      {/* Fixed Event Page Header with correct time (11:00 PM) and price ($21.48) */}
      <EventPageHeader event={event} />
      
      <div className="pt-6">
        <div className="flex items-center mb-6">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Button>
          </Link>
        </div>
        
        {/* Event Images - Main and Additional */}
        <div className="mb-6">
          {/* Main Event Image */}
          <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-4 bg-gray-800 relative">
            <LazyImage 
              src={event.imageUrl || ''} 
              alt={event.title} 
              className="w-full h-full" 
              fallbackSrc={SGFlyerLogoPng}
              placeholderColor="#1f2937"
              loadingClassName="w-full h-full bg-gray-800 animate-pulse"
              objectFit="contain"
            />
            {/* Add subtle gradient at the bottom for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              {/* Gradient overlay */}
            </div>
          </div>
          
          {/* Additional Images */}
          {event.additionalImages && normalizeAdditionalImages(event.additionalImages).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {normalizeAdditionalImages(event.additionalImages).map((imageUrl, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                  <LazyImage 
                    src={imageUrl} 
                    alt={`${event.title} - Image ${index + 1}`} 
                    className="w-full h-full" 
                    fallbackSrc={SGFlyerLogoPng}
                    placeholderColor="#1f2937"
                    loadingClassName="w-full h-full bg-gray-800 animate-pulse"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Badge className="bg-primary text-white mb-2">{event.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-heading mb-2">{event.title}</h1>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{formatEventDate(event.date)} {event.time && `at ${formatEventTime(event.date, event.time)}`}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-5 w-5 mr-2" />
                <span>{formatEventTime(event.date, event.time)}</span>
                {event.endTime && <span> - {formatEventTime(event.date, event.endTime)}</span>}
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-2">About This Event</h2>
              <p className="whitespace-pre-line">{event.description || 'No description available.'}</p>
            </div>
            
            {event.organizerName && (
              <div className="pt-2">
                <h3 className="text-lg font-semibold mb-1">Organizer</h3>
                <p>{event.organizerName}</p>
                {event.organizerEmail && <p className="text-muted-foreground">{event.organizerEmail}</p>}
              </div>
            )}
          </div>
          
          {/* Action Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                {(() => {
                  const availableTickets = event.tickets?.filter(ticket => 
                    ticket.isActive && 
                    ticket.status !== 'sold_out' && 
                    ticket.status !== 'soldout' && 
                    ticket.status !== 'off_sale' && 
                    ticket.status !== 'staff_only'
                  ) || [];
                  
                  if (availableTickets.length > 0) {
                    return (
                      <>
                        <h3 className="text-xl font-bold mb-3">Available Tickets</h3>
                        {availableTickets.map((ticket) => (
                          <div key={ticket.id} className="border rounded-md p-3 mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-medium">{ticket.name}</h4>
                              {ticket.price > 0 && (
                                <p className="font-bold text-primary">
                                  {formatPriceFromCents(ticket.price, getCurrencyFromLocation(event.location))}
                                </p>
                              )}
                              {ticket.price === 0 && (
                                <span className="px-2 py-1 bg-primary text-white rounded-full text-xs font-medium">
                                  FREE
                                </span>
                              )}
                            </div>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                            )}
                            <Button 
                              className="w-full mt-2"
                              onClick={() => {
                                // Check if user is authenticated before proceeding
                                if (!isAuthenticated) {
                                  toast({
                                    title: "Sign in required",
                                    description: "Please sign in or create an account to purchase tickets.",
                                    variant: "destructive",
                                  });
                                  
                                  // Open authentication modal with current ticket details preserved
                                  const authEvent = new CustomEvent('sg:open-auth-modal', { 
                                    detail: { 
                                      tab: 'login',
                                      redirectPath: `/checkout?eventId=${event.id}&ticketId=${ticket.id}&amount=${ticket.price / 100}&currency=${getCurrencyFromLocation(event.location)}&title=${encodeURIComponent(event.title)}`
                                    } 
                                  });
                                  window.dispatchEvent(authEvent);
                                  return;
                                }
                                
                                toast({
                                  title: "Processing",
                                  description: "Redirecting to secure checkout..."
                                });
                                
                                // Redirect to checkout page with ticket details
                                const currency = getCurrencyFromLocation(event.location);
                                window.location.href = `/checkout?eventId=${event.id}&ticketId=${ticket.id}&amount=${ticket.price / 100}&currency=${currency}&title=${encodeURIComponent(event.title)}`;
                              }}
                            >
                              {ticket.price === 0 ? 'Claim Free Ticket' : 'Purchase Ticket'}
                            </Button>
                          </div>
                        ))}
                      </>
                    );
                  } else {
                    return (
                      <div className="py-3">
                        <h3 className="text-xl font-bold mb-1">Tickets</h3>
                        <p className="text-muted-foreground">
                          {event.tickets && event.tickets.length > 0 
                            ? "All tickets for this event are currently sold out or unavailable." 
                            : "Tickets are not available for this event yet."
                          }
                        </p>
                        <Button 
                          className="w-full bg-gray-500 hover:bg-gray-600 mt-4 py-6 text-lg"
                          disabled
                        >
                          {event.tickets && event.tickets.length > 0 ? "Sold Out" : "Coming Soon"}
                        </Button>
                      </div>
                    );
                  }
                })()}
                
                {/* Add to Calendar Section */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <CalendarClock className="h-5 w-5 mr-2" />
                    Add to Calendar
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="rounded-full h-12 w-12 flex items-center justify-center"
                            onClick={() => handleAddToCalendar('google')}
                          >
                            <FaGoogle className="h-5 w-5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Google Calendar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="rounded-full h-12 w-12 flex items-center justify-center"
                            onClick={() => handleAddToCalendar('outlook')}
                          >
                            <FaMicrosoft className="h-5 w-5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Outlook Calendar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="rounded-full h-12 w-12 flex items-center justify-center"
                            onClick={() => handleAddToCalendar('yahoo')}
                          >
                            <FaYahoo className="h-5 w-5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Yahoo Calendar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="rounded-full h-12 w-12 flex items-center justify-center"
                            onClick={() => handleAddToCalendar('apple')}
                          >
                            <FaApple className="h-5 w-5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Apple Calendar (Downloads .ics)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    className="w-full mt-3"
                    onClick={() => handleAddToCalendar('ics')}
                  >
                    <FaCalendarAlt className="h-4 w-4 mr-2" />
                    <span>Download .ics Calendar File</span>
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share This Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Event Reviews Section */}
        <div className="mt-8">
          <EventReviews eventId={event.id} eventTitle={event.title} />
        </div>
      </div>
    </>
  );
};

export default EventDetail;