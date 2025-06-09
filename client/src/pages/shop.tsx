import { useState, useEffect } from "react";
import { API_ROUTES, PRODUCT_CATEGORIES, EXTERNAL_URLS } from "@/lib/constants";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, AlertCircle, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SGFlyerLogoPng from "@assets/SGFLYERLOGO.png";

// Simplified direct product card component
const SimpleProductCard = ({ product, onAddToCart }: { 
  product: Product; 
  onAddToCart: (id: number) => void;
}) => {
  // Use image proxy for external URLs to bypass CORS issues
  const getImageUrl = (url: string) => {
    if (!url) return SGFlyerLogoPng;
    if (url.startsWith('http')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };
  
  const imageUrl = getImageUrl(product.imageUrl);
  const [imgError, setImgError] = useState(false);
  
  console.log('Product rendering:', product.title, 'Image URL:', imageUrl);
  
  return (
    <div className="group bg-black rounded-xl overflow-hidden shadow-xl border border-gray-800 transition-all hover:border-primary hover:shadow-primary/20 h-full flex flex-col">
      <div className="relative h-72 bg-gray-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-50 transition-opacity z-10"></div>
        <img 
          src={!imgError && product.imageUrl ? product.imageUrl : SGFlyerLogoPng} 
          alt={product.title} 
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => {
            console.log('Image failed to load:', product.imageUrl);
            setImgError(true);
          }}
          loading="lazy"
          crossOrigin="anonymous"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform z-20">
          <a 
            href={product.etsyUrl || EXTERNAL_URLS.PRINTIFY_SHOP} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full block"
          >
            <Button 
              className="w-full bg-primary hover:bg-red-800 text-white font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Now
            </Button>
          </a>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">{product.title}</h3>
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-primary font-bold text-xl">${(product.price / 100).toFixed(2)}</span>
          <span className="text-sm text-gray-400 uppercase tracking-wider">
            {product.sizes && product.sizes.join(" · ")}
          </span>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Direct fetch - no React Query
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ROUTES.PRODUCTS);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched products:", data);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const filteredProducts = products.filter(
    (product) => selectedCategory === "all" || product.category === selectedCategory
  );
  
  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      toast({
        title: "Opening Etsy shop",
        description: `Redirecting to ${product.title} on Etsy`
      });
      window.open(product.etsyUrl || EXTERNAL_URLS.PRINTIFY_SHOP, "_blank");
    }
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  return (
    <div className="pb-20">
      {/* Featured Collection */}
      <div className="relative overflow-hidden mb-8 shadow-2xl border-b-4 border-primary">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
        <div className="bg-black h-[300px] flex flex-col items-center justify-center relative">
          <img 
            src={SGFlyerLogoPng} 
            alt="SG Logo" 
            className="w-40 h-40 object-contain mb-2 relative z-20"
          />
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider text-white uppercase text-center relative z-20 mb-0">
            SAVAGE GENTLEMEN
          </h1>
          <p className="text-xl text-gray-300 tracking-wide uppercase mt-2 relative z-20">
            MERCHANDISE • COLLECTION
          </p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex justify-center">
          <a href={EXTERNAL_URLS.PRINTIFY_SHOP} target="_blank" rel="noopener noreferrer" className="w-full max-w-xs">
            <Button className="bg-primary hover:bg-red-800 text-white transition w-full text-lg py-6 uppercase tracking-wider font-bold">
              SHOP COLLECTION
            </Button>
          </a>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-5xl mx-auto mb-10 px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold uppercase tracking-wide">Product Categories</h3>
          <Button 
            variant="link" 
            className="text-primary hover:text-red-700 font-medium p-0 h-auto transition-colors uppercase"
            onClick={() => setSelectedCategory("all")}
          >
            View All
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {PRODUCT_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={
                selectedCategory === category.id 
                  ? "bg-primary text-white border-primary hover:bg-red-800 transition-colors" 
                  : "border-gray-600 text-white hover:border-white hover:bg-transparent transition-colors"
              }
              onClick={() => handleCategorySelect(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Debug Info - Hidden in production */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="bg-red-900/80 backdrop-blur text-white p-5 rounded-lg border border-red-700">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 mr-3 text-red-300" />
              <span className="font-bold text-lg">Unable to load products</span>
            </div>
            <p className="mt-2 text-red-200">{error}</p>
          </div>
        </div>
      )}
      
      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] rounded-lg bg-gray-800/50 backdrop-blur" />
            <Skeleton className="h-[400px] rounded-lg bg-gray-800/50 backdrop-blur" />
            <Skeleton className="h-[400px] rounded-lg bg-gray-800/50 backdrop-blur" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {filteredProducts.map((product) => (
              <SimpleProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/50 backdrop-blur">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">No Products Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {products.length > 0 
                ? "There are no products matching the selected category. Please try a different category."
                : "Our product catalog is currently being updated. Please check back soon."
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Shop Options */}
      <div className="bg-black py-20 border-t-4 border-primary relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-block mb-6">
            <img 
              src={SGFlyerLogoPng}
              alt="SG Logo" 
              className="w-20 h-20 mx-auto object-contain"
            />
          </div>
          <h3 className="text-3xl font-bold uppercase tracking-wider mb-4">EXCLUSIVE COLLECTION</h3>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
            Discover our complete collection of premium Caribbean-inspired clothing and accessories on our official Printify store.
          </p>
          
          <div className="flex flex-col items-center">
            <a 
              href={EXTERNAL_URLS.PRINTIFY_SHOP} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full max-w-sm"
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-red-800 text-white text-lg uppercase tracking-wider font-bold py-7 w-full"
              >
                SHOP COMPLETE COLLECTION
              </Button>
            </a>
            <p className="mt-4 text-gray-400 text-sm">
              All products are designed exclusively by Savage Gentlemen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
