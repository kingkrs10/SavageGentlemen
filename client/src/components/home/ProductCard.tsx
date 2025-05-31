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
  const [imgSrc, setImgSrc] = useState<string>(imageUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Track product view and log product info for debugging
  useEffect(() => {
    console.log("Product rendering:", title, "Image URL:", imageUrl);
    // Track product view for analytics
    trackProductView(id);
  }, [title, imageUrl, id]);
  
  useEffect(() => {
    // Reset state when imageUrl changes
    setImgError(false);
    setImgSrc(imageUrl);
    setImgLoaded(false);
    
    // For external images, don't pre-test them as it may cause CORS issues
    // Let the img element handle loading directly
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
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <div className="relative">
          <Link href={`/product/${id}`} className="block">
            {imgError ? (
              <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                <img 
                  src={SGFlyerLogoPng} 
                  alt={title} 
                  className="h-32 object-contain"
                />
              </div>
            ) : (
              <img 
                src={imgSrc} 
                alt={title} 
                className="w-full h-48 object-cover" 
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-primary transition"
            onClick={() => onAddToWishlist && onAddToWishlist(id)}
          >
            <Heart className="w-4 h-4 text-white" />
          </Button>
        </div>
        <div className="p-4">
          <Link href={`/product/${id}`} className="block">
            <h3 className="font-semibold hover:text-primary transition">{title}</h3>
          </Link>
          <div className="flex justify-between items-center mt-2">
            <span className="text-primary font-bold">{formatCurrency(price)}</span>
            <div className="flex space-x-2">
              <span className="text-xs text-gray-400">
                {sizes && sizes.join(", ")}
              </span>
            </div>
          </div>
          <Button 
            className="w-full bg-primary text-white hover:bg-red-800 transition mt-3"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart && onAddToCart(id);
            }}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <Link 
        href={`/product/${id}`} 
        className="block" 
        onClick={() => trackProductDetailClick(id)}
      >
        {imgError ? (
          <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
            <img 
              src={SGFlyerLogoPng} 
              alt={title} 
              className="h-24 object-contain"
            />
          </div>
        ) : (
          <img 
            src={imgSrc} 
            alt={title} 
            className="w-full h-40 object-cover"
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
      </Link>
      <div className="p-3">
        <Link 
          href={`/product/${id}`} 
          className="block"
          onClick={() => trackProductDetailClick(id)}
        >
          <h3 className="text-md font-semibold truncate hover:text-primary transition">{title}</h3>
        </Link>
        <div className="flex justify-between items-center mt-1">
          <span className="text-primary font-bold">{formatCurrency(price)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black text-white p-1 rounded-full h-8 w-8 flex items-center justify-center hover:bg-primary transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart && onAddToCart(id);
            }}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
