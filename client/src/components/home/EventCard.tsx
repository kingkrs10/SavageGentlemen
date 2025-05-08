import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Event } from "@/lib/types";

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
  const { id, title, description, date, location, price, imageUrl } = event;
  
  if (variant === "horizontal") {
    return (
      <div className="event-card rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full md:w-1/3 h-48 md:h-auto object-cover"
        />
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-heading">{title}</h3>
                <p className="text-sm text-gray-300 flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" /> {formatDate(date)}
                </p>
                <p className="text-sm text-gray-300 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" /> {location}
                </p>
              </div>
              <Badge variant="outline" className="bg-accent text-black font-bold px-3 py-1 rounded-full">
                {formatCurrency(price)}
              </Badge>
            </div>
            <p className="text-sm mt-3">{description}</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Badge variant="secondary" className="bg-green-900 text-green-300 px-2 py-1 rounded">
              <span className="mr-1">🎟️</span> Tickets available
            </Badge>
            <Button 
              className="bg-primary text-white hover:bg-red-800 transition"
              onClick={() => onGetTicket && onGetTicket(id)}
            >
              Get Ticket
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="event-card rounded-xl overflow-hidden shadow-lg">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-heading">{title}</h3>
            <p className="text-sm text-gray-300">{formatDate(date)}</p>
          </div>
          <Badge variant="outline" className="bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
            {formatCurrency(price)}
          </Badge>
        </div>
        <p className="text-sm mt-2">{description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs flex items-center">
            <MapPin className="w-3 h-3 mr-1" /> {location}
          </span>
          <Button 
            className="bg-primary text-white hover:bg-red-800 transition"
            size="sm"
            onClick={() => onGetTicket && onGetTicket(id)}
          >
            Get Ticket
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
