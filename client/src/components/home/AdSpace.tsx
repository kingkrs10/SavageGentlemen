import { useState } from "react";
import { Link } from "wouter";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  logoUrl?: string;
  type?: 'standard' | 'banner' | 'product' | 'video' | 'event';
  videoUrl?: string;
  price?: string;
  eventDate?: string;
  location?: string;
}

const AdSpace = () => {
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  // Fetch active sponsored content from database
  const { data: sponsoredContent = [], isLoading } = useQuery({
    queryKey: ['/api/sponsored-content/active'],
    queryFn: () => apiRequest('GET', '/api/sponsored-content/active').then(res => res.json())
  });

  // Convert database ads to AdData format
  const ads: AdData[] = sponsoredContent.map((ad: any) => ({
    id: ad.id.toString(),
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl,
    backgroundColor: ad.backgroundColor || 'bg-gray-800',
    textColor: ad.textColor || 'text-white',
    ctaText: ad.ctaText || 'Learn More',
    logoUrl: ad.logoUrl,
    type: ad.type,
    videoUrl: ad.videoUrl,
    price: ad.price,
    eventDate: ad.eventDate,
    location: ad.location
  }));

  // Fallback placeholder ads only if no database content
  const placeholderAds: AdData[] = [
    // Standard ad
    {
      id: "sponsor-1",
      type: "standard",
      title: "Premium Sound Systems",
      description: "Experience crystal-clear audio at every event. Professional DJ equipment rentals available.",
      backgroundColor: "bg-gradient-to-r from-blue-600 to-purple-600",
      textColor: "text-white",
      ctaText: "Learn More",
      linkUrl: "#"
    },
    // Banner ad with background image
    {
      id: "banner-1",
      type: "banner",
      title: "Caribbean Food Festival",
      description: "Join us for authentic flavors and live music this weekend!",
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
      backgroundColor: "bg-black/60",
      textColor: "text-white",
      ctaText: "Get Tickets",
      linkUrl: "#",
      eventDate: "June 15-16, 2025",
      location: "Downtown Park"
    },
    // Product showcase ad
    {
      id: "product-1",
      type: "product",
      title: "Limited Edition SG Merchandise",
      description: "Exclusive collection available for a limited time only.",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
      backgroundColor: "bg-gradient-to-r from-purple-600 to-pink-600",
      textColor: "text-white",
      ctaText: "Shop Now",
      linkUrl: "#",
      price: "$29.99"
    },
    // Event promotion ad
    {
      id: "event-1",
      type: "event",
      title: "Soca Night 2025",
      description: "The biggest soca party of the year featuring top Caribbean artists.",
      imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=400&fit=crop",
      backgroundColor: "bg-gradient-to-r from-orange-500 to-red-500",
      textColor: "text-white",
      ctaText: "Buy Tickets",
      linkUrl: "/events",
      eventDate: "July 4, 2025",
      location: "Convention Center"
    }
  ];

  // Use real ads if available, otherwise show nothing during loading
  const displayAds = ads.length > 0 ? ads : (isLoading ? [] : placeholderAds.slice(0, 1));

  const visibleAds = displayAds.filter(ad => !dismissedAds.includes(ad.id));

  const dismissAd = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
  };

  // Track ad clicks
  const trackAdClick = async (adId: string) => {
    try {
      await apiRequest('POST', `/api/sponsored-content/${adId}/click`);
    } catch (error) {
      console.error('Failed to track ad click:', error);
    }
  };

  const renderAdContent = (ad: AdData) => {
    switch (ad.type) {
      case 'banner':
        return (
          <div className="relative h-48 overflow-hidden rounded-lg">
            {ad.imageUrl && (
              <img 
                src={ad.imageUrl} 
                alt={ad.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className={`absolute inset-0 ${ad.backgroundColor} flex items-center`}>
              <div className="p-6 w-full">
                <h3 className={`font-bold text-2xl mb-2 ${ad.textColor}`}>
                  {ad.title}
                </h3>
                <p className={`text-base mb-3 opacity-90 ${ad.textColor}`}>
                  {ad.description}
                </p>
                {ad.eventDate && (
                  <p className={`text-sm mb-2 opacity-80 ${ad.textColor}`}>
                    📅 {ad.eventDate} • 📍 {ad.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'product':
        return (
          <div className={`${ad.backgroundColor} rounded-lg overflow-hidden`}>
            <div className="flex">
              {ad.imageUrl && (
                <div className="w-32 h-32 flex-shrink-0">
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1">
                <h3 className={`font-bold text-lg mb-2 ${ad.textColor}`}>
                  {ad.title}
                </h3>
                <p className={`text-sm mb-2 opacity-90 ${ad.textColor}`}>
                  {ad.description}
                </p>
                {ad.price && (
                  <p className={`text-xl font-bold mb-2 ${ad.textColor}`}>
                    {ad.price}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="relative overflow-hidden rounded-lg">
            {ad.imageUrl && (
              <div className="h-32 relative">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 ${ad.backgroundColor}`}></div>
              </div>
            )}
            <div className={`${!ad.imageUrl ? ad.backgroundColor : 'bg-gray-900'} p-4`}>
              <h3 className={`font-bold text-lg mb-2 ${ad.textColor}`}>
                {ad.title}
              </h3>
              <p className={`text-sm mb-3 opacity-90 ${ad.textColor}`}>
                {ad.description}
              </p>
              <div className="flex justify-between text-sm">
                {ad.eventDate && (
                  <span className={`opacity-80 ${ad.textColor}`}>
                    📅 {ad.eventDate}
                  </span>
                )}
                {ad.location && (
                  <span className={`opacity-80 ${ad.textColor}`}>
                    📍 {ad.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      default: // standard
        return (
          <div className={`${ad.backgroundColor} p-6 rounded-lg ${ad.textColor} relative`}>
            {ad.logoUrl && (
              <div className="mb-3">
                <img 
                  src={ad.logoUrl} 
                  alt={`${ad.title} logo`}
                  className="h-8 object-contain"
                />
              </div>
            )}
            <h3 className={`font-bold text-lg mb-2 ${ad.textColor}`}>
              {ad.title}
            </h3>
            <p className={`text-sm mb-4 opacity-90 ${ad.textColor}`}>
              {ad.description}
            </p>
          </div>
        );
    }
  };

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleAds.map((ad) => (
        <Card key={ad.id} className="relative overflow-hidden border-0 bg-transparent">
          <CardContent className="p-0">
            <button
              onClick={() => dismissAd(ad.id)}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-white"
              aria-label="Dismiss ad"
            >
              <X className="w-4 h-4" />
            </button>
            
            {renderAdContent(ad)}
            
            {ad.linkUrl && (
              <div className="p-4 bg-gray-900">
                <Link href={ad.linkUrl}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full"
                    onClick={() => trackAdClick(ad.id)}
                  >
                    {ad.ctaText || "Learn More"}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* Ad space placeholder for future ads */}
      <Card className="border-2 border-dashed border-gray-600 bg-gray-900/50">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400">
            <div className="text-sm font-medium mb-2">Sponsored Content</div>
            <div className="text-xs">
              Advertise your business here
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdSpace;