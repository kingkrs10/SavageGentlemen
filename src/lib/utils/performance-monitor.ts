// Performance monitoring for adaptive image compression

export interface ImageLoadMetrics {
  url: string;
  loadTime: number;
  size: number;
  compressionUsed: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  context: 'thumbnail' | 'card' | 'hero' | 'gallery';
}

export interface PerformanceMetrics {
  totalImages: number;
  averageLoadTime: number;
  totalDataSaved: number;
  compressionRatio: number;
  deviceBreakdown: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: ImageLoadMetrics[] = [];
  private enabled: boolean = true;

  public trackImageLoad(metrics: ImageLoadMetrics) {
    if (!this.enabled) return;

    this.metrics.push({
      ...metrics,
      loadTime: Math.round(metrics.loadTime)
    });

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  public getMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        totalImages: 0,
        averageLoadTime: 0,
        totalDataSaved: 0,
        compressionRatio: 0,
        deviceBreakdown: {}
      };
    }

    const totalImages = this.metrics.length;
    const averageLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / totalImages;
    
    const deviceBreakdown = this.metrics.reduce((acc, m) => {
      acc[m.deviceType] = (acc[m.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const compressedImages = this.metrics.filter(m => m.compressionUsed);
    const compressionRatio = compressedImages.length / totalImages;

    return {
      totalImages,
      averageLoadTime: Math.round(averageLoadTime),
      totalDataSaved: 0, // Would need server-side tracking for accurate data
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      deviceBreakdown
    };
  }

  public disable() {
    this.enabled = false;
  }

  public enable() {
    this.enabled = true;
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper function to measure image load time
export function measureImageLoad(
  src: string,
  context: 'thumbnail' | 'card' | 'hero' | 'gallery',
  compressionUsed: boolean = false
): Promise<ImageLoadMetrics> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      const deviceInfo = getDeviceInfo();
      
      const metrics: ImageLoadMetrics = {
        url: src,
        loadTime,
        size: 0, // Would need additional logic to get actual file size
        compressionUsed,
        deviceType: deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop',
        connectionSpeed: deviceInfo.connectionSpeed,
        context
      };
      
      performanceMonitor.trackImageLoad(metrics);
      resolve(metrics);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
}

// Get device info helper (simplified version for performance monitor)
function getDeviceInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || (window.innerWidth >= 768 && window.innerWidth <= 1024);
  
  let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionSpeed = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }
  }
  
  return { isMobile, isTablet, connectionSpeed };
}