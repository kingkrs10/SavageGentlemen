import { useState, useEffect } from 'react';
import { getNormalizedImageUrl } from '@/lib/utils/image-utils';

/**
 * Component to test image loading with different approaches
 */
const ImageTest = () => {
  const [showImages, setShowImages] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const imageUrl = '/uploads/file-1746812099040-240616818.png';
  
  // Different image URL formats to test
  const testUrls = [
    { key: 'original', url: imageUrl, label: 'Original URL' },
    { key: 'normalized', url: getNormalizedImageUrl(imageUrl), label: 'Normalized URL' },
    { key: 'withoutSlash', url: imageUrl.substring(1), label: 'Without Leading Slash' },
    { key: 'absolute', url: `${window.location.origin}${imageUrl}`, label: 'Absolute URL' },
    { key: 'absoluteWithoutSlash', url: `${window.location.origin}${imageUrl.substring(1)}`, label: 'Absolute Without Leading Slash' }
  ];

  useEffect(() => {
    // Delay showing images to ensure component is mounted
    const timer = setTimeout(() => {
      setShowImages(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleImageError = (key: string) => {
    setImageError(prev => ({ ...prev, [key]: true }));
    console.error(`Failed to load image with approach: ${key}`);
  };
  
  const handleImageLoad = (key: string) => {
    console.log(`Successfully loaded image with approach: ${key}`);
  };

  return (
    <div className="p-4 mt-4 rounded-lg bg-gray-800/50">
      <h2 className="text-xl font-bold mb-4">Image Loading Test</h2>
      <p className="mb-4 text-sm opacity-70">Testing different approaches to load the same image</p>

      {showImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {testUrls.map(({ key, url, label }) => (
            <div key={key} className="flex flex-col">
              <p className="text-sm mb-2">{label}: <span className="text-xs bg-gray-700 p-1 rounded">{url}</span></p>
              <div className="h-[150px] bg-gray-900 rounded-lg overflow-hidden relative">
                <img
                  src={url}
                  alt={`Test ${label}`}
                  className={`w-full h-full object-contain ${imageError[key] ? 'hidden' : ''}`}
                  onError={() => handleImageError(key)}
                  onLoad={() => handleImageLoad(key)}
                />
                {imageError[key] && (
                  <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm">
                    Error Loading Image
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageTest;