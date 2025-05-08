import { useState } from "react";
import { ShoppingCart, Heart, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/types";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

interface ProductCardProps {
  product: Product;
  variant?: "small" | "large";
  onAddToCart?: (productId: number) => void;
  onAddToWishlist?: (productId: number) => void;
}

// Map of category to fallback image
const fallbackImages = {
  hats: "https://images.unsplash.com/photo-1576063945564-e8a1380e7148",
  hoodies: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633",
  "t-shirts": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
};

const ProductCard = ({ 
  product, 
  variant = "small",
  onAddToCart,
  onAddToWishlist
}: ProductCardProps) => {
  const { id, title, price, imageUrl, sizes, category } = product;
  const [imgError, setImgError] = useState(false);
  
  // Get fallback image based on category
  const getFallbackImage = () => {
    return fallbackImages[category as keyof typeof fallbackImages] || SGFlyerLogoPng;
  };

  if (variant === "large") {
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        <div className="relative">
          {imgError ? (
            <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
              <img 
                src={getFallbackImage()} 
                alt={title} 
                className="w-full h-48 object-cover"
                onError={() => console.log("Even fallback image failed to load")}
              />
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-48 object-cover" 
              onError={() => setImgError(true)}
            />
          )}
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
          <h3 className="font-semibold">{title}</h3>
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
            onClick={() => onAddToCart && onAddToCart(id)}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {imgError ? (
        <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
          <img 
            src={getFallbackImage()} 
            alt={title} 
            className="w-full h-40 object-cover"
            onError={() => console.log("Even fallback image failed to load")}
          />
        </div>
      ) : (
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-40 object-cover"
          onError={() => setImgError(true)}
        />
      )}
      <div className="p-3">
        <h3 className="text-md font-semibold truncate">{title}</h3>
        <div className="flex justify-between items-center mt-1">
          <span className="text-primary font-bold">{formatCurrency(price)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black text-white p-1 rounded-full h-8 w-8 flex items-center justify-center hover:bg-primary transition"
            onClick={() => onAddToCart && onAddToCart(id)}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
