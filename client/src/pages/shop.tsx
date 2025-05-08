import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ROUTES, PRODUCT_CATEGORIES, EXTERNAL_URLS } from "@/lib/constants";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, AlertCircle } from "lucide-react";
import ProductCard from "@/components/home/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Enhanced debugging query
  const { 
    data: products, 
    isLoading, 
    error, 
    isError 
  } = useQuery<Product[]>({
    queryKey: [API_ROUTES.PRODUCTS],
    onError: (err: any) => {
      console.error("Error fetching products:", err);
      setFetchError(err.message || "Failed to load products");
    }
  });
  
  // Added debugging useEffect
  useEffect(() => {
    console.log("Products data:", products);
    
    // Manual fetch for debugging
    const fetchProductsDirectly = async () => {
      try {
        const res = await fetch(API_ROUTES.PRODUCTS);
        const data = await res.json();
        console.log("Direct fetch products:", data);
      } catch (err) {
        console.error("Direct fetch error:", err);
      }
    };
    
    fetchProductsDirectly();
  }, [products]);
  
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

      {/* Debug Info */}
      {isError && (
        <div className="bg-red-900 text-white p-4 rounded-lg mb-4">
          <AlertCircle className="h-6 w-6 inline-block mr-2" />
          <span className="font-semibold">Error loading products:</span>
          <p className="mt-1">{fetchError || String(error)}</p>
        </div>
      )}
      
      {!isLoading && !isError && products && (
        <div className="bg-blue-900 text-white p-4 rounded-lg mb-4">
          <p className="font-semibold">Debug Info:</p>
          <p>Total products: {products.length}</p>
          <p>Categories: {products.map(p => p.category).join(', ')}</p>
        </div>
      )}
      
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
              {products && products.length > 0 
                ? "There are no products matching your filter. Try changing your selection."
                : "There are no products available. Products may not be loading from the database."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
