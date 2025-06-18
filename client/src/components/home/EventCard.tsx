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
}

const EventCard = ({ 
  event, 
  variant = "vertical",
  onGetTicket 
}: EventCardProps) => {
  const { id, title, description, date, time, location, price, imageUrl } = event;
  
  // Track event view when card is rendered
  React.useEffect(() => {
    trackEventView(id);
  }, [id]);
  
  if (variant === "horizontal") {
    return (
      <div className="event-card rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row group hover:shadow-xl transition-shadow duration-300">
        <Link href={`/events/${id}`} className="block w-full md:w-1/3 h-48 md:h-auto relative">
          <LazyImage 
            src={imageUrl}
            alt={title}
            className="w-full h-full"
            fallbackSrc={SGFlyerLogoPng}
            placeholderColor="#1f2937"
            loadingClassName="w-full h-full bg-gray-800 animate-pulse"
            objectFit="contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
            {/* Subtle gradient overlay to improve visibility */}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
        </Link>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/events/${id}`} className="hover:underline">
                  <h3 className="text-xl font-heading">{title}</h3>
                </Link>
                <p className="text-sm text-gray-300 flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" /> {formatDate(date, id, title, time)}
                </p>
                <p className="text-sm text-gray-300 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" /> {location}
                </p>
              </div>
              <Badge variant="outline" className="bg-accent text-black font-bold px-3 py-1 rounded-full">
                {formatEventPrice(event)}
              </Badge>
            </div>
            <p className="text-sm mt-3">{description}</p>
          </div>
          <div className="flex flex-col space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="bg-green-900 text-green-300 px-2 py-1 rounded">
                <span className="mr-1">🎟️</span> Tickets available
              </Badge>
              <div className="flex space-x-2">
                <Link href={`/events/${id}`}>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-white transition"
                  >
                    View Details
                  </Button>
                </Link>
                <Button 
                  className="bg-primary text-white hover:bg-red-800 transition"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Track ticket click for analytics
                    trackEventTicketClick(id);
                    onGetTicket && onGetTicket(id);
                  }}
                >
                  Get Tickets
                </Button>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="event-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <Link href={`/events/${id}`} className="block relative">
        <div className="w-full h-48">
          <LazyImage 
            src={imageUrl}
            alt={title}
            className="w-full h-full"
            fallbackSrc={SGFlyerLogoPng}
            placeholderColor="#1f2937"
            loadingClassName="w-full h-full bg-gray-800 animate-pulse"
            objectFit="contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
            {/* Subtle gradient overlay to improve visibility */}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/events/${id}`} className="hover:underline block">
              <h3 className="text-xl font-heading">{title}</h3>
            </Link>
            <p className="text-sm text-gray-300 flex items-center mt-1">
              <Calendar className="w-3 h-3 mr-1" /> {formatDate(date, id, title)}
            </p>
          </div>
          <Badge variant="outline" className="bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
            {formatEventPrice(event)}
          </Badge>
        </div>
        <p className="text-sm mt-2">{description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs flex items-center">
            <MapPin className="w-3 h-3 mr-1" /> {location}
          </span>
          <div className="flex ml-auto space-x-2">
            <Link href={`/events/${id}`}>
              <Button 
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white transition"
              >
                Details
              </Button>
            </Link>
            <Button 
              className="bg-primary text-white hover:bg-red-800 transition"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Track ticket click for analytics
                trackEventTicketClick(id);
                onGetTicket && onGetTicket(id);
              }}
            >
              Get Tickets
            </Button>
          </div>
        </div>
        <div className="mt-3 border-t border-gray-800 pt-3">
          <AddToCalendarButton 
            event={event} 
            variant="ghost" 
            size="sm"
            className="text-white/70 hover:text-white w-full flex justify-center items-center"
            iconClassName="mr-2 h-4 w-4"
            showText={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EventCard;
