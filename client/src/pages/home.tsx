import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/home/EventCard";
import ProductCard from "@/components/home/ProductCard";
import { API_ROUTES, EXTERNAL_URLS } from "@/lib/constants";
import { Event, Product, Livestream } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

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
    <div>
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        {eventsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : featuredEvents && featuredEvents.length > 0 ? (
          <div className="relative">
            <div className="h-64 relative">
              <div className="h-64 w-full bg-gray-800 flex items-center justify-center">
                <img 
                  src={SGFlyerLogoPng} 
                  alt="Savage Gentlemen" 
                  className="h-40 w-40 object-contain"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black bg-opacity-60"></div>
            </div>
            <div className="absolute bottom-0 left-0 p-4">
              <h2 className="text-3xl font-heading text-white">Upcoming Events</h2>
              <p className="text-lg text-gray-200">Stay tuned for tickets</p>
              <Button 
                className="mt-2 bg-primary text-white hover:bg-red-800 transition"
                onClick={() => window.location.href = '/events'}
              >
                View Events
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-900">
            <p className="text-gray-400">No featured events available</p>
          </div>
        )}
      </div>

      {/* Featured Events */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-heading">Upcoming Events</h2>
          <Link href="/events">
            <a className="text-primary font-semibold flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventsLoading ? (
            <>
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </>
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-8 bg-gray-800 rounded-xl">
              <img src={SGFlyerLogoPng} alt="Savage Gentlemen" className="w-32 h-32 mb-4" />
              <h3 className="text-xl font-bold text-white">Coming Soon</h3>
              <p className="text-gray-400 mb-2">Events will be announced soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Merchandise */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-heading">Shop Merchandise</h2>
          <Link href="/shop">
            <a className="text-primary font-semibold flex items-center">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {productsLoading ? (
            <>
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
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
            <p className="text-gray-400 col-span-3 text-center py-8">No merchandise found</p>
          )}
        </div>
      </section>

      {/* Live Now */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-heading">Live Now</h2>
          <Link href="/live">
            <a className="text-primary font-semibold flex items-center">
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
        
        {livestreamLoading ? (
          <Skeleton className="h-[250px] w-full rounded-xl" />
        ) : currentLivestream ? (
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="relative">
              {livestreamImgError ? (
                <div className="w-full h-56 bg-gray-800 flex items-center justify-center">
                  <img 
                    src={SGFlyerLogoPng} 
                    alt={currentLivestream.title}
                    className="h-32 w-32 object-contain"
                  />
                </div>
              ) : (
                <img 
                  src={currentLivestream.thumbnailUrl} 
                  alt={currentLivestream.title} 
                  className="w-full h-56 object-cover"
                  onError={() => setLivestreamImgError(true)}
                />
              )}
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="bg-black bg-opacity-50 px-4 py-2 rounded-full flex items-center">
                  <span className="animate-pulse inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                  <span className="text-white font-semibold">LIVE</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                  <h3 className="text-white text-xl font-bold">{currentLivestream.title}</h3>
                  <p className="text-sm text-gray-200">
                    {currentLivestream.viewerCount || 0} watching
                  </p>
                </div>
                <Link href="/live">
                  <a>
                    <Button className="bg-primary text-white hover:bg-red-800 transition">
                      Join Live
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No streams currently live</p>
            <Link href="/live">
              <a>
                <Button variant="outline">
                  Check Upcoming Streams
                </Button>
              </a>
            </Link>
          </div>
        )}
      </section>

      {/* Ad Banner */}
      <div className="relative rounded-xl overflow-hidden mb-8 shadow-lg bg-gradient-to-r from-primary to-black p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-xl font-heading text-white">Summer Collection</h3>
            <p className="text-sm text-gray-200 mb-3">Exclusive drops for Savage Gentlemen members</p>
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-gray-100 transition"
              onClick={() => window.open(EXTERNAL_URLS.ETSY_SHOP, '_blank', 'noopener,noreferrer')}
            >
              Shop Now
            </Button>
          </div>
          {adImgError ? (
            <div className="w-24 h-24 rounded-lg bg-gray-800 flex items-center justify-center">
              <img 
                src={SGFlyerLogoPng} 
                alt="Savage Gentlemen Collection" 
                className="h-16 w-16 object-contain"
              />
            </div>
          ) : (
            <img 
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f" 
              alt="Summer Collection" 
              className="w-24 h-24 rounded-lg object-cover"
              onError={() => setAdImgError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
