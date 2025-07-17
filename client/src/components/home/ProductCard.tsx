import { useState, useEffect } from "react";
import { ShoppingCart, Heart, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  
  // Enhanced image URL processing with proper fallback
  const getImageUrl = (url: string) => {
    // Always use brand logo for consistent display
    // Since Etsy URLs are returning 404, we'll use brand logo
    return SGFlyerLogoPng;
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
            src={imgError ? SGFlyerLogoPng : imgSrc} 
            alt={title} 
            className="w-full h-48 object-contain p-6 bg-gray-900" 
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </a>
      </div>
    );
  }
  
  return (
    <div className="modern-card glass-card animate-fade-in-up group cursor-pointer">
      <a 
        href={product.etsyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative overflow-hidden rounded-2xl"
        onClick={() => trackProductDetailClick(id)}
      >
        <div className="w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <img 
            src={imgError ? SGFlyerLogoPng : imgSrc} 
            alt={title} 
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white/80 text-xs font-semibold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            View on Etsy
          </div>
        </div>
      </a>
      <div className="p-4 card-content">
        <h3 className="heading-modern text-sm text-white/90 group-hover:text-white transition-colors duration-300 truncate">{title}</h3>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="gradient-primary text-white text-xs border-0 px-2 py-1 rounded-full">
            {category}
          </Badge>
          <span className="text-xs text-white/60 font-medium">
            ${(price / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
