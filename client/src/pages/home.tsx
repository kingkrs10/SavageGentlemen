import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/home/EventCard";
import ProductCard from "@/components/home/ProductCard";
import EventsBanner from "@/components/home/EventsBanner";
import AdSpace from "@/components/home/AdSpace";
import { API_ROUTES, EXTERNAL_URLS } from "@/lib/constants";
import { Event, Product, Livestream } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import IntroVideo from "@/assets/videos/intro.mp4";

const Home = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: featuredEvents, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [API_ROUTES.EVENTS_FEATURED],
  });
  
  const { data: featuredProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS_FEATURED],
  });
  
  const { data: currentLivestream, isLoading: livestreamLoading } = useQuery<Livestream>({
    queryKey: [API_ROUTES.LIVESTREAMS_CURRENT],
  });
  
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: [API_ROUTES.POSTS],
  });

  const handleGetTicket = (eventId: number) => {
    toast({
      title: "Redirecting to ticket provider",
      description: "You'll be redirected to our ticketing partner's website to complete your purchase."
    });
    
    // In a real app, this would redirect to a ticketing service
    // For now, we'll just navigate to the events page
    setTimeout(() => {
      navigate("/events");
    }, 1000);
  };
  
  const handleAddToCart = (productId: number) => {
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart."
    });
    
    // In a real app, this would add the product to a cart
    // For now, we'll just show a toast
  };

  const [heroImgError, setHeroImgError] = useState(false);
  const [adImgError, setAdImgError] = useState(false);
  const [livestreamImgError, setLivestreamImgError] = useState(false);
  
  return (
    <div className="mx-auto">
      {/* Full Width Hero Banner with Video */}
      <div className="relative w-full h-[100vh] overflow-hidden -mx-3">
        <div className="relative h-full">
          {/* Hero Background with Video */}
          <div className="h-full w-full bg-black">
            <video 
              className="w-full h-full object-cover absolute inset-0 opacity-75"
              autoPlay 
              muted 
              loop
              playsInline
            >
              <source src={IntroVideo} type="video/mp4" />
            </video>
            
            {/* Overlay and Logo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 z-10 flex flex-col items-center justify-center">
              <img 
                src={SGFlyerLogoPng} 
                alt="Savage Gentlemen" 
                className="h-60 w-60 object-contain mb-12"
              />
              
              {/* Main Headline */}
              <h1 className="text-5xl md:text-7xl font-heading text-white uppercase tracking-wide mb-6 [text-shadow:_0_2px_5px_rgba(0,0,0,0.7)] text-center">
                SAVAGE GENTLEMEN
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 uppercase tracking-widest [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)] text-center">
                EVENTS · MERCHANDISE · LIVE STREAM · COMMUNITY
              </p>
              
              {/* Action Buttons below Logo */}
              <div className="flex flex-col gap-4 mx-auto max-w-md px-6">
                <Button 
                  className="btn-modern gradient-primary text-white px-8 py-6 uppercase tracking-widest text-lg font-semibold w-full border-0"
                  onClick={() => navigate('/events')}
                >
                  VIEW EVENTS
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-modern glass-effect border-white/20 text-white hover:bg-white/10 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-sm w-full"
                  onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
                >
                  SHOP COLLECTION
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Banner */}
      <EventsBanner />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-3 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Featured Events Section */}
            {featuredEvents && featuredEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="heading-modern text-3xl gradient-text uppercase tracking-wide">Featured Events</h2>
                  <Link href="/events">
                    <Button variant="outline" className="btn-modern glass-effect border-white/20 text-white hover:bg-white/10 group">
                      View All
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {eventsLoading 
                    ? Array(3).fill(0).map((_, i) => (
                        <div key={i} className="space-y-4">
                          <div className="shimmer h-48 w-full rounded-2xl" />
                          <div className="shimmer h-4 w-3/4 rounded" />
                          <div className="shimmer h-4 w-1/2 rounded" />
                        </div>
                      ))
                    : featuredEvents.map((event, index) => (
                        <div key={event.id} className={`animate-fade-in-up animate-delay-${(index + 1) * 100}`}>
                          <EventCard
                            event={event}
                            onGetTicket={handleGetTicket}
                          />
                        </div>
                      ))
                  }
                </div>
              </section>
            )}

            {/* Featured Products Section */}
            {featuredProducts && featuredProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="heading-modern text-3xl gradient-text uppercase tracking-wide">Featured Products</h2>
                  <Button 
                    variant="outline" 
                    className="btn-modern glass-effect border-white/20 text-white hover:bg-white/10 group"
                    onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
                  >
                    Shop All
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {productsLoading 
                    ? Array(3).fill(0).map((_, i) => (
                        <div key={i} className="space-y-4">
                          <div className="shimmer h-48 w-full rounded-2xl" />
                          <div className="shimmer h-4 w-3/4 rounded" />
                          <div className="shimmer h-4 w-1/2 rounded" />
                        </div>
                      ))
                    : featuredProducts.map((product, index) => (
                        <div key={product.id} className={`animate-fade-in-up animate-delay-${(index + 1) * 100}`}>
                          <ProductCard
                            product={product}
                            onAddToCart={handleAddToCart}
                          />
                        </div>
                      ))
                  }
                </div>
              </section>
            )}

            {/* Livestream Section */}
            {currentLivestream && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-heading uppercase tracking-wide">Live Now</h2>
                </div>
                
                <div className="bg-card rounded-lg overflow-hidden shadow-lg">
                  <div className="aspect-video relative bg-gray-900">
                    {livestreamLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : currentLivestream.thumbnailUrl && !livestreamImgError ? (
                      <img
                        src={currentLivestream.thumbnailUrl}
                        alt={currentLivestream.title}
                        className="w-full h-full object-cover"
                        onError={() => setLivestreamImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Play className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-primary/90 hover:bg-primary text-white"
                        onClick={() => window.open(currentLivestream.streamUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Watch Live
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{currentLivestream.title}</h3>
                    {currentLivestream.description && (
                      <p className="text-muted-foreground">{currentLivestream.description}</p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar with Ad Space */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AdSpace />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
