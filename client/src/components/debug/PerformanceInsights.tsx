import { useState, useEffect } from "react";
import { performanceMonitor, type PerformanceMetrics } from "@/lib/utils/performance-monitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PerformanceInsights = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'production') {
      const interval = setInterval(() => {
        setMetrics(performanceMonitor.getMetrics());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  // Only render in development and when there are metrics
  if (process.env.NODE_ENV === 'production' || !metrics || metrics.totalImages === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg hover:bg-blue-700 transition-colors"
      >
        Performance {metrics.totalImages > 0 && `(${metrics.totalImages})`}
      </button>
      
      {isVisible && (
        <Card className="absolute bottom-12 right-0 w-80 bg-gray-900 border-gray-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Image Performance
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Images Loaded:</span>
              <Badge variant="secondary">{metrics.totalImages}</Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Avg Load Time:</span>
              <Badge variant="secondary">{metrics.averageLoadTime}ms</Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Compression Rate:</span>
              <Badge variant="secondary">{Math.round(metrics.compressionRatio * 100)}%</Badge>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Device Breakdown:</div>
              {Object.entries(metrics.deviceBreakdown).map(([device, count]) => (
                <div key={device} className="flex justify-between text-xs">
                  <span className="capitalize">{device}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => performanceMonitor.clearMetrics()}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs transition-colors"
            >
              Clear Metrics
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceInsights;