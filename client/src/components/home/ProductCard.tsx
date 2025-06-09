import { useState, useEffect } from "react";
import { ShoppingCart, Heart, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";
import { Link } from "wouter";
import { trackProductView, trackProductDetailClick } from "@/lib/analytics";

interface ProductCardProps {
  product: Product;
  variant?: "small" | "large";
  onAddToCart?: (productId: number) => void;
  onAddToWishlist?: (productId: number) => void;
}

// Direct local imports of product images
const localImages = {
  "SGFlyerLogo": SGFlyerLogoPng,
};

const ProductCard = ({ 
  product, 
  variant = "small",
  onAddToCart,
  onAddToWishlist
}: ProductCardProps) => {
  const { id, title, price, imageUrl, sizes, category } = product;
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Use image proxy for external URLs to bypass CORS issues
  const getImageUrl = (url: string) => {
    if (!url) return SGFlyerLogoPng;
    if (url.startsWith('http')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };
  
  const imgSrc = getImageUrl(imageUrl);
  
  // Track product view and log product info for debugging
  useEffect(() => {
    console.log("Product rendering:", title, "Image URL:", imageUrl);
    trackProductView(id);
  }, [title, imageUrl, id]);
  
  useEffect(() => {
    // Reset state when imageUrl changes
    setImgError(false);
    setImgLoaded(false);
  }, [imageUrl]);

  const handleImageLoad = () => {
    console.log("Image loaded successfully:", imageUrl);
    setImgError(false);
    setImgLoaded(true);
  };

  const handleImageError = () => {
    console.log("Image failed to load:", imageUrl);
    setImgError(true);
    setImgLoaded(false);
  };
  
  if (variant === "large") {
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
        <a 
          href={product.etsyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block relative group-hover:scale-105 transition-transform duration-300"
        >
          <img 
            src={imgSrc} 
            alt={title} 
            className="w-full h-48 object-cover" 
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imgError ? 'none' : 'block' }}
          />
          {imgError && (
            <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
              <img 
                src={SGFlyerLogoPng} 
                alt={title} 
                className="h-32 object-contain"
              />
            </div>
          )}
        </a>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
      <a 
        href={product.etsyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative group-hover:scale-105 transition-transform duration-300"
        onClick={() => trackProductDetailClick(id)}
      >
        <img 
          src={imgSrc} 
          alt={title} 
          className="w-full h-40 object-cover"
          loading="lazy"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: imgError ? 'none' : 'block' }}
        />
        {imgError && (
          <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
            <img 
              src={SGFlyerLogoPng} 
              alt={title} 
              className="h-24 object-contain"
            />
          </div>
        )}
      </a>
    </div>
  );
};

export default ProductCard;
