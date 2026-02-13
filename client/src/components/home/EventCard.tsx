import React from "react";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatEventPrice } from "@/lib/currency";
import { Event } from "@/lib/types";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import LazyImage from "@/components/ui/LazyImage";
import { Link } from "wouter";
import { trackEventView, trackEventTicketClick } from "@/lib/analytics";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  event: Event;
  variant?: "horizontal" | "vertical";
  onGetTicket?: (eventId: number) => void;
  isPastEvent?: boolean;
}

const EventCard = ({
  event,
  variant = "vertical",
  onGetTicket,
  isPastEvent = false
}: EventCardProps) => {
  const { id, title, description, date, time, location, price, imageUrl } = event;
  const { user, isAuthenticated } = useUser();
  const { toast } = useToast();

  // Track event view when card is rendered
  React.useEffect(() => {
    trackEventView(id);
  }, [id]);

  const handleGetTickets = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent ticket purchase for past events
    if (isPastEvent) {
      toast({
        title: "Event Ended",
        description: "This event has already ended. Tickets are no longer available for purchase.",
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

      // Open authentication modal
      const authEvent = new CustomEvent('sg:open-auth-modal', {
        detail: {
          tab: 'login',
          redirectPath: `/events/${id}`
        }
      });
      window.dispatchEvent(authEvent);
      return;
    }

    // Track ticket click for analytics
    trackEventTicketClick(id);
    onGetTicket && onGetTicket(id);
  };

  if (variant === "horizontal") {
    return (
      <div className={`event-card rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row group hover:shadow-xl transition-all duration-300 ${isPastEvent ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-80' : ''
        }`}>
        <Link href={`/events/${id}`} className="block w-full md:w-1/3 h-48 md:h-auto relative">
          <LazyImage
            src={imageUrl}
            alt={title}
            className={`w-full h-full transition-all duration-300 ${isPastEvent ? 'filter grayscale' : ''
              }`}
            fallbackSrc={SGFlyerLogoPng}
            placeholderColor="#1f2937"
            loadingClassName="w-full h-full bg-gray-800 animate-pulse"
            objectFit="contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
            {/* Subtle gradient overlay to improve visibility */}
          </div>
          {isPastEvent && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs">
                Event Ended
              </Badge>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
        </Link>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/events/${id}`} className="hover:underline">
                  <h3 className={`text-xl font-heading transition-colors ${isPastEvent ? 'text-gray-400' : ''
                    }`}>{title}</h3>
                </Link>
                <p className={`text-sm flex items-center mt-1 transition-colors ${isPastEvent ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                  <Calendar className="w-4 h-4 mr-1" /> {formatDate(date, id, title, time)}
                </p>
                <p className={`text-sm flex items-center mt-1 transition-colors ${isPastEvent ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                  <MapPin className="w-4 h-4 mr-1" /> {location}
                </p>
              </div>
              <Badge variant="outline" className={`font-bold px-3 py-1 rounded-full transition-colors ${isPastEvent ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-accent text-black'
                }`}>
                {formatEventPrice(event)}
              </Badge>
            </div>
            <p className={`text-sm mt-3 transition-colors ${isPastEvent ? 'text-gray-500' : ''
              }`}>{description}</p>
          </div>
          <div className="flex flex-col space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className={`px-2 py-1 rounded transition-colors ${isPastEvent
                  ? 'bg-gray-800 text-gray-400'
                  : 'bg-green-900 text-green-300'
                }`}>
                <span className="mr-1">{isPastEvent ? '📅' : '🎟️'}</span>
                {isPastEvent ? 'Event ended' : 'Tickets available'}
              </Badge>
              <div className="flex space-x-2">
                <Link href={`/events/${id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`transition-all ${isPastEvent
                        ? 'border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                        : 'border-primary text-primary hover:bg-primary hover:text-white'
                      }`}
                  >
                    View Details
                  </Button>
                </Link>
                <Button
                  className={`transition-all ${isPastEvent
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed hover:bg-gray-700'
                      : 'bg-primary text-white hover:bg-red-800'
                    }`}
                  onClick={handleGetTickets}
                  disabled={isPastEvent}
                  data-testid={isPastEvent ? "button-tickets-disabled" : "button-get-tickets"}
                >
                  {isPastEvent ? 'Event Ended' : 'Get Tickets'}
                </Button>
              </div>
            </div>
            {!isPastEvent && (
              <div className="flex justify-end">
                <AddToCalendarButton
                  event={event}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                  showText={true}
                  showOneClickButton={true}
                  oneClickProvider="google"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-card glass-card animate-fade-in-up group transition-all duration-300 ${isPastEvent ? 'opacity-70 grayscale hover:grayscale-0 hover:opacity-90' : ''
      }`}>
      <Link href={`/events/${id}`} className="block relative">
        <div className="w-full h-48 overflow-hidden rounded-t-2xl">
          <LazyImage
            src={imageUrl}
            alt={title}
            className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${isPastEvent ? 'filter grayscale' : ''
              }`}
            fallbackSrc={SGFlyerLogoPng}
            placeholderColor="#1f2937"
            loadingClassName="shimmer w-full h-full"
            objectFit="contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            {/* Enhanced gradient overlay */}
          </div>
          {isPastEvent && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-gray-800/90 text-gray-300 text-xs backdrop-blur-sm">
                Event Ended
              </Badge>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
            <div className="transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      </Link>
      <div className="p-6 card-content">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Link href={`/events/${id}`} className="hover:underline block">
              <h3 className={`heading-modern text-xl group-hover:text-primary transition-colors ${isPastEvent ? 'text-muted-foreground' : 'text-foreground/90'
                }`}>{title}</h3>
            </Link>
            <p className={`text-sm flex items-center mt-2 transition-colors ${isPastEvent ? 'text-muted-foreground' : 'text-foreground/60'
              }`}>
              <Calendar className="w-3 h-3 mr-1" /> {formatDate(date, id, title)}
            </p>
          </div>
          <Badge variant="outline" className={`text-xs font-bold px-3 py-1 rounded-full border-0 shadow-lg transition-colors ${isPastEvent
              ? 'bg-gray-700 text-gray-400'
              : 'gradient-primary text-white'
            }`}>
            {formatEventPrice(event)}
          </Badge>
        </div>
        <p className={`text-modern text-sm mt-2 line-clamp-2 transition-colors ${isPastEvent ? 'text-muted-foreground' : 'text-foreground/70'
          }`}>{description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`text-xs flex items-center transition-colors ${isPastEvent ? 'text-muted-foreground' : 'text-foreground/60'
            }`}>
            <MapPin className="w-3 h-3 mr-1" /> {location}
          </span>
          <div className="flex ml-auto space-x-2">
            <Link href={`/events/${id}`}>
              <Button
                variant="outline"
                size="sm"
                className={`transition-all duration-300 ${isPastEvent
                    ? 'glass-effect border-foreground/10 text-muted-foreground hover:bg-foreground/5 hover:text-foreground/80'
                    : 'glass-effect border-foreground/20 text-foreground hover:bg-foreground/10'
                  }`}
              >
                Details
              </Button>
            </Link>
            <Button
              className={`border-0 shadow-lg transition-all duration-300 ${isPastEvent
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed hover:bg-gray-700'
                  : 'btn-modern gradient-primary text-white'
                }`}
              size="sm"
              onClick={handleGetTickets}
              disabled={isPastEvent}
              data-testid={isPastEvent ? "button-tickets-disabled" : "button-get-tickets"}
            >
              {isPastEvent ? 'Event Ended' : 'Get Tickets'}
            </Button>
          </div>
        </div>
        {!isPastEvent && (
          <div className="mt-4 border-t border-border pt-4">
            <AddToCalendarButton
              event={event}
              variant="ghost"
              size="sm"
              className="text-foreground/70 hover:text-foreground w-full flex justify-center items-center transition-colors duration-300"
              iconClassName="mr-2 h-4 w-4"
              showText={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
