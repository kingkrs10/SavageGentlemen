// Image compression utilities for adaptive loading based on device and connection

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  connectionSpeed?: 'slow' | 'fast' | 'unknown';
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  devicePixelRatio: number;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  screenWidth: number;
  screenHeight: number;
}

// Detect device type and capabilities
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth <= 1024);
  const isDesktop = !isMobile && !isTablet;
  
  // Detect connection speed using Network Information API if available
  let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionSpeed = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }
  }
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    devicePixelRatio: window.devicePixelRatio || 1,
    connectionSpeed,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  };
}

// Generate optimized image parameters based on device and context
export function getOptimizedImageParams(
  originalUrl: string,
  context: 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card',
  deviceInfo?: DeviceInfo
): ImageCompressionOptions {
  const device = deviceInfo || getDeviceInfo();
  
  // Base compression settings by context
  const contextSettings = {
    thumbnail: { maxWidth: 150, maxHeight: 150, quality: 70 },
    card: { maxWidth: 400, maxHeight: 300, quality: 80 },
    hero: { maxWidth: 1920, maxHeight: 1080, quality: 85 },
    gallery: { maxWidth: 800, maxHeight: 600, quality: 82 }
  };
  
  let settings = { ...contextSettings[context] };
  
  // Adjust for mobile devices
  if (device.isMobile) {
    settings.quality = Math.max(settings.quality - 15, 60);
    settings.maxWidth = Math.min(settings.maxWidth, device.screenWidth * device.devicePixelRatio);
    settings.maxHeight = Math.min(settings.maxHeight, device.screenHeight * device.devicePixelRatio);
  }
  
  // Adjust for slow connections
  if (device.connectionSpeed === 'slow') {
    settings.quality = Math.max(settings.quality - 20, 50);
    settings.maxWidth = Math.round(settings.maxWidth * 0.7);
    settings.maxHeight = Math.round(settings.maxHeight * 0.7);
  }
  
  // Use WebP format if supported
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();
  
  return {
    ...settings,
    format: supportsWebP ? 'webp' : 'jpeg',
    deviceType: device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop',
    connectionSpeed: device.connectionSpeed
  };
}

// Generate optimized image URL with compression parameters
export function getOptimizedImageUrl(
  originalUrl: string,
  context: 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card',
  deviceInfo?: DeviceInfo
): string {
  // For external URLs (like Etsy), we can't compress server-side
  // but we can add URL parameters for services that support it
  if (originalUrl.startsWith('http')) {
    const params = getOptimizedImageParams(originalUrl, context, deviceInfo);
    
    // For Etsy images, we can modify the URL to get different sizes
    if (originalUrl.includes('etsystatic.com')) {
      // Etsy image URLs can be modified by changing the size parameter
      const device = deviceInfo || getDeviceInfo();
      let sizeParam = 'il_794xN'; // Default size
      
      if (context === 'thumbnail' || device.isMobile) {
        sizeParam = 'il_340x270'; // Smaller for thumbnails/mobile
      } else if (context === 'card') {
        sizeParam = 'il_570xN'; // Medium for cards
      }
      
      return originalUrl.replace(/il_\d+x[^\./]+/, sizeParam);
    }
    
    return originalUrl;
  }
  
  // For local images, return the original URL
  // In a production environment, you might implement server-side compression
  return originalUrl;
}

// Preload critical images with appropriate compression
export function preloadCriticalImages(urls: string[], context: 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card') {
  const deviceInfo = getDeviceInfo();
  
  urls.forEach(url => {
    const optimizedUrl = getOptimizedImageUrl(url, context, deviceInfo);
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    document.head.appendChild(link);
  });
}

// Lazy loading with intersection observer and adaptive compression
export function createAdaptiveImageLoader(
  img: HTMLImageElement,
  src: string,
  context: 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card'
) {
  const deviceInfo = getDeviceInfo();
  const optimizedSrc = getOptimizedImageUrl(src, context, deviceInfo);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = optimizedSrc;
        observer.unobserve(img);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  observer.observe(img);
  
  return () => observer.disconnect();
}

// Progressive image loading with blur-up effect
export function createProgressiveImageLoader(
  container: HTMLElement,
  src: string,
  context: 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card'
) {
  const deviceInfo = getDeviceInfo();
  
  // Create low-quality placeholder
  const placeholder = document.createElement('img');
  placeholder.style.filter = 'blur(5px)';
  placeholder.style.transition = 'filter 0.3s';
  
  // Create high-quality image
  const highQualityImg = new Image();
  const optimizedSrc = getOptimizedImageUrl(src, context, deviceInfo);
  
  highQualityImg.onload = () => {
    placeholder.src = optimizedSrc;
    placeholder.style.filter = 'blur(0)';
  };
  
  // Load placeholder first (smaller, lower quality)
  const placeholderSrc = getOptimizedImageUrl(src, 'thumbnail', deviceInfo);
  placeholder.src = placeholderSrc;
  container.appendChild(placeholder);
  
  // Start loading high-quality image
  highQualityImg.src = optimizedSrc;
  
  return placeholder;
}