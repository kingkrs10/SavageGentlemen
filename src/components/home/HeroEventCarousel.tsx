
"use client";
"use client";

import { useState, useEffect, useCallback } from "react";

import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Clock, Info } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

interface HeroEventCarouselProps {
  events: Event[];
  onGetTicket: (eventId: number) => void;
  className?: string;
}

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
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 6000);
    return () => clearInterval(interval);
  }, [api, autoPlay, events.length]);

  const handleInteractionStart = () => setAutoPlay(false);
  const handleInteractionEnd = () => {
    setAutoPlay(true);
    setShowDetails(null);
  };

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setShowDetails(null);
    });
  }, [api]);

  if (!events.length) return null;

  return (
    <div
      className={cn("relative w-full h-[90vh] md:h-screen overflow-hidden", className)}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full h-full">
        <CarouselContent className="h-full -ml-0">
          {events.map((event, index) => {
            const isActive = index === current - 1;
            return (
              <CarouselItem key={event.id} className="pl-0 h-full relative">
                {/* Background Image with Zoom Effect */}
                <div className="absolute inset-0 overflow-hidden">
                  {event.imageUrl && (
                    <motion.img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1 }}
                      animate={{ scale: isActive ? 1.05 : 1 }}
                      transition={{ duration: 6, ease: "linear" }}
                    />
                  )}
                  {/* Enhanced Cinematic Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
                  {/* Subtle color wash for vibe */}
                  <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
                </div>

                {/* Main Content Rendered Only When Active (for optimization/animation reset) */}
                {isActive && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10 top-0">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      className="max-w-5xl space-y-8"
                    >
                      <Badge className="bg-primary/20 text-primary border border-primary/50 backdrop-blur-md text-base px-6 py-2 uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(255,87,34,0.3)]">
                        {event.category || "Featured Event"}
                      </Badge>

                      <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-heading text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                        {event.title}
                      </h1>

                      <p className="text-xl md:text-2xl text-gray-200 font-light tracking-wide max-w-3xl mx-auto drop-shadow-lg leading-relaxed mix-blend-plus-lighter">
                        {event.description?.split('\n')[0] || "Experience the vibe."}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10 pt-4">
                        <Button
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-white min-w-[220px] h-16 text-xl uppercase tracking-widest font-bold shadow-neon hover:shadow-[0_0_30px_rgba(255,87,34,0.6)] transition-all duration-300 rounded-2xl"
                          onClick={() => onGetTicket(event.id)}
                        >
                          Get Tickets
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-white/20 hover:bg-white/10 text-white min-w-[220px] h-16 text-xl uppercase tracking-widest backdrop-blur-md rounded-2xl"
                          onClick={() => setShowDetails(showDetails === index ? null : index)}
                        >
                          <Info className="mr-2 h-5 w-5" />
                          More Info
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Info Overlay */}
                <AnimatePresence>
                  {showDetails === index && (
                    <motion.div
                      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-6"
                      onClick={() => setShowDetails(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="max-w-3xl w-full bg-black/40 border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                          <img src={event.imageUrl || ''} className="w-64 h-64 object-cover rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10">
                          <h2 className="text-4xl md:text-6xl font-heading text-white mb-6 uppercase tracking-wide">{event.title}</h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <Calendar className="w-6 h-6 text-primary mr-4 mt-1" />
                                <div>
                                  <p className="text-sm text-gray-400 uppercase tracking-widest">Date</p>
                                  <p className="text-xl text-white font-semibold">
                                    {new Date(event.date).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Clock className="w-6 h-6 text-primary mr-4 mt-1" />
                                <div>
                                  <p className="text-sm text-gray-400 uppercase tracking-widest">Time</p>
                                  <p className="text-xl text-white font-semibold">{event.time || "TBA"}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <MapPin className="w-6 h-6 text-primary mr-4 mt-1" />
                                <div>
                                  <p className="text-sm text-gray-400 uppercase tracking-widest">Location</p>
                                  <p className="text-xl text-white font-semibold">{event.location}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-300 text-lg leading-relaxed mb-8">{event.description}</p>

                          <Button
                            className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-xl uppercase tracking-widest font-bold"
                            onClick={() => {
                              onGetTicket(event.id);
                              setShowDetails(null);
                            }}
                          >
                            Secure Your Spot
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Custom Navigation */}
        <div className="absolute bottom-12 right-12 z-10 flex gap-4 hidden md:flex">
          <Button variant="outline" size="icon" className="rounded-full w-14 h-14 border-white/20 bg-black/20 hover:bg-white/10 backdrop-blur-md text-white" onClick={() => api?.scrollPrev()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full w-14 h-14 border-white/20 bg-black/20 hover:bg-white/10 backdrop-blur-md text-white" onClick={() => api?.scrollNext()}>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </Carousel>
    </div>
  );
};

export default HeroEventCarousel;