"use client";

import React from "react";
import { Calendar, MapPin, ExternalLink, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatEventPrice } from "@/lib/currency";
import { Event } from "@/lib/types";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import LazyImage from "@/components/ui/LazyImage";
import Link from "next/link";
import { trackEventView, trackEventTicketClick } from "@/lib/analytics";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  React.useEffect(() => {
    trackEventView(id);
  }, [id]);

  const handleGetTickets = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPastEvent) {
      toast({
        title: "Event Ended",
        description: "Tickets are no longer available.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Create an account to grab your tickets!",
        variant: "default",
      });
      const authEvent = new CustomEvent('sg:open-auth-modal', {
        detail: { tab: 'login', redirectPath: `/events/${id}` }
      });
      window.dispatchEvent(authEvent);
      return;
    }

    trackEventTicketClick(id);
    onGetTicket && onGetTicket(id);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: {
      y: -8,
      boxShadow: "0 20px 40px -5px rgba(220, 38, 38, 0.15)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, margin: "-50px" }}
      className={`relative group bg-card/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden ${isPastEvent ? 'opacity-60 grayscale' : ''
        }`}
    >
      {/* Image Container with Zoom Effect */}
      <Link href={`/events/${id}`} className="block relative overflow-hidden aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3]">
        <motion.div
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <LazyImage
            src={imageUrl || ''}
            alt={title}
            className="w-full h-full object-cover"
            fallbackSrc={SGFlyerLogoPng.src}
            loadingClassName="bg-gray-900"
          />
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90" />

        {/* Floating Price Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge
            className="bg-primary text-white border-none text-sm font-bold shadow-neon backdrop-blur-sm px-3 py-1 uppercase tracking-wider"
          >
            {formatEventPrice(event)}
          </Badge>
        </div>

        {/* Date Badge */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-center bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-2 min-w-[3.5rem] text-white shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-xl font-heading leading-none">
            {new Date(date).getDate()}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col h-full gap-4">
        {/* Title & Desc */}
        <div>
          <Link href={`/events/${id}`} className="block group-hover:text-primary transition-colors duration-300">
            <h3 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-wide leading-none mb-3 line-clamp-2">
              {title}
            </h3>
          </Link>
          <div className="flex items-center text-gray-400 text-sm mb-4 font-light tracking-wide">
            <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
            <span className="truncate">{location}</span>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed font-light">
            {description}
          </p>
        </div>

        {/* Action Area */}
        <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between gap-3">
          {!isPastEvent && (
            <AddToCalendarButton
              event={event}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-white/5 shrink-0 rounded-full w-10 h-10 transition-colors"
              showText={false}
            />
          )}

          <div className="flex gap-3 w-full justify-end">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white bg-transparent hidden sm:flex uppercase tracking-wider text-xs font-semibold rounded-xl h-10 px-6"
              onClick={() => window.location.href = `/events/${id}`}
            >
              Details
            </Button>

            <Button
              className={`flex-1 font-bold tracking-widest uppercase text-xs rounded-xl h-10 shadow-lg ${isPastEvent
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white shadow-neon hover:shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all'
                }`}
              onClick={handleGetTickets}
              disabled={isPastEvent}
            >
              {isPastEvent ? 'Ended' : 'Get Tickets'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
