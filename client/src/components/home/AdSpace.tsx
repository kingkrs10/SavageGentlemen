import { useState } from "react";
import { Link } from "wouter";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
}

const AdSpace = () => {
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  // Sample ad data - in a real app, this would come from your CMS or ad management system
  const ads: AdData[] = [
    {
      id: "sponsor-1",
      title: "Premium Sound Systems",
      description: "Experience crystal-clear audio at every event. Professional DJ equipment rentals available.",
      backgroundColor: "bg-gradient-to-r from-blue-600 to-purple-600",
      textColor: "text-white",
      ctaText: "Learn More",
      linkUrl: "#"
    },
    {
      id: "partner-1",
      title: "Caribbean Food Catering",
      description: "Authentic Caribbean cuisine for your next event. Book now for special rates!",
      backgroundColor: "bg-gradient-to-r from-orange-500 to-red-500",
      textColor: "text-white",
      ctaText: "Get Quote",
      linkUrl: "#"
    },
    {
      id: "event-promo",
      title: "Early Bird Special",
      description: "Save 25% on all event tickets when you book before the end of this month!",
      backgroundColor: "bg-gradient-to-r from-green-500 to-teal-500",
      textColor: "text-white",
      ctaText: "Save Now",
      linkUrl: "/events"
    }
  ];

  const visibleAds = ads.filter(ad => !dismissedAds.includes(ad.id));

  const dismissAd = (adId: string) => {
    setDismissedAds(prev => [...prev, adId]);
  };

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleAds.map((ad) => (
        <Card key={ad.id} className={`relative overflow-hidden border-0 ${ad.backgroundColor}`}>
          <CardContent className="p-6">
            <button
              onClick={() => dismissAd(ad.id)}
              className={`absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors ${ad.textColor}`}
              aria-label="Dismiss ad"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pr-8">
              <h3 className={`font-bold text-lg mb-2 ${ad.textColor}`}>
                {ad.title}
              </h3>
              <p className={`text-sm mb-4 opacity-90 ${ad.textColor}`}>
                {ad.description}
              </p>
              
              {ad.linkUrl && (
                <Link href={ad.linkUrl}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    {ad.ctaText || "Learn More"}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
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