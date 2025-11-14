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
import HeroEventCarousel from "@/components/home/HeroEventCarousel";
import { API_ROUTES, EXTERNAL_URLS } from "@/lib/constants";
import { Event, Product, Livestream } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import SGFlyerLogoPng from "@/assets/SGFLYERLOGO.png";
import BrandVideo from "@/assets/videos/brand-video.mp4";

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
      {/* Interactive Event Carousel Hero */}
      {featuredEvents && featuredEvents.length > 0 ? (
        <HeroEventCarousel 
          events={featuredEvents}
          onGetTicket={handleGetTicket}
          className="-mx-3"
        />
      ) : eventsLoading ? (
        <div className="relative w-full h-screen bg-black flex items-center justify-center -mx-3">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-white text-lg">Loading events...</p>
          </div>
        </div>
      ) : (
        // Fallback hero with video for when no events are available
        <div className="relative w-full h-[100vh] overflow-hidden -mx-3">
          <div className="relative h-full">
            <div className="h-full w-full bg-black">
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
                  className="h-60 w-60 object-contain mb-12"
                />
                
                <h1 className="text-5xl md:text-7xl font-heading text-white uppercase tracking-wide mb-6 [text-shadow:_0_2px_5px_rgba(0,0,0,0.7)] text-center">
                  SAVAGE GENTLEMEN
                </h1>
                
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 uppercase tracking-widest [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)] text-center">
                  EVENTS · MERCHANDISE · LIVE STREAM · COMMUNITY
                </p>
                
                <div className="flex flex-col gap-4 mx-auto max-w-md px-6">
                  <Button 
                    className="btn-modern gradient-primary text-white px-8 py-6 uppercase tracking-widest text-lg font-semibold w-full border-0"
                    onClick={() => navigate('/events')}
                  >
                    VIEW EVENTS
                  </Button>
                  <Button 
                    className="btn-modern glass-effect border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 text-white hover:from-emerald-500/30 hover:to-purple-500/30 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-sm w-full"
                    onClick={() => navigate('/socaport-app')}
                    data-testid="button-passport-home"
                  >
                    🎫 GET YOUR SOCA PASSPORT
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
      )}

      {/* Brand Manifesto Section */}
      <section className="relative py-20 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Video Player */}
            <div className="relative group">
              <div className="aspect-video rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster={SGFlyerLogoPng}
                  playsInline
                  data-testid="brand-manifesto-video"
                >
                  <source src={BrandVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-600 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
            </div>

            {/* Manifesto Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <img 
                  src={SGFlyerLogoPng}
                  alt="SG Logo" 
                  className="w-20 h-20 object-contain"
                />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-wider text-white leading-tight">
                The Savage Gentlemen
                <span className="block mt-2 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  Experience
                </span>
              </h2>
              
              <p className="text-lg text-gray-300 leading-relaxed">
                We're more than events. We're a movement celebrating Caribbean-American culture through unforgettable experiences, authentic merchandise, and a vibrant community that lives for the moment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  className="btn-modern gradient-primary text-white px-6 py-6 uppercase tracking-widest text-sm font-semibold border-0"
                  onClick={() => navigate('/events')}
                  data-testid="brand-cta-events"
                >
                  EXPLORE EVENTS
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-modern glass-effect border-white/20 text-white hover:bg-white/10 px-6 py-6 uppercase tracking-widest text-sm font-semibold backdrop-blur-sm"
                  onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
                  data-testid="brand-cta-shop"
                >
                  SHOP COLLECTION
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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

            {/* Explore Merch Section */}
            {featuredProducts && featuredProducts.length > 0 && (
              <section className="py-20 bg-gradient-to-b from-black to-gray-900">
                <div className="text-center mb-12">
                  <div className="inline-block mb-6">
                    <img 
                      src={SGFlyerLogoPng}
                      alt="SG Logo" 
                      className="w-16 h-16 mx-auto object-contain"
                    />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-wider text-white mb-4">
                    EXPLORE MERCH
                  </h2>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                    Discover our exclusive collection of Caribbean-inspired clothing and accessories designed by Savage Gentlemen.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
                  {productsLoading 
                    ? Array(4).fill(0).map((_, i) => (
                        <div key={i} className="space-y-4">
                          <div className="bg-gray-800/50 animate-pulse h-64 w-full rounded-xl" />
                          <div className="bg-gray-800/50 animate-pulse h-4 w-3/4 rounded" />
                          <div className="bg-gray-800/50 animate-pulse h-4 w-1/2 rounded" />
                        </div>
                      ))
                    : featuredProducts.slice(0, 4).map((product, index) => (
                        <div 
                          key={product.id} 
                          className={`group bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-primary transition-all duration-300 hover:scale-105 animate-fade-in-up animate-delay-${(index + 1) * 100}`}
                          data-testid={`merch-product-${product.id}`}
                        >
                          <div className="aspect-square bg-gray-900 relative overflow-hidden">
                            <img
                              src={product.imageUrl || SGFlyerLogoPng}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = SGFlyerLogoPng;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Price overlay */}
                            <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full font-bold text-sm">
                              ${(product.price / 100).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {product.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {product.description || "Premium Caribbean-inspired design"}
                            </p>
                            
                            <Button
                              size="sm"
                              className="w-full bg-primary hover:bg-red-800 text-white font-medium uppercase tracking-wide transition-all duration-300"
                              onClick={() => handleAddToCart(product.id)}
                              data-testid={`add-to-cart-${product.id}`}
                            >
                              View Product
                            </Button>
                          </div>
                        </div>
                      ))
                  }
                </div>

                {/* Shop All Button */}
                <div className="text-center mt-12">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg uppercase tracking-wide font-semibold transition-all duration-300"
                    onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
                    data-testid="shop-all-products-button"
                  >
                    <ChevronRight className="mr-2 h-5 w-5" />
                    SHOP ALL PRODUCTS
                  </Button>
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
