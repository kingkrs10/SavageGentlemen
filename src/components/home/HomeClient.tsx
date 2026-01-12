"use client";

import { useState } from "react";


import Link from "next/link"; // Changed from wouter
import { useRouter } from "next/navigation"; // Changed from wouter
import { ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/home/EventCard";
// import ProductCard from "@/components/home/ProductCard"; // Not used in home.tsx
import EventsBanner from "@/components/home/EventsBanner";
import AdSpace from "@/components/home/AdSpace";
import HeroEventCarousel from "@/components/home/HeroEventCarousel";
import { EXTERNAL_URLS } from "@/lib/constants";
import { Event, Product, Livestream } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
// Assets need to be imported correctly or used from public if possible, but webpack handles imports in Next.js too if configured
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png"; // Next.js handles static imports
// Video imports might need configuration or move to public
// import BrandVideo from "@/assets/videos/brand-video.mp4"; 

// Using a public URL or moving the video to public folder is better for Next.js App Router static assets
const BrandVideo = "/videos/brand-video.mp4";

interface HomeClientProps {
    initialFeaturedEvents: Event[];
    initialFeaturedProducts: Product[];
    initialLivestream: Livestream | undefined;
    initialPosts: any[];
}

const HomeClient = ({
    initialFeaturedEvents,
    initialFeaturedProducts,
    initialLivestream,
    initialPosts
}: HomeClientProps) => {
    const router = useRouter();
    const { toast } = useToast();

    // Use initial data directly instead of useQuery for SEO (passed from server)
    const featuredEvents = initialFeaturedEvents;
    const eventsLoading = false; // Data is pre-fetched

    const featuredProducts = initialFeaturedProducts;
    const productsLoading = false;

    const currentLivestream = initialLivestream;
    const livestreamLoading = false;

    const handleGetTicket = (eventId: number) => {
        toast({
            title: "Redirecting to ticket provider",
            description: "You'll be redirected to our ticketing partner's website to complete your purchase."
        });

        setTimeout(() => {
            router.push("/events");
        }, 1000);
    };

    const handleAddToCart = (productId: number) => {
        toast({
            title: "Added to cart",
            description: "Product has been added to your cart."
        });
    };

    const [heroImgError, setHeroImgError] = useState(false);
    const [adImgError, setAdImgError] = useState(false);
    const [livestreamImgError, setLivestreamImgError] = useState(false);

    return (
        <div className="mx-auto bg-background text-foreground overflow-x-hidden">
            {/* Interactive Event Carousel Hero */}
            {featuredEvents && featuredEvents.length > 0 ? (
                <HeroEventCarousel
                    events={featuredEvents}
                    onGetTicket={handleGetTicket}
                    className="-mx-0 md:-mx-3" // Adjust for full width
                />
            ) : eventsLoading ? (
                <div className="relative w-full h-screen bg-black flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="text-white text-lg tracking-widest uppercase">Loading experience...</p>
                    </div>
                </div>
            ) : (
                // Fallback hero with video
                <div className="relative w-full h-[100vh] overflow-hidden">
                    <div className="relative h-full">
                        <div className="h-full w-full bg-black">
                            <video
                                className="w-full h-full object-cover absolute inset-0 opacity-60"
                                autoPlay
                                muted
                                loop
                                playsInline
                            >
                                <source src={BrandVideo} type="video/mp4" />
                            </video>

                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background z-10 flex flex-col items-center justify-center text-center px-4">
                                <img
                                    src={SGFlyerLogoPng.src}
                                    alt="Savage Gentlemen"
                                    className="h-40 w-40 md:h-60 md:w-60 object-contain mb-8 animate-fade-in-up"
                                />

                                <h1 className="text-6xl md:text-8xl font-heading text-white uppercase tracking-tighter mb-6 [text-shadow:_0_4px_20px_rgba(0,0,0,0.5)] animate-fade-in-up animate-delay-100">
                                    Savage Gentlemen
                                </h1>

                                <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 uppercase tracking-widest font-light animate-fade-in-up animate-delay-200">
                                    Curators of Culture & Nightlife
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in-up animate-delay-300">
                                    <Button
                                        className="btn-modern bg-primary text-white hover:bg-primary/90 px-8 py-6 uppercase tracking-widest text-lg font-semibold w-full border-0 shadow-neon"
                                        onClick={() => router.push('/events')}
                                    >
                                        Explore Events
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="btn-modern border-white/30 text-white hover:bg-white/10 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-md w-full"
                                        onClick={() => router.push('/shop')}
                                    >
                                        The Collection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Manifesto Section - "The Vibe" */}
            <section className="relative py-24 bg-background overflow-hidden">
                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* Video/Visual */}
                        <div className="lg:col-span-7 relative group">
                            <div className="aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                                <video
                                    className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                                    controls={false}
                                    autoPlay
                                    muted
                                    loop
                                    poster={SGFlyerLogoPng.src}
                                    playsInline
                                >
                                    <source src={BrandVideo} type="video/mp4" />
                                </video>
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent pointer-events-none" />
                            </div>
                            {/* Floating Elements */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-background border border-white/10 rounded-2xl flex items-center justify-center shadow-xl animate-bounce-slow hidden md:flex">
                                <img src={SGFlyerLogoPng.src} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="lg:col-span-5 space-y-8">
                            <h2 className="text-5xl md:text-7xl font-heading text-white uppercase tracking-tighter leading-[0.9]">
                                We Are <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                                    The Culture
                                </span>
                            </h2>

                            <p className="text-lg text-gray-400 leading-relaxed font-light">
                                Savage Gentlemen is more than simple entertainment. We are a movement dedicated to elevating the Caribbean-American experience. Through curated events, premium merchandise, and a vibrant community, we define the night.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-white">100+</span>
                                    <span className="text-sm text-gray-500 uppercase tracking-wider">Events</span>
                                </div>
                                <div className="w-px h-12 bg-white/10 mx-4" />
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-white">5k+</span>
                                    <span className="text-sm text-gray-500 uppercase tracking-wider">Members</span>
                                </div>
                                <div className="w-px h-12 bg-white/10 mx-4" />
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-white">Infinite</span>
                                    <span className="text-sm text-gray-500 uppercase tracking-wider">Vibes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid - "The Mix" */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <span className="text-primary text-sm font-bold tracking-[0.2em] uppercase mb-2 block">What's Happening</span>
                        <h2 className="text-4xl md:text-5xl font-heading text-white uppercase tracking-wide">The Mix</h2>
                    </div>
                    <Button variant="link" className="text-white/60 hover:text-primary transition-colors hidden md:block" onClick={() => router.push('/events')}>
                        View/All Events →
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
                    {/* Featured Event - Large Square (2x2) */}
                    {featuredEvents && featuredEvents[0] && (
                        <div className="md:col-span-2 md:row-span-2 relative group rounded-3xl overflow-hidden border border-white/10">
                            <img
                                src={featuredEvents[0].imageUrl || SGFlyerLogoPng.src}
                                alt={featuredEvents[0].title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-neon">
                                    Featured Event
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h3 className="text-4xl font-heading text-white mb-2 uppercase leading-none">{featuredEvents[0].title}</h3>
                                <div className="flex items-center text-gray-300 mb-6 text-sm">
                                    <span className="mr-4">{new Date(featuredEvents[0].date).toLocaleDateString()}</span>
                                    <span>{featuredEvents[0].location}</span>
                                </div>
                                <Button
                                    className="w-full bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-wider"
                                    onClick={() => handleGetTicket(featuredEvents[0].id)}
                                >
                                    Get Tickets
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Secondary Event - Tall (1x2) */}
                    {featuredEvents && featuredEvents[1] && (
                        <div className="md:col-span-1 md:row-span-2 relative group rounded-3xl overflow-hidden border border-white/10 bg-card">
                            <img
                                src={featuredEvents[1].imageUrl || SGFlyerLogoPng.src}
                                alt={featuredEvents[1].title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-b from-transparent to-black/90">
                                <h3 className="text-2xl font-heading text-white mb-2 uppercase leading-none">{featuredEvents[1].title}</h3>
                                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-4">
                                    {new Date(featuredEvents[1].date).toLocaleDateString()}
                                </p>
                                <Button
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10 w-full"
                                    onClick={() => handleGetTicket(featuredEvents[1].id)}
                                >
                                    Details
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Merch Item - Small (1x1) */}
                    {featuredProducts && featuredProducts[0] && (
                        <div className="md:col-span-1 md:row-span-1 relative group rounded-3xl overflow-hidden border border-white/10 bg-card p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Drop</span>
                            </div>
                            <img
                                src={featuredProducts[0].imageUrl || SGFlyerLogoPng.src}
                                alt={featuredProducts[0].title}
                                className="w-24 h-24 mx-auto object-contain drop-shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300"
                            />
                            <div>
                                <h4 className="text-lg font-bold text-white line-clamp-1">{featuredProducts[0].title}</h4>
                                <p className="text-primary font-bold">${(featuredProducts[0].price / 100).toFixed(2)}</p>
                            </div>
                            {/* Invisible full link */}
                            <div
                                className="absolute inset-0 cursor-pointer"
                                onClick={() => handleAddToCart(featuredProducts[0].id)}
                            />
                        </div>
                    )}

                    {/* Soca Passport / Ad - Small (1x1) - Interactive Gradient */}
                    <div className="md:col-span-1 md:row-span-1 relative overflow-hidden rounded-3xl p-6 flex flex-col justify-center items-center text-center cursor-pointer group" onClick={() => router.push('/socapassport')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 text-white">
                            <h3 className="text-2xl font-heading uppercase mb-1">Soca Passport</h3>
                            <p className="text-xs text-white/80 mb-3">Unlock Exclusive Perks</p>
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur mx-auto flex items-center justify-center">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Carnival Planner Ad - Wide (2x1) */}
                    <div className="md:col-span-2 md:row-span-1 relative group rounded-3xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => window.open('https://carnival-planner.com', '_blank')}>
                        <img
                            src="/uploads/carnival-planner-ad.png"
                            alt="Carnival Planner"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
                        <div className="absolute inset-0 flex flex-col justify-center p-8">
                            <h3 className="text-3xl font-heading text-white uppercase tracking-tighter mb-2 drop-shadow-lg">
                                Simply Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Carnival</span>
                            </h3>
                            <p className="text-gray-200 text-sm max-w-xs mb-6 font-light">
                                Plan your ultimate experience. Flights, costumes, events, and more.
                            </p>
                            <div className="flex items-center text-cyan-400 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                                Start Planning <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Livestream Box (2x1) */}
                    {currentLivestream && (
                        <div className="md:col-span-2 md:row-span-1 relative overflow-hidden rounded-3xl group cursor-pointer border border-primary/30" onClick={() => currentLivestream.streamUrl && window.open(currentLivestream.streamUrl, '_blank')}>
                            <div className="absolute inset-0 bg-black">
                                {currentLivestream.thumbnailUrl && <img src={currentLivestream.thumbnailUrl} className="w-full h-full object-cover opacity-60" />}
                            </div>
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Live Now</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                    <Play className="w-5 h-5 ml-1" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-white font-bold">{currentLivestream.title}</h3>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* Footer Call to Action */}
            <section className="py-24 bg-gradient-to-t from-primary/20 to-transparent">
                <div className="container mx-auto text-center px-4">
                    <h2 className="text-6xl md:text-9xl font-heading text-white/50 uppercase tracking-tighter mb-8 hover:text-white transition-colors duration-500 cursor-default">
                        Savage Vibes
                    </h2>
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-white text-xl px-12 py-8 rounded-full shadow-neon font-heading tracking-wider"
                        onClick={() => router.push('/register')}
                    >
                        Explore More
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default HomeClient;
