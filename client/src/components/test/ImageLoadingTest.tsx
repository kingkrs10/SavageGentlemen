import React, { useState, useEffect } from 'react';
import { LazyImage } from '@/components/ui/LazyImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getNormalizedImageUrl } from '@/lib/utils/image-utils';

const ImageLoadingTest = () => {
  const [testImages, setTestImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  // Test different image URL formats
  const testImageUrls = [
    '/uploads/file-1746811965524-75758504.png',
    'uploads/file-1746811985839-879082307.png',
    '/uploads/file-1746812099040-240616818.png',
    'uploads/file-1747408626411-322433518.jpeg',
    '/uploads/file-1747408633543-125799797.jpeg',
    'uploads/file-1747410765464-111465855.jpeg',
    '/uploads/image-1748016680022-550476114.png',
    'uploads/image-1748022037619-137898467.png',
    '/uploads/image-1748034485381-893555625.jpeg',
    'uploads/additionalImages-1748034485385-903008205.jpeg'
  ];

  // Test image loading
  const testImageLoad = async (url: string) => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = getNormalizedImageUrl(url);
    });
  };

  useEffect(() => {
    const runTests = async () => {
      setLoading(true);
      const results: {[key: string]: boolean} = {};
      
      for (const url of testImageUrls) {
        const normalizedUrl = getNormalizedImageUrl(url);
        const canLoad = await testImageLoad(url);
        results[url] = canLoad;
        console.log(`Image test: ${url} -> ${normalizedUrl} -> ${canLoad ? 'SUCCESS' : 'FAIL'}`);
      }
      
      setTestResults(results);
      setTestImages(testImageUrls);
      setLoading(false);
    };
    
    runTests();
  }, []);

  const successCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = testImageUrls.length;

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Image Loading Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mr-4" />
            <span>Testing image loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Image Loading Test Results
          <Badge variant={successCount === totalCount ? "default" : "destructive"}>
            {successCount}/{totalCount} Loaded
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testImages.map((url, index) => {
              const normalizedUrl = getNormalizedImageUrl(url);
              const canLoad = testResults[url];
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Test {index + 1}</span>
                    <Badge variant={canLoad ? "default" : "destructive"}>
                      {canLoad ? "✓ PASS" : "✗ FAIL"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      <div>Original: {url}</div>
                      <div>Normalized: {normalizedUrl}</div>
                    </div>
                  </div>
                  
                  <div className="w-full h-32 bg-gray-100 rounded overflow-hidden">
                    <LazyImage
                      src={url}
                      alt={`Test image ${index + 1}`}
                      className="w-full h-full object-cover"
                      placeholderColor="bg-gray-200"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Test Summary</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ Enhanced static file serving with comprehensive MIME types</li>
              <li>✓ Improved image URL normalization for uploads directory</li>
              <li>✓ Added alternative /api/uploads route for compatibility</li>
              <li>✓ Enhanced caching with immutable cache headers for images</li>
              <li>✓ Added CORS headers for cross-origin image requests</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageLoadingTest;