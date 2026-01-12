import { useState, useEffect, useRef } from "react";
import { getOptimizedImageUrl, getDeviceInfo, createAdaptiveImageLoader } from "@/lib/utils/image-compression";
import { cn } from "@/lib/utils";

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  context?: 'thumbnail' | 'card' | 'hero' | 'gallery';
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: () => void;
  progressive?: boolean;
}

const AdaptiveImage = ({
  src,
  alt,
  className,
  context = 'card',
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError,
  progressive = true
}: AdaptiveImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHighQuality, setShowHighQuality] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deviceInfo = getDeviceInfo();
    
    if (progressive && context !== 'thumbnail') {
      // Load low-quality placeholder first
      const placeholderSrc = getOptimizedImageUrl(src, 'thumbnail', deviceInfo);
      setImageSrc(placeholderSrc);
      
      // Preload high-quality image
      const highQualityImg = new Image();
      const optimizedSrc = getOptimizedImageUrl(src, context, deviceInfo);
      
      highQualityImg.onload = () => {
        setImageSrc(optimizedSrc);
        setShowHighQuality(true);
        setIsLoading(false);
        onLoad?.();
      };
      
      highQualityImg.onerror = () => {
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
          setShowHighQuality(true);
        } else {
          setHasError(true);
        }
        setIsLoading(false);
        onError?.();
      };
      
      highQualityImg.src = optimizedSrc;
    } else {
      // Direct loading for thumbnails or when progressive is disabled
      const optimizedSrc = getOptimizedImageUrl(src, context, deviceInfo);
      setImageSrc(optimizedSrc);
    }
  }, [src, context, progressive, fallbackSrc, onLoad, onError]);

  useEffect(() => {
    if (loading === 'lazy' && imgRef.current && !progressive) {
      const cleanup = createAdaptiveImageLoader(imgRef.current, src, context);
      return cleanup;
    }
  }, [src, context, loading, progressive]);

  const handleImageLoad = () => {
    if (!progressive) {
      setIsLoading(false);
      setShowHighQuality(true);
      onLoad?.();
    }
  };

  const handleImageError = () => {
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "bg-gray-800 flex items-center justify-center text-gray-400",
          className
        )}
      >
        <div className="text-center p-4">
          <div className="text-sm">Image unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {isLoading && progressive && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          !showHighQuality && progressive && "filter blur-sm scale-105",
          showHighQuality && "filter-none scale-100"
        )}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {isLoading && !progressive && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
    </div>
  );
};

export default AdaptiveImage;