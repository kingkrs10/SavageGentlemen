import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Check,
  X,
  CreditCard,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { AdSpace } from "@/components/home/AdSpace";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MerchItem {
  id: string;
  title: string;
  category: "outerwear" | "bottoms" | "tees" | "headwear" | "accessories";
  price: number; // in cents, e.g. 6800 for $68.00
  description: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  featured: boolean;
  inStock: boolean;
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  size: string;
  color?: string;
  image: string;
  quantity: number;
}

const CATEGORIES = [
  { id: "all", label: "All Drops" },
  { id: "outerwear", label: "Outerwear & Hoodies" },
  { id: "bottoms", label: "Joggers & Bottoms" },
  { id: "tees", label: "Graphic Tees" },
  { id: "headwear", label: "Headwear & Caps" },
  { id: "accessories", label: "Barware & Accessories" },
];

export default function Shop() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { size: string; color?: string }>>({});

  const { data: catalog = [], isLoading } = useQuery<MerchItem[]>({
    queryKey: ["/api/merch/catalog"],
    queryFn: async () => {
      const res = await fetch("/api/merch/catalog");
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
  });

  const filteredCatalog = catalog.filter(item => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const getVariant = (itemId: string, item: MerchItem) => {
    return selectedVariants[itemId] || {
      size: item.sizes[0] || "Standard",
      color: item.colors[0]?.name,
    };
  };

  const handleVariantChange = (itemId: string, size: string, color?: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [itemId]: { size, color },
    }));
  };

  const handleAddToCart = (item: MerchItem) => {
    const variant = getVariant(item.id, item);
    const existingIndex = cart.findIndex(
      c => c.id === item.id && c.size === variant.size && c.color === variant.color
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          id: item.id,
          title: item.title,
          price: item.price,
          size: variant.size,
          color: variant.color,
          image: item.images[0],
          quantity: 1,
        },
      ]);
    }

    setIsCartOpen(true);
    toast({
      title: "Added to Cart",
      description: `${item.title} (${variant.size}) added to your bag.`,
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalCents = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      const res = await apiRequest("POST", "/api/merch/checkout", {
        items: cart,
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout Initiated",
          description: "Order submitted for fulfillment.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        description: err.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen space-y-12 pb-24 text-white">
      <SEOHead
        title="Official Merch & Luxury Streetwear | Savage Gentlemen"
        description="Shop official Savage Gentlemen luxury streetwear, heavyweight French Terry hoodies, soundclash tees, and barware."
      />

      {/* Top Header Sponsor Ticker */}
      <AdSpace placement="header_ticker" />

      {/* ── 1. SHOP HERO BANNER ── */}
      <section className="container mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gold-500/20 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Savage Nocturne Streetwear
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-bold gold-gradient-text uppercase tracking-tight">
              Official Store
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mt-2 font-light">
              Premium 480 GSM French Terry hoodies, sound system graphic tees, and luxury nightlife barware. Manufactured on demand with zero inventory waste.
            </p>
          </div>

          {/* Cart Trigger Floating Button */}
          <Button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs uppercase tracking-wider px-6 h-12 gap-2 shadow-[0_0_25px_rgba(229,169,60,0.25)] shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-obsidian" />
            View Bag ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-mono font-bold flex items-center justify-center border-2 border-obsidian">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </section>

      {/* ── 2. CATEGORY SELECTOR ── */}
      <section className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat.id
                  ? "bg-gold-500 text-obsidian font-bold shadow-md"
                  : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. PRODUCT CATALOG GRID ── */}
      <section className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-3xl border border-white/10 bg-obsidian-card p-4 space-y-4">
                <Skeleton className="w-full h-80 rounded-2xl bg-white/5" />
                <Skeleton className="w-1/2 h-6 bg-white/5" />
                <Skeleton className="w-full h-4 bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCatalog.map(item => {
              const currentVariant = getVariant(item.id, item);

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-gold-500/15 bg-obsidian-card hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl"
                >
                  {/* Product Image Carousel / Hero */}
                  <div className="relative w-full h-84 md:h-96 overflow-hidden bg-obsidian-dark">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                    />
                    {item.featured && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gold-500 text-obsidian font-mono uppercase font-bold text-xs shadow-md">
                          VIP Drop
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-obsidian/90 backdrop-blur-md px-3 py-1 rounded-full border border-gold-500/30">
                      <span className="font-mono text-base font-bold text-gold-400">
                        ${(item.price / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Product Details & Variant Selectors */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6 text-left">
                    <div className="space-y-3">
                      <h3 className="font-heading text-xl font-bold text-white group-hover:text-gold-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>

                      {/* Size Picker */}
                      {item.sizes.length > 1 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 block">Select Size:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.sizes.map(size => (
                              <button
                                key={size}
                                onClick={() => handleVariantChange(item.id, size, currentVariant.color)}
                                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                                  currentVariant.size === size
                                    ? "bg-gold-500 text-obsidian border border-gold-400"
                                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gold-500/20 hover:bg-gold-500 text-gold-300 hover:text-obsidian border border-gold-500/40 font-bold uppercase tracking-wider text-xs h-11 gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Bag • ${(item.price / 100).toFixed(2)}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* In-Grid Sponsored Card */}
            <AdSpace placement="shop_feed" />
          </div>
        )}
      </section>

      {/* ── 4. BRAND VALUES TRUST BAR ── */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-3xl border border-gold-500/20 bg-gradient-to-r from-obsidian-card via-obsidian to-obsidian-card text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-gold-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Ethical Print-on-Demand</h4>
            <p className="text-xs text-white/50">Zero overproduction. Every item is printed exclusively when you order.</p>
          </div>
          <div className="space-y-2">
            <Truck className="w-8 h-8 text-gold-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Global Express Delivery</h4>
            <p className="text-xs text-white/50">Fast tracked shipping to US, UK, Canada, and across the Caribbean.</p>
          </div>
          <div className="space-y-2">
            <Sparkles className="w-8 h-8 text-gold-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Heavyweight 480 GSM Cotton</h4>
            <p className="text-xs text-white/50">Custom crafted luxury silhouettes engineered for fete durability.</p>
          </div>
        </div>
      </section>

      {/* ── 5. SLIDE-OVER SHOPPING BAG DRAWER ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-obsidian border-l border-gold-500/30 flex flex-col justify-between p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gold-400" />
                  <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wider">Your Bag</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Line Items */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <ShoppingBag className="w-12 h-12 text-white/20 mx-auto" />
                    <p className="text-white/60 text-sm">Your shopping bag is empty.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-obsidian-card border border-white/10">
                      <img src={item.image} alt={item.title} className="w-16 h-20 object-cover rounded-xl shrink-0" />
                      <div className="flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h5 className="font-bold text-sm text-white line-clamp-1">{item.title}</h5>
                          <span className="text-[11px] font-mono text-gold-400">Size: {item.size}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 bg-obsidian rounded-lg border border-white/10 px-2 py-0.5">
                            <button onClick={() => updateQuantity(idx, -1)} className="text-white/60 hover:text-white">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} className="text-white/60 hover:text-white">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-mono text-sm font-bold text-gold-400">
                            ${((item.price * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-white/40 hover:text-red-400 self-start p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / Stripe Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Subtotal:</span>
                    <span className="font-mono text-xl font-bold text-gold-400">${(totalCents / 100).toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-gold-500 hover:bg-gold-400 text-obsidian font-bold uppercase tracking-wider text-xs h-12 gap-2 shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isCheckingOut ? "Processing..." : "Proceed to Secure Stripe Checkout"}
                  </Button>
                  <p className="text-[10px] text-center text-white/40">
                    Encrypted 256-Bit SSL Checkout • Automatic Printify Order Routing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
