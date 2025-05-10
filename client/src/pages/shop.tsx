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
  // Always use SG Flyer Logo for now to avoid CORS issues
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-800">
      <div className="relative h-48 bg-gray-800 flex items-center justify-center">
        <img 
          src={SGFlyerLogoPng} 
          alt={product.title} 
          className="h-32 w-32 object-contain"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white">{product.title}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-primary font-bold">${(product.price / 100).toFixed(2)}</span>
          <span className="text-xs text-gray-400">
            {product.sizes && product.sizes.join(", ")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <Button 
            className="w-full bg-primary text-white hover:bg-red-800 transition flex items-center justify-center gap-2"
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            Buy on Etsy
          </Button>
          <a 
            href={product.printifyUrl || EXTERNAL_URLS.PRINTIFY_SHOP} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button 
              className="w-full bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.printifyUrl ? 'Buy on Printify' : 'Similar on Printify'}
            </Button>
          </a>
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
      window.open(product.etsyUrl || EXTERNAL_URLS.ETSY_SHOP, "_blank");
    }
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  return (
    <div className="pb-20">
      {/* Featured Collection */}
      <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
        <img 
          src={SGFlyerLogoPng} 
          alt="SG Flyer Logo" 
          className="w-full h-64 object-contain bg-gray-900 p-8"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <Badge className="bg-primary text-white text-sm px-3 py-1 rounded-full mb-2 inline-block">
            Shop Now
          </Badge>
          <h2 className="text-3xl font-heading text-white">SG Merch Collection</h2>
          <p className="text-lg text-gray-200 mb-4">Caribbean-inspired clothing and accessories</p>
          <div className="flex flex-wrap gap-3">
            <a href={EXTERNAL_URLS.ETSY_SHOP} target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary text-white hover:bg-red-800 transition">
                Visit Etsy Shop
              </Button>
            </a>
            <a href={EXTERNAL_URLS.PRINTIFY_SHOP} target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 transition">
                Visit Printify Shop
              </Button>
            </a>
          </div>
        </div>
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
      {error && (
        <div className="bg-red-900 text-white p-4 rounded-lg mb-4">
          <AlertCircle className="h-6 w-6 inline-block mr-2" />
          <span className="font-semibold">Error loading products:</span>
          <p className="mt-1">{error}</p>
        </div>
      )}
      
      {products.length > 0 && (
        <div className="bg-blue-900 text-white p-4 rounded-lg mb-4">
          <p className="font-semibold">Products Loaded:</p>
          <p>Total products: {products.length}</p>
          <p>Categories: {Array.from(new Set(products.map(p => p.category))).join(', ')}</p>
        </div>
      )}
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading ? (
          <>
            <Skeleton className="h-64 rounded-lg bg-gray-800" />
            <Skeleton className="h-64 rounded-lg bg-gray-800" />
            <Skeleton className="h-64 rounded-lg bg-gray-800" />
          </>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <SimpleProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))
        ) : (
          <div className="text-center py-8 col-span-full">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-gray-400">
              {products.length > 0 
                ? "There are no products matching your filter. Try changing your selection."
                : "There are no products available. Products may not be loading from the database."
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Shop Options */}
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold mb-3">Shop Our Collections</h3>
        <p className="text-gray-400 mb-4">Choose where you'd like to shop for Savage Gentlemen merch</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <div className="bg-gray-800 p-5 rounded-lg flex-1">
            <h4 className="font-semibold text-lg mb-2">Etsy Shop</h4>
            <p className="text-gray-400 text-sm mb-4">Handcrafted items and exclusive designs</p>
            <a href={EXTERNAL_URLS.ETSY_SHOP} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-primary text-white hover:bg-red-800 transition w-full">
                Shop on Etsy
              </Button>
            </a>
          </div>
          
          <div className="bg-gray-800 p-5 rounded-lg flex-1">
            <h4 className="font-semibold text-lg mb-2">Printify Shop</h4>
            <p className="text-gray-400 text-sm mb-4">Print-on-demand apparel and accessories</p>
            <a href={EXTERNAL_URLS.PRINTIFY_SHOP} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 transition w-full">
                Shop on Printify
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
