import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";

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
 * LazyImage component for optimized, resilient image loading.
 * - Uses native browser lazy loading (never sets broken empty string src)
 * - Fades in gracefully when loaded
 * - Checks cached images on mount to avoid stuck skeleton state
 * - Automatically falls back to fallbackSrc only if primary URL fails
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
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Determine the final source URL to use
  const targetRaw = currentSrc || src || fallbackSrc || '';
  const finalSrc = getNormalizedImageUrl(targetRaw);

  // Reset component state when the primary source prop changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setAttemptedFallback(false);
    setCurrentSrc(null);
  }, [src]);

  // Check if image is already cached/complete on mount or when finalSrc changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && finalSrc) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  }, [finalSrc]);

  // Handle image load success
  const onLoad = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log("Image loaded successfully:", finalSrc);
    }
    setIsLoaded(true);
    setError(false);
  };

  // Handle image load error
  const onError = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error loading image:", finalSrc);
    }

    // Try alternative URL formats if this is a local upload and we haven't tried fallbacks yet
    if (src?.includes('uploads/') && !attemptedFallback) {
      setAttemptedFallback(true);
      let alternativeSrc;
      if (src.startsWith('/uploads/')) {
        alternativeSrc = src.substring(1);
      } else if (src.startsWith('uploads/')) {
        alternativeSrc = `/${src}`;
      } else {
        alternativeSrc = `uploads/${src.replace(/^\/+/, '')}`;
      }
      setCurrentSrc(alternativeSrc);
      return;
    }

    // If fallbackSrc is available and hasn't been used yet, switch to it
    const normalizedFallback = fallbackSrc ? getNormalizedImageUrl(fallbackSrc) : '';
    if (fallbackSrc && currentSrc !== fallbackSrc && finalSrc !== normalizedFallback) {
      setCurrentSrc(fallbackSrc);
      setIsLoaded(false);
      return;
    }

    // Both primary and fallback failed (or no fallback)
    setError(true);
    setIsLoaded(true);
  };

  // Guard against completely empty src and no fallback
  if (!finalSrc && !fallbackSrc) {
    return (
      <div className={`relative w-full h-full ${placeholderColor}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
      </div>
    );
  }

  // Compute object-fit style based on prop
  const objectFitClass = `object-${objectFit}`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Show skeleton while loading */}
      {!isLoaded && !error && (
        <Skeleton
          className={`absolute inset-0 ${placeholderColor} ${loadingClassName}`}
        />
      )}

      {/* Show placeholder if error and NO working fallback */}
      {error && (
        <div className={`absolute inset-0 ${placeholderColor} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        </div>
      )}

      {/* The actual image */}
      {!error && finalSrc && (
        <img
          ref={imgRef}
          src={finalSrc}
          alt={alt}
          className={`${className} ${objectFitClass} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          onLoad={onLoad}
          onError={onError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

export default LazyImage;