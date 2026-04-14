import { useEffect, useState, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES } from "@/lib/constants";
import { Event } from "@/types";
import { getAuthHeaders } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { parseEventId, getEventUrl, createSlug } from "@/lib/utils/url-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { Calendar, MapPin, Clock, ArrowLeft, CalendarClock, Share2, Lock, Unlock } from "lucide-react";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

  // Secret code gating for comp/hidden tickets
  const [unlockedTicketIds, setUnlockedTicketIds] = useState<Set<number>>(new Set());
  const [secretCodeInputs, setSecretCodeInputs] = useState<Record<number, string>>({});
  const [secretCodeErrors, setSecretCodeErrors] = useState<Record<number, string>>({});
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [globalCodeInput, setGlobalCodeInput] = useState('');
  const [globalCodeError, setGlobalCodeError] = useState('');
  const [ticketCodes, setTicketCodes] = useState<Record<number, string>>({}); // store the code used for each unlocked ticket
  const [claimingTicketId, setClaimingTicketId] = useState<number | null>(null); // track which free ticket is being claimed

  // Verify a secret code against the server
  const verifySecretCode = useCallback(async (code: string): Promise<{ticketId: number; ticketName: string} | null> => {
    if (!eventId || !code.trim()) return null;
    try {
      const res = await fetch(`/api/events/${eventId}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        return { ticketId: data.ticketId, ticketName: data.ticketName };
      }
      return null;
    } catch {
      return null;
    }
  }, [eventId]);

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

    switch (provider) {
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

        {/* Event Media Section */}
        <div className="mb-8 space-y-6">
          {/* Main Media (Video or Image) */}
          <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black/40">
            {event.videoUrl ? (
              <div className="relative w-full aspect-video bg-black">
                <video
                  src={getNormalizedImageUrl(event.videoUrl)}
                  controls
                  className="w-full h-full object-contain"
                  poster={event.imageUrl ? getNormalizedImageUrl(event.imageUrl) : undefined}
                />
              </div>
            ) : (
              <div className="relative w-full h-[300px] md:h-[500px]">
                <LazyImage
                  src={event.imageUrl || ''}
                  alt={event.title}
                  className="w-full h-full"
                  fallbackSrc={SGFlyerLogoPng}
                  placeholderColor="#1f2937"
                  loadingClassName="w-full h-full bg-gray-800 animate-pulse"
                  objectFit="contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            )}
          </div>

          {/* Media Gallery Carousel */}
          {((event.galleryMedia && (event.galleryMedia as any[]).length > 0) ||
            (event.additionalImages && normalizeAdditionalImages(event.additionalImages).length > 0)) && (
              <div className="w-full py-4">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="bg-primary/20 p-2 rounded-full text-primary"><Share2 className="h-4 w-4" /></span>
                  Event Gallery
                </h3>
                <Carousel className="w-full max-w-5xl mx-auto">
                  <CarouselContent>
                    {/* Combine existing galleryMedia with legacy additionalImages if needed, or just prioritize galleryMedia */}
                    {(event.galleryMedia && (event.galleryMedia as any[]).length > 0
                      ? (event.galleryMedia as any[])
                      : normalizeAdditionalImages(event.additionalImages || []).map(url => ({ type: 'image', url }))
                    ).map((item, index) => (
                      <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                            <CardContent className="flex aspect-square items-center justify-center p-0 overflow-hidden rounded-lg bg-black relative group">
                              {item.type === 'video' ? (
                                <video
                                  src={getNormalizedImageUrl(item.url)}
                                  controls
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <LazyImage
                                  src={item.url}
                                  alt={`${event.title} gallery ${index + 1}`}
                                  className="w-full h-full"
                                  fallbackSrc={SGFlyerLogoPng}
                                  placeholderColor="#1f2937"
                                  objectFit="cover"
                                />
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-black/50 hover:bg-black/70 border-none text-white" />
                  <CarouselNext className="right-2 bg-black/50 hover:bg-black/70 border-none text-white" />
                </Carousel>
              </div>
            )}
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Event Ended Banner */}
            {(() => {
              // Check if event is in the past - consistent with the logic in action sidebar
              const eventDate = new Date(event.date);
              let isEventPast = false;

              try {
                if (event.endTime) {
                  const [hours, minutes] = event.endTime.split(':').map(Number);
                  const eventEndDateTime = new Date(eventDate);
                  eventEndDateTime.setHours(hours, minutes, 0, 0);
                  isEventPast = new Date() > eventEndDateTime;
                } else if (event.time) {
                  const [hours, minutes] = event.time.split(':').map(Number);
                  const eventStartDateTime = new Date(eventDate);
                  eventStartDateTime.setHours(hours, minutes, 0, 0);
                  // Add default 4 hour duration if no end time
                  const eventEndDateTime = new Date(eventStartDateTime.getTime() + 4 * 60 * 60 * 1000);
                  isEventPast = new Date() > eventEndDateTime;
                } else {
                  // No time specified, compare just the date
                  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                  const todayDateOnly = new Date();
                  todayDateOnly.setHours(0, 0, 0, 0);
                  isEventPast = eventDateOnly < todayDateOnly;
                }
              } catch (error) {
                console.error('Error determining if event is past:', error);
                isEventPast = false;
              }

              if (isEventPast) {
                return (
                  <div className="bg-gray-800/90 border-2 border-gray-600 rounded-lg p-4 mb-4 backdrop-blur-sm" data-testid="banner-event-ended">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 px-3 py-1 text-sm">
                          📅 Event Ended
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-300 mb-1">This Event Has Ended</h3>
                        <p className="text-sm text-gray-400">
                          This event took place on {formatEventDate(event.date)}{event.time && ` at ${formatEventTime(event.date, event.time)}`}.
                          Tickets are no longer available for purchase.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

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
                  // Check if event is in the past
                  const eventDate = new Date(event.date);
                  const eventEndTime = event.endTime ?
                    new Date(`${event.date.split('T')[0]}T${event.endTime}:00`) :
                    new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours after event start
                  const now = new Date();
                  const isEventPast = now > eventEndTime;

                  const availableTickets = event.tickets?.filter(ticket =>
                    ticket.isActive &&
                    ticket.status !== 'sold_out' &&
                    ticket.status !== 'soldout' &&
                    ticket.status !== 'off_sale' &&
                    ticket.status !== 'staff_only' &&
                    ticket.status !== 'hidden'
                  ) || [];

                  if (availableTickets.length > 0) {
                    return (
                      <>
                         <h3 className="text-xl font-bold mb-3">Available Tickets</h3>

                        {/* Global secret code entry for hidden comp tickets */}
                        {(() => {
                          const hasHiddenTickets = availableTickets.some(
                            (t: any) => t.requiresCode && !unlockedTicketIds.has(t.id)
                          );
                          if (!hasHiddenTickets) return null;

                          return (
                            <div className="mb-4 p-4 border border-dashed border-primary/40 rounded-lg bg-primary/5">
                              <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Have a comp code?</span>
                              </div>
                              {!showCodeInput ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() => setShowCodeInput(true)}
                                >
                                  Enter Access Code
                                </Button>
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Enter your access code"
                                    value={globalCodeInput}
                                    onChange={(e) => {
                                      setGlobalCodeInput(e.target.value.toUpperCase());
                                      setGlobalCodeError('');
                                    }}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        const result = await verifySecretCode(globalCodeInput);
                                        if (result) {
                                          setUnlockedTicketIds(prev => new Set([...prev, result.ticketId]));
                                          setTicketCodes(prev => ({ ...prev, [result.ticketId]: globalCodeInput.trim() }));
                                          setGlobalCodeInput('');
                                          setGlobalCodeError('');
                                          setShowCodeInput(false);
                                          toast({
                                            title: '🔓 Code Accepted!',
                                            description: `Comp ticket "${result.ticketName}" has been unlocked.`,
                                          });
                                        } else {
                                          setGlobalCodeError('Invalid code. Please try again.');
                                        }
                                      }
                                    }}
                                    className={`bg-black/20 border-primary/30 text-white placeholder:text-gray-500 uppercase tracking-widest ${globalCodeError ? 'border-red-500' : ''}`}
                                  />
                                  {globalCodeError && (
                                    <p className="text-xs text-red-400">{globalCodeError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={async () => {
                                        const result = await verifySecretCode(globalCodeInput);
                                        if (result) {
                                          setUnlockedTicketIds(prev => new Set([...prev, result.ticketId]));
                                          setTicketCodes(prev => ({ ...prev, [result.ticketId]: globalCodeInput.trim() }));
                                          setGlobalCodeInput('');
                                          setGlobalCodeError('');
                                          setShowCodeInput(false);
                                          toast({
                                            title: '🔓 Code Accepted!',
                                            description: `Comp ticket "${result.ticketName}" has been unlocked.`,
                                          });
                                        } else {
                                          setGlobalCodeError('Invalid code. Please try again.');
                                        }
                                      }}
                                      disabled={!globalCodeInput.trim()}
                                    >
                                      <Unlock className="h-3 w-3 mr-1" /> Unlock
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setShowCodeInput(false);
                                        setGlobalCodeInput('');
                                        setGlobalCodeError('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {availableTickets
                          .filter((ticket: any) => {
                            // Hide tickets with a secret code unless the user has unlocked them
                            if (ticket.requiresCode && !unlockedTicketIds.has(ticket.id)) {
                              return false;
                            }
                            return true;
                          })
                          .map((ticket: any) => {
                          const tierColors = {
                            'standard': 'bg-gray-100 text-gray-800',
                            'premium': 'bg-yellow-100 text-yellow-800',
                            'vip': 'bg-purple-100 text-purple-800',
                            'ultra_vip': 'bg-pink-100 text-pink-800'
                          };

                          const tierIcons = {
                            'standard': '🎫',
                            'premium': '⭐',
                            'vip': '👑',
                            'ultra_vip': '💎'
                          };

                          return (
                            <div key={ticket.id} className={`border rounded-lg p-4 mb-4 ${ticket.tierLevel !== 'standard' ? 'border-2 border-dashed' : ''}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-lg">{ticket.name}</h4>
                                  {ticket.tierLevel && ticket.tierLevel !== 'standard' && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[ticket.tierLevel]}`}>
                                      {tierIcons[ticket.tierLevel]} {ticket.tierLevel.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  {ticket.price > 0 && (
                                    <p className="font-bold text-primary text-lg">
                                      {formatPriceFromCents(ticket.price, getCurrencyFromLocation(event.location))}
                                    </p>
                                  )}
                                  {ticket.price === 0 && (
                                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>

                              {ticket.description && (
                                <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                              )}

                              {/* Advanced Features Display */}
                              {(ticket.benefits?.length > 0 || ticket.includedItems?.length > 0 || ticket.earlyAccess || ticket.meetGreet || ticket.backstageAccess) && (
                                <div className="mb-3 p-3 bg-gray-50 rounded-md">
                                  <h5 className="font-medium text-sm mb-2">What's Included:</h5>
                                  <div className="grid grid-cols-1 gap-1 text-sm">
                                    {ticket.benefits?.map((benefit, index) => (
                                      <div key={index} className="flex items-center gap-1">
                                        <span className="text-green-600">✓</span>
                                        <span>{benefit}</span>
                                      </div>
                                    ))}
                                    {ticket.includedItems?.map((item, index) => (
                                      <div key={index} className="flex items-center gap-1">
                                        <span className="text-blue-600">•</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                    {ticket.earlyAccess && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-purple-600">⚡</span>
                                        <span>Early Access Entry</span>
                                      </div>
                                    )}
                                    {ticket.meetGreet && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-pink-600">🤝</span>
                                        <span>Meet & Greet Access</span>
                                      </div>
                                    )}
                                    {ticket.backstageAccess && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-orange-600">🎭</span>
                                        <span>Backstage Access</span>
                                      </div>
                                    )}
                                    {ticket.prioritySupport && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-600">🚨</span>
                                        <span>Priority Support</span>
                                      </div>
                                    )}
                                    {ticket.exclusiveContent && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-indigo-600">📱</span>
                                        <span>Exclusive Content Access</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Transfer and Refund Policy */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                <span className={`flex items-center gap-1 ${ticket.transferable ? 'text-green-600' : 'text-red-600'}`}>
                                  {ticket.transferable ? '✓' : '✗'} {ticket.transferable ? 'Transferable' : 'Non-transferable'}
                                </span>
                                <span className={`flex items-center gap-1 ${ticket.refundable ? 'text-green-600' : 'text-red-600'}`}>
                                  {ticket.refundable ? '✓' : '✗'} {ticket.refundable ? 'Refundable' : 'Non-refundable'}
                                </span>
                                {ticket.seatingPriority && ticket.seatingPriority !== 'general' && (
                                  <span className="text-blue-600">🪑 {ticket.seatingPriority} seating</span>
                                )}
                              </div>

                              <Button
                                className="w-full mt-2"
                                disabled={isEventPast || claimingTicketId === ticket.id}
                                onClick={async () => {
                                  // Check if event is past
                                  if (isEventPast) {
                                    toast({
                                      title: "Event has ended",
                                      description: "Tickets are no longer available for this event.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

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

                                  // FREE TICKETS: Claim directly from event page (no redirect)
                                  if (ticket.price === 0) {
                                    setClaimingTicketId(ticket.id);
                                    try {
                                      // Build auth headers - try EVERY possible source for user data
                                      const headers: Record<string, string> = {
                                        'Content-Type': 'application/json',
                                      };
                                      
                                      // Try to get user ID from multiple sources
                                      let resolvedUserId: string | null = null;
                                      let resolvedToken: string | null = null;
                                      let resolvedUsername: string | null = null;
                                      let resolvedRole: string | null = null;
                                      
                                      // Source 1: React user context
                                      if (user?.id) {
                                        resolvedUserId = user.id.toString();
                                        resolvedUsername = user.username || null;
                                        resolvedRole = user.role || null;
                                      }
                                      if (user?.token) {
                                        resolvedToken = user.token;
                                      }
                                      
                                      // Source 2: getCurrentUser() from auth-utils (reads localStorage differently)
                                      if (!resolvedUserId) {
                                        try {
                                          const { getCurrentUser: getStoredUser } = await import('@/lib/auth-utils');
                                          const storedUser = getStoredUser();
                                          if (storedUser?.id) {
                                            resolvedUserId = storedUser.id.toString();
                                            resolvedUsername = storedUser.username || resolvedUsername;
                                            resolvedRole = storedUser.role || resolvedRole;
                                          }
                                          if (storedUser?.token && !resolvedToken) {
                                            resolvedToken = storedUser.token;
                                          }
                                        } catch (e) {
                                          console.warn('getCurrentUser fallback failed:', e);
                                        }
                                      }
                                      
                                      // Source 3: Direct localStorage parsing with all possible formats
                                      if (!resolvedUserId) {
                                        try {
                                          const raw = localStorage.getItem('user');
                                          if (raw) {
                                            const parsed = JSON.parse(raw);
                                            // Try: {data: {id}}, {data: {data: {id}}}, {id}, {status, data: {id}}
                                            const u = parsed?.data?.data || parsed?.data || parsed;
                                            if (u?.id) {
                                              resolvedUserId = u.id.toString();
                                              resolvedUsername = u.username || resolvedUsername;
                                              resolvedRole = u.role || resolvedRole;
                                              if (u.token) resolvedToken = u.token;
                                            }
                                          }
                                        } catch (e) {
                                          console.warn('localStorage user parse failed:', e);
                                        }
                                      }
                                      
                                      // Source 4: Standalone userId key
                                      if (!resolvedUserId) {
                                        const standaloneId = localStorage.getItem('userId');
                                        if (standaloneId) {
                                          resolvedUserId = standaloneId;
                                        }
                                      }
                                      
                                      // Source 5: Standalone token
                                      if (!resolvedToken) {
                                        resolvedToken = localStorage.getItem('authToken') || localStorage.getItem('firebaseToken') || null;
                                      }
                                      
                                      // Apply resolved values to headers
                                      if (resolvedUserId) {
                                        headers['user-id'] = resolvedUserId;
                                      }
                                      if (resolvedToken) {
                                        headers['Authorization'] = `Bearer ${resolvedToken}`;
                                      }
                                      if (resolvedUserId || resolvedUsername) {
                                        headers['x-user-data'] = JSON.stringify({
                                          id: resolvedUserId ? parseInt(resolvedUserId) : undefined,
                                          username: resolvedUsername,
                                          role: resolvedRole,
                                        });
                                      }

                                      console.log('Free ticket claim - resolved auth:', {
                                        'user-id': resolvedUserId,
                                        'has-token': !!resolvedToken,
                                        'username': resolvedUsername,
                                        'context-user-id': user?.id,
                                        'context-user-keys': user ? Object.keys(user) : 'no user',
                                      });

                                      console.log('Free ticket claim - auth headers being sent:', {
                                        'user-id': headers['user-id'],
                                        'has-auth': !!headers['Authorization'],
                                        'has-x-user-data': !!headers['x-user-data'],
                                        'user-context-id': user?.id,
                                      });

                                      const payload = {
                                        eventId: event.id,
                                        eventTitle: event.title,
                                        ticketId: ticket.id,
                                        ticketName: ticket.name,
                                        secretCode: ticketCodes[ticket.id] || undefined,
                                        // Include userId in body as additional auth fallback
                                        userId: resolvedUserId ? parseInt(resolvedUserId) : user?.id,
                                      };

                                      console.log('Free ticket claim - payload:', payload);

                                      const response = await fetch('/api/tickets/free', {
                                        method: 'POST',
                                        headers,
                                        body: JSON.stringify(payload),
                                        credentials: 'include',
                                      });

                                      const responseText = await response.text();
                                      let responseData;
                                      try {
                                        responseData = JSON.parse(responseText);
                                      } catch {
                                        throw new Error('Server returned an invalid response');
                                      }

                                      if (!response.ok) {
                                        throw new Error(responseData?.message || 'Failed to claim ticket');
                                      }

                                      if (responseData.success) {
                                        toast({
                                          title: "🎉 Free Ticket Claimed!",
                                          description: "Your ticket has been claimed successfully. Check your email for details.",
                                        });

                                        // Redirect to success page
                                        const redirectParams = new URLSearchParams();
                                        redirectParams.append('eventId', event.id.toString());
                                        redirectParams.append('eventTitle', encodeURIComponent(event.title));
                                        redirectParams.append('ticketId', ticket.id.toString());
                                        redirectParams.append('ticketName', encodeURIComponent(ticket.name));

                                        setTimeout(() => {
                                          setLocation(`/payment-success?${redirectParams.toString()}`);
                                        }, 1500);
                                      } else {
                                        throw new Error(responseData.message || 'Failed to claim ticket');
                                      }
                                    } catch (error) {
                                      console.error('Error claiming free ticket:', error);
                                      toast({
                                        title: "Error",
                                        description: error instanceof Error ? error.message : 'Could not claim ticket. Please try again.',
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setClaimingTicketId(null);
                                    }
                                    return;
                                  }

                                  // PAID TICKETS: Redirect to checkout
                                  toast({
                                    title: "Processing",
                                    description: "Redirecting to secure checkout..."
                                  });

                                  // Redirect to checkout page with ticket details
                                  const currency = getCurrencyFromLocation(event.location);
                                  const codeParam = ticket.requiresCode && ticketCodes[ticket.id] ? `&secretCode=${encodeURIComponent(ticketCodes[ticket.id])}` : '';
                                  window.location.href = `/checkout?eventId=${event.id}&ticketId=${ticket.id}&amount=${ticket.price / 100}&currency=${currency}&title=${encodeURIComponent(event.title)}${codeParam}`;
                                }}
                              >
                                {claimingTicketId === ticket.id ? (
                                  <>
                                    <span className="animate-pulse">Claiming...</span>
                                    <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                  </>
                                ) : isEventPast ? 'Event Ended' : (ticket.price === 0 ? 'Claim Free Ticket' : 'Purchase Ticket')}
                              </Button>
                            </div>
                          )
                        })}
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