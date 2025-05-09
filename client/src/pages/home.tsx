import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/home/EventCard";
import ProductCard from "@/components/home/ProductCard";
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
      <div className="relative w-full h-[90vh] mb-16 overflow-hidden -mx-3">
        {eventsLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <div className="relative h-full">
            {/* Hero Background with Video */}
            <div className="h-full w-full bg-black">
              <video 
                className="w-full h-full object-cover absolute inset-0 opacity-80"
                autoPlay 
                muted 
                loop
                playsInline
              >
                <source src={IntroVideo} type="video/mp4" />
              </video>
              
              {/* Overlay and Logo */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black z-10 flex flex-col items-center justify-center">
                <img 
                  src={SGFlyerLogoPng} 
                  alt="Savage Gentlemen" 
                  className="h-60 w-60 object-contain opacity-90 animate-pulse mb-12"
                />
                
                {/* Action Buttons below Logo */}
                <div className="flex flex-col gap-4 max-w-md w-full px-6">
                  <Button 
                    className="bg-primary hover:bg-primary/80 text-white px-8 py-6 uppercase tracking-widest text-lg font-semibold shadow-xl w-full"
                    onClick={() => window.location.href = '/events'}
                  >
                    VIEW EVENTS
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/20 px-8 py-6 uppercase tracking-widest text-lg font-semibold backdrop-blur-sm shadow-xl w-full"
                    onClick={() => window.location.href = '/shop'}
                  >
                    SHOP COLLECTION
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Hero Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-heading text-white uppercase tracking-wide mb-6 [text-shadow:_0_2px_5px_rgba(0,0,0,0.7)]">
                Savage Gentlemen
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8 uppercase tracking-widest [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
                Events · Merchandise · Live Stream · Community
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hero Call-to-action Buttons */}
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-4 justify-center animate-fade-in">
        <Button 
          className="bg-primary hover:bg-primary/80 text-white uppercase tracking-widest px-8 py-6 text-lg w-full md:w-auto"
          onClick={() => navigate('/events')}
        >
          Explore Events
        </Button>
        <Button 
          className="border-white bg-transparent hover:bg-white/10 text-white uppercase tracking-widest px-8 py-6 text-lg w-full md:w-auto"
          onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
        >
          Shop Collection
        </Button>
      </div>

      {/* Content Sections with Full-Width Dividers */}
      <div className="space-y-20">
        {/* Featured Events Section */}
        <section>
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-heading uppercase tracking-wider mb-4">Upcoming Events</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {eventsLoading ? (
              <>
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </>
            ) : (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 border border-white/10">
                <img src={SGFlyerLogoPng} alt="Savage Gentlemen" className="w-40 h-40 mb-6 opacity-70" />
                <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Coming Soon</h3>
                <p className="text-white/60 uppercase tracking-widest text-sm mb-6">Events will be announced soon</p>
                <Button 
                  className="bg-primary hover:bg-primary/80 text-white uppercase tracking-widest px-6"
                  onClick={() => window.location.href = '/events'}
                >
                  Stay Updated
                </Button>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/events" className="text-white hover:text-primary uppercase tracking-widest text-sm font-semibold inline-flex items-center">
              View All Events <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </section>

        {/* Featured Merchandise Section */}
        <section>
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-heading uppercase tracking-wider mb-4">Shop Merchandise</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productsLoading ? (
              <>
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 3).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))
            ) : (
              <div className="col-span-1 md:col-span-3 text-center py-16 border border-white/10">
                <p className="text-white/60 uppercase tracking-widest">No merchandise found</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/shop" className="text-white hover:text-primary uppercase tracking-widest text-sm font-semibold inline-flex items-center">
              View All Products <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </section>

        {/* Live Stream Section */}
        <section>
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-heading uppercase tracking-wider mb-4">Live Broadcast</h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
          </div>
          
          {livestreamLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : currentLivestream ? (
            <div className="border border-white/10 overflow-hidden">
              <div className="relative">
                {livestreamImgError ? (
                  <div className="w-full h-80 bg-black flex items-center justify-center">
                    <img 
                      src={SGFlyerLogoPng} 
                      alt={currentLivestream.title}
                      className="h-40 w-40 object-contain opacity-70"
                    />
                  </div>
                ) : (
                  <img 
                    src={currentLivestream.thumbnailUrl} 
                    alt={currentLivestream.title} 
                    className="w-full h-80 object-cover"
                    onError={() => setLivestreamImgError(true)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black"></div>
                
                <div className="absolute top-4 left-4">
                  <div className="px-4 py-2 flex items-center bg-primary">
                    <span className="animate-pulse inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
                    <span className="text-white text-xs uppercase tracking-widest font-semibold">Live Now</span>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-heading text-white uppercase tracking-widest mb-2">{currentLivestream.title}</h3>
                  <p className="text-white/70 mb-6 uppercase tracking-widest text-xs">
                    {currentLivestream.viewerCount || 0} watching
                  </p>
                  <Link href="/live">
                    <Button className="bg-primary hover:bg-primary/80 text-white px-6 uppercase tracking-widest text-sm">
                      Watch Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 p-16 text-center">
              <p className="text-white/60 uppercase tracking-widest mb-6">No streams currently live</p>
              <Link href="/live">
                <Button className="border-white text-white hover:bg-white/10 uppercase tracking-widest">
                  Check Upcoming Streams
                </Button>
              </Link>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link href="/live" className="text-white hover:text-primary uppercase tracking-widest text-sm font-semibold inline-flex items-center">
              View All Broadcasts <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </section>

        {/* Shop Banner */}
        <section className="py-16 mb-8 border-y border-white/10">
          <div className="flex flex-col md:flex-row items-center md:items-stretch">
            <div className="text-center md:text-left md:w-2/3 flex flex-col justify-center mb-6 md:mb-0 md:pr-10">
              <h3 className="text-3xl font-heading uppercase tracking-wider mb-4">Limited Edition</h3>
              <p className="text-white/70 uppercase tracking-widest mb-8 text-sm">
                Exclusive collection for Savage Gentlemen members.<br />
                Limited quantities available.
              </p>
              <div>
                <Button 
                  className="bg-primary hover:bg-primary/80 text-white px-8 uppercase tracking-widest"
                  onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
                >
                  Shop Now
                </Button>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <div className="w-60 h-60 border border-white/10 flex items-center justify-center">
                <img 
                  src={SGFlyerLogoPng} 
                  alt="Savage Gentlemen Collection" 
                  className="h-40 w-40 object-contain opacity-70"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
