import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, PRODUCT_CATEGORIES, EXTERNAL_URLS } from "@/lib/constants";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import ProductCard from "@/components/home/ProductCard";
import { useToast } from "@/hooks/use-toast";

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS],
  });
  
  const filteredProducts = products?.filter(
    (product) => selectedCategory === "all" || product.category === selectedCategory
  );
  
  const featuredProduct = products?.find((product) => product.featured);
  
  const handleAddToCart = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`
      });
      
      // In a real app, this would add to cart
      // For now, we'll redirect to Etsy
      window.open(product.etsyUrl || EXTERNAL_URLS.ETSY_SHOP, "_blank");
    }
  };
  
  const handleAddToWishlist = (productId: number) => {
    toast({
      title: "Added to wishlist",
      description: "Product has been added to your wishlist."
    });
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  return (
    <div>
      {/* Featured Collection */}
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        {isLoading ? (
          <Skeleton className="w-full h-64" />
        ) : featuredProduct ? (
          <>
            <img 
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b" 
              alt="Caribbean Collection" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <Badge className="bg-primary text-white text-sm px-3 py-1 rounded-full mb-2 inline-block">
                New Arrival
              </Badge>
              <h2 className="text-3xl font-heading text-white">Summer Collection 2023</h2>
              <p className="text-lg text-gray-200 mb-4">Vibrant styles for the Caribbean soul</p>
              <a href={EXTERNAL_URLS.ETSY_SHOP} target="_blank" rel="noopener noreferrer">
                <Button className="bg-primary text-white hover:bg-red-800 transition">
                  Shop Collection
                </Button>
              </a>
            </div>
          </>
        ) : (
          <div className="bg-gray-900 h-64 flex items-center justify-center">
            <p className="text-gray-400">No featured collection available</p>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Shop Categories</h3>
          <Button 
            variant="link" 
            className="text-sm text-primary p-0 h-auto"
            onClick={() => setSelectedCategory("all")}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={
                selectedCategory === category.id 
                  ? "bg-primary text-white" 
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }
              size="sm"
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>
            <Skeleton className="w-full aspect-square" />
            <Skeleton className="w-full aspect-square" />
            <Skeleton className="w-full aspect-square" />
            <Skeleton className="w-full aspect-square" />
          </>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              variant="large"
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
            />
          ))
        ) : (
          <div className="text-center py-8 col-span-full">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-gray-400">
              There are no products matching your filter. Try changing your selection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
