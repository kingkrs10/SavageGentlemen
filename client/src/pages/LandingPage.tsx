import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import HeroEventCarousel from "@/components/home/HeroEventCarousel";
import { API_ROUTES, EXTERNAL_URLS } from "@/lib/constants";
import { Event } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/context/ThemeContext";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import BrandVideo from "@/assets/videos/brand-video.mp4";

const LandingPage = () => {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const { setTheme } = useTheme();

    const { data: featuredEvents, isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: [API_ROUTES.EVENTS_FEATURED],
    });

    const enterTheVoid = (path?: string) => {
        setTheme('tactical');
        if (path) {
            setTimeout(() => navigate(path), 500); // Small delay for transition
        }
    };

    const handleGetTicket = (eventId: number) => {
        toast({
            title: "Redirecting...",
            description: "Entering the void..."
        });
        setTheme('tactical');
        setTimeout(() => {
            navigate("/events");
        }, 1000);
    };

    return (
        <div className="mx-auto min-h-screen bg-background overflow-hidden relative">
            {/* Interactive Event Carousel Hero */}
            {featuredEvents && featuredEvents.length > 0 ? (
                <HeroEventCarousel
                    events={featuredEvents}
                    onGetTicket={handleGetTicket}
                    className=""
                />
            ) : eventsLoading ? (
                <div className="relative w-full h-screen bg-background flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="text-foreground text-lg">Loading events...</p>
                    </div>
                </div>
            ) : (
                // Fallback hero with video
                <div className="relative w-full h-screen overflow-hidden">
                    <div className="relative h-full">
                        <div className="h-full w-full bg-background">
                            <video
                                className="w-full h-full object-cover absolute inset-0 opacity-75"
                                autoPlay
                                muted
                                loop
                                playsInline
                            >
                                <source src={BrandVideo} type="video/mp4" />
                            </video>

                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 z-10 flex flex-col items-center justify-center">
                                <img
                                    src={SGFlyerLogoPng}
                                    alt="Savage Gentlemen"
                                    className="h-60 w-60 object-contain mb-12 animate-fade-in"
                                />

                                <h1 className="text-5xl md:text-7xl font-heading text-foreground uppercase tracking-wide mb-6 [text-shadow:_0_2px_5px_rgba(0,0,0,0.7)] text-center animate-fade-in-up">
                                    SAVAGE GENTLEMEN
                                </h1>

                                <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto mb-12 uppercase tracking-widest [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)] text-center animate-fade-in-up animate-delay-100">
                                    EVENTS · MERCHANDISE · LIVE STREAM · COMMUNITY
                                </p>

                                <div className="flex flex-col gap-4 mx-auto max-w-md px-6 w-full animate-fade-in-up animate-delay-200">
                                    <Button
                                        className="btn-modern gradient-primary text-primary-foreground px-8 py-6 uppercase tracking-widest text-lg font-semibold w-full border-0"
                                        onClick={() => enterTheVoid('/events')}
                                    >
                                        VIEW EVENTS
                                    </Button>
                                    <Button
                                        className="btn-modern glass-effect border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 text-white hover:from-emerald-500/30 hover:to-purple-500/30 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-sm w-full"
                                        onClick={() => enterTheVoid('/socapassport')}
                                    >
                                        🎫 GET YOUR SOCA PASSPORT
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="btn-modern glass-effect border-foreground/20 text-foreground hover:bg-foreground/10 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-sm w-full"
                                        onClick={() => enterTheVoid('/apps')}
                                    >
                                        APPS
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Manifesto Section - Cinematic */}
            <section className="relative py-20 bg-gradient-to-b from-background via-card to-background overflow-hidden">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Simple text content, centered, minimal */}
                    <div className="text-center space-y-8 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-heading uppercase tracking-wider text-foreground leading-tight">
                            The Experience
                        </h2>

                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
                            We're more than events. We're a movement celebrating Caribbean-American culture through unforgettable experiences.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
