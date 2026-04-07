"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Ad } from "@/lib/types";
import { X, ExternalLink } from "lucide-react";

export default function GlobalAdBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    const { data: ads, isLoading } = useQuery<Ad[]>({
        queryKey: ['/api/ads'],
        queryFn: () => apiRequest('GET', '/api/ads').then(res => res.json()),
        // Refetch occasionally to keep ads fresh without reloading
        refetchInterval: 1000 * 60 * 5, // 5 minutes
    });

    // Rotate ads if there are multiple active ads
    useEffect(() => {
        if (ads && ads.length > 1) {
            const interval = setInterval(() => {
                setCurrentAdIndex((prev) => (prev + 1) % ads.length);
            }, 10000); // rotate every 10 seconds
            return () => clearInterval(interval);
        }
    }, [ads]);

    if (isLoading || !ads || ads.length === 0 || !isVisible) {
        return null;
    }

    const currentAd = ads[currentAdIndex];

    return (
        <div className="relative w-full bg-black border-b border-primary/20 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-primary/10 to-transparent pointer-events-none z-0" />

            <a
                href={currentAd.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full min-h-[60px] md:min-h-[80px] hover:bg-white/5 transition-colors relative z-10"
            >
                {/* Visual content container */}
                <div className="w-full h-full absolute inset-0 text-center opacity-80 group-hover:opacity-100 transition-opacity flex justify-center items-center overflow-hidden">
                    {currentAd.imageUrl ? (
                        <img
                            src={currentAd.imageUrl}
                            alt={currentAd.title}
                            className="w-full h-full object-cover blur-sm opacity-30 md:hidden"
                        />
                    ) : null}
                    {currentAd.imageUrl ? (
                        <img
                            src={currentAd.imageUrl}
                            alt={currentAd.title}
                            className="hidden md:block h-full max-w-full object-contain"
                        />
                    ) : null}
                </div>

                {/* Text overlay for fallback/extra info */}
                <div className="relative z-20 flex items-center justify-center gap-4 px-4 py-2 w-full max-w-7xl mx-auto">
                    {!currentAd.imageUrl && (
                        <div className="flex-1 text-center">
                            <span className="text-white font-heading uppercase tracking-widest text-sm md:text-base font-bold drop-shadow-md">
                                {currentAd.title}
                            </span>
                        </div>
                    )}

                    {/* Always show "Learn More" call to action to make it obvious it's clickable if the image isn't obvious */}
                    <div className="hidden md:flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs bg-black/50 px-3 py-1.5 rounded backdrop-blur-sm border border-primary/30 group-hover:border-primary/80 transition-colors ml-auto">
                        Learn More <ExternalLink className="w-3 h-3" />
                    </div>
                </div>
            </a>

            {/* Dismiss button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsVisible(false);
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Dismiss Ad"
            >
                <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Progress indicator for multi-ad rotation */}
            {ads.length > 1 && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-full z-20">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${((currentAdIndex + 1) / ads.length) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
