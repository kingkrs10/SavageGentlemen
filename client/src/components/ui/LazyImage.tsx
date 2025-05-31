import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";
import { getOptimizedImageUrl, getDeviceInfo } from "@/lib/utils/image-compression";
import { measureImageLoad } from "@/lib/utils/performance-monitor";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loadingClassName?: string;
  placeholderColor?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  context?: 'thumbnail' | 'card' | 'hero' | 'gallery';
  adaptive?: boolean;
}

/**
 * LazyImage component for optimized image loading
 * - Only loads images when they come into viewport
 * - Shows a skeleton loader during loading
 * - Provides fallback for failed images
 * - Uses native browser lazy loading
 * - Automatically handles image URL normalization
 */
export function LazyImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  loadingClassName = "",
  placeholderColor = "bg-gray-800",
  objectFit = "cover",
  context = "card",
  adaptive = true
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  
  // Apply adaptive compression and normalize the image URL
  const deviceInfo = adaptive ? getDeviceInfo() : null;
  const optimizedSrc = adaptive && deviceInfo ? getOptimizedImageUrl(src, context, deviceInfo) : src;
  const normalizedSrc = currentSrc || getNormalizedImageUrl(optimizedSrc);
  
  // Use Intersection Observer to detect when image is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          // Once we've started loading the image, we can stop observing
          if (imgRef.current) {
            observer.unobserve(imgRef.current);
          }
        }
      },
      { rootMargin: "200px" } // Start loading when image is 200px from viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  // Reset component state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setAttemptedFallback(false);
    setCurrentSrc(null);
  }, [src]);

  // Handle image load success
  const onLoad = () => {
    // Only show logs in development to avoid console spam in production
    if (process.env.NODE_ENV !== 'production') {
      console.log("Image loaded successfully:", normalizedSrc);
    }
    
    // Track performance metrics for adaptive compression
    if (adaptive && deviceInfo) {
      measureImageLoad(normalizedSrc, context, true).catch(() => {
        // Silently handle measurement errors
      });
    }
    
    setIsLoaded(true);
  };

  // Handle image load error
  const onError = () => {
    // Only show error in development to avoid console spam in production
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error loading image:", normalizedSrc);
    }
    
    // Try alternative URL formats if this is a local upload and we haven't tried fallbacks yet
    if (src?.includes('uploads/') && !attemptedFallback) {
      setAttemptedFallback(true);
      
      // Try multiple alternative formats for better compatibility
      let alternativeSrc;
      if (src.startsWith('/uploads/')) {
        // Try without the leading slash
        alternativeSrc = src.substring(1);
      } else if (src.startsWith('uploads/')) {
        // Try with a leading slash
        alternativeSrc = `/${src}`;
      } else {
        // Try with uploads/ prefix
        alternativeSrc = `uploads/${src.replace(/^\/+/, '')}`;
      }
      
      setCurrentSrc(alternativeSrc);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log("Trying alternative image URL format:", alternativeSrc);
      }
      return;
    }
    
    setError(true);
    setIsLoaded(true); // Mark as loaded even though it's an error
  };

  // Compute object-fit style based on prop
  const objectFitClass = `object-${objectFit}`;

  // Log image source for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('LazyImage original src:', src);
    console.log('LazyImage normalized src:', normalizedSrc);
  }

  return (
    <div className="relative w-full h-full">
      {/* Show skeleton while loading */}
      {!isLoaded && (
        <Skeleton 
          className={`absolute inset-0 ${placeholderColor} ${loadingClassName}`}
        />
      )}
      
      {/* The actual image */}
      <img
        ref={imgRef}
        src={error && fallbackSrc ? fallbackSrc : (inView ? normalizedSrc : "")}
        alt={alt}
        className={`${className} ${objectFitClass} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={onLoad}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
}

export default LazyImage;