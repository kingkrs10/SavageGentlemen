import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";
import { LazyImage } from "@/components/ui/LazyImage";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";

interface HeroEventCarouselProps {
  events: Event[];
  onGetTicket: (eventId: number) => void;
  className?: string;
}

interface EventDetailsOverlayProps {
  event: Event;
  onGetTicket: (eventId: number) => void;
  isVisible: boolean;
}

const EventDetailsOverlay = ({ event, onGetTicket, isVisible }: EventDetailsOverlayProps) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Extract headliners from description (assuming they're at the beginning)
  const headliners = event.description?.split('\n')[0] || event.description || "Special Performance";

  if (!isVisible) {
    // Hide completely from accessibility tree when not visible
    return (
      <div
        id={`event-details-${event.id}`}
        className="absolute inset-0 opacity-0 translate-y-4 pointer-events-none"
        aria-hidden="true"
        data-testid="event-details-overlay"
      />
    );
  }

  return (
    <div
      id={`event-details-${event.id}`}
      className={cn(
        "absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-500 ease-in-out",
        "flex items-end justify-start p-8 md:p-12",
        "opacity-100 translate-y-0"
      )}
      role="region"
      aria-label={`${event.title} event details`}
      aria-live="polite"
      data-testid="event-details-overlay"
    >
      <div className="max-w-2xl space-y-4">
        {/* Event category badge */}
        <Badge
          variant="secondary"
          className="bg-primary text-white text-sm font-semibold px-3 py-1"
          data-testid="event-category-badge"
        >
          {event.category || "FEATURED EVENT"}
        </Badge>

        {/* Event title */}
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          {event.title}
        </h2>

        {/* Headliners/subtitle */}
        <p className="text-xl md:text-2xl text-orange-400 font-medium mb-6">
          {headliners}
        </p>

        {/* Event details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5 text-orange-400" />
            <div>
              <p className="text-sm text-gray-300 uppercase tracking-wide">DATE</p>
              <p className="font-semibold" data-testid="event-date">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-white">
            <MapPin className="h-5 w-5 text-orange-400" />
            <div>
              <p className="text-sm text-gray-300 uppercase tracking-wide">LOCATION</p>
              <p className="font-semibold" data-testid="event-location">{event.location}</p>
            </div>
          </div>

          {event.time && (
            <div className="flex items-center space-x-2 text-white">
              <Clock className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-300 uppercase tracking-wide">TIME</p>
                <p className="font-semibold" data-testid="event-time">{event.time}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call to action button */}
        <Button
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 text-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
          onClick={() => onGetTicket(event.id)}
          data-testid="learn-more-button"
        >
          <Users className="h-5 w-5 mr-2" />
          LEARN MORE
        </Button>
      </div>
    </div>
  );
};

const HeroEventCarousel = ({ events, onGetTicket, className }: HeroEventCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!api || !autoPlay || events.length <= 1) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [api, autoPlay, events.length, current]);

  // Pause auto-play on hover or focus
  const handleMouseEnter = () => {
    setAutoPlay(false);
  };

  const handleMouseLeave = () => {
    setAutoPlay(true);
    setShowDetails(null);
  };

  const handleFocus = () => {
    setAutoPlay(false);
  };

  const handleBlur = () => {
    setAutoPlay(true);
  };

  // Initialize carousel
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setShowDetails(null); // Hide details when slide changes
    });
  }, [api]);

  // Navigation handlers
  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
    setAutoPlay(false);
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
    setAutoPlay(false);
  }, [api]);

  const scrollToSlide = useCallback((index: number) => {
    api?.scrollTo(index);
    setAutoPlay(false);
  }, [api]);

  if (!events.length) return null;

  return (
    <div
      className={cn("relative w-full h-[85vh] sm:h-screen min-h-[550px] overflow-hidden bg-transparent", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid="hero-event-carousel"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full -ml-0">
          {events.map((event, index) => (
            <CarouselItem key={event.id} className="pl-0 h-full">
              <div
                className="relative w-full h-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-black"
                onClick={() => setShowDetails(showDetails === index ? null : index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowDetails(showDetails === index ? null : index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={showDetails === index}
                aria-controls={`event-details-${event.id}`}
                aria-label={`${event.title} event details. Press Enter or Space to ${showDetails === index ? 'hide' : 'show'} more information.`}
                data-testid={`carousel-slide-${event.id}`}
              >
                {/* Background area with rich vibrant glowing Caribbean gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a0808] via-[#0d070b] to-[#08090c]">
                  {event.imageUrl ? (
                    <img
                      src={getNormalizedImageUrl(event.imageUrl)}
                      alt={event.title}
                      className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_50%_45%,_rgba(234,88,12,0.3)_0%,_rgba(185,28,28,0.18)_35%,_rgba(8,9,12,0.95)_75%)]">
                      <img
                        src={SGFlyerLogoPng}
                        alt="Savage Gentlemen"
                        className="max-h-72 sm:max-h-96 w-auto object-contain opacity-85 drop-shadow-[0_0_40px_rgba(249,115,22,0.55)] transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Gradient overlays tuned for maximum text clarity without washing out the backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-black/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-10" />
                </div>

                {/* Default content (Bottom-left positioning, padded for mobile bottom-nav) */}
                <div className="absolute bottom-20 sm:bottom-24 left-0 w-full p-6 sm:p-10 md:p-16 flex items-end justify-start text-left z-20 pointer-events-none">
                  <div className="max-w-3xl space-y-4 sm:space-y-6 animate-fade-in">
                    <div className="space-y-2 sm:space-y-3">
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.5)] border-0"
                      >
                        {event.category || "FEATURED EVENT"}
                      </Badge>

                      <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-none tracking-tight uppercase font-heading drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] line-clamp-2">
                        {event.title}
                      </h1>
                      <p className="text-base sm:text-2xl md:text-3xl text-amber-400 font-bold tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-2">
                        {event.description?.split('\n')[0] || "Special Performance"}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white">
                      <div className="flex items-center bg-black/60 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-white/20 shadow-2xl text-xs sm:text-base">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-orange-400" />
                        <span className="font-bold text-white">
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center bg-black/60 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-white/20 shadow-2xl text-xs sm:text-base">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 text-orange-400" />
                          <span className="font-bold text-white truncate max-w-[150px] sm:max-w-xs">
                            {event.location.split(',')[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTAs with glowing gradients */}
                    <div className="pt-2 sm:pt-4 flex items-center gap-3 sm:gap-4 pointer-events-auto">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-extrabold px-6 py-3.5 sm:px-9 sm:py-4 text-sm sm:text-lg uppercase tracking-wider transition-all duration-300 transform active:scale-95 shadow-[0_0_25px_rgba(234,88,12,0.65)] border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGetTicket(event.id);
                        }}
                      >
                        Get Tickets
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-white/40 bg-black/40 text-white hover:bg-white/20 px-5 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-lg uppercase tracking-wider backdrop-blur-md transition-all duration-300 active:scale-95 font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(showDetails === index ? null : index);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>


                  {/* Interactive details overlay */}
                  <EventDetailsOverlay
                    event={event}
                    onGetTicket={onGetTicket}
                    isVisible={showDetails === index}
                  />
                </div>
              </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation arrows (hidden on small mobile screens to encourage swipe) */}
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm z-10"
          onClick={scrollPrev}
          data-testid="carousel-prev-button"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous slide</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 border-white/20 text-white hover:bg-black/60 backdrop-blur-sm z-10"
          onClick={scrollNext}
          data-testid="carousel-next-button"
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next slide</span>
        </Button>


        {/* Progress dots (only if multiple slides) */}
        {count > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  index === current - 1
                    ? "bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                    : "bg-white/40 hover:bg-white/75"
                )}
                onClick={() => scrollToSlide(index)}
                data-testid={`carousel-dot-${index}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
};


export default HeroEventCarousel;