import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loadingClassName?: string;
  placeholderColor?: string;
}

/**
 * LazyImage component for optimized image loading
 * - Only loads images when they come into viewport
 * - Shows a skeleton loader during loading
 * - Provides fallback for failed images
 * - Uses native browser lazy loading
 */
export function LazyImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  loadingClassName = "",
  placeholderColor = "bg-gray-800"
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  
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

  // Handle image load success
  const onLoad = () => {
    console.log("Image loaded successfully:", src);
    setIsLoaded(true);
  };

  // Handle image load error
  const onError = () => {
    console.error("Error loading image:", src);
    setError(true);
    setIsLoaded(true); // Mark as loaded even though it's an error
  };

  return (
    <div className="relative">
      {/* Show skeleton while loading */}
      {!isLoaded && (
        <Skeleton 
          className={`absolute inset-0 ${placeholderColor} ${loadingClassName}`}
        />
      )}
      
      {/* The actual image */}
      <img
        ref={imgRef}
        src={error && fallbackSrc ? fallbackSrc : (inView ? src : "")}
        alt={alt}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={onLoad}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
}

export default LazyImage;