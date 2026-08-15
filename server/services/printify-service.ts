export interface MerchItem {
  id: string;
  title: string;
  category: "outerwear" | "bottoms" | "tees" | "headwear" | "accessories";
  price: number; // in cents, e.g. 5255 for $52.55
  description: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  featured: boolean;
  inStock: boolean;
  printifyBlueprintId?: number;
}

export const SAVAGE_MERCH_CATALOG: MerchItem[] = [
  {
    id: "sg-obsidian-hoodie",
    title: "Savage Nocturne Heavyweight Hoodie",
    category: "outerwear",
    price: 7800, // $78.00
    description: "480 GSM ultra-heavy French Terry cotton hoodie with embossed gold metallic Savage Gentlemen crest and double-lined hood. Built for cool fete nights and global travel.",
    images: [
      "/mockups/sg_luxury_hoodie.jpg",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1000&fit=crop"
    ],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: [
      { name: "Obsidian Black", hex: "#0c0d12" },
      { name: "Volcanic Smoke", hex: "#1c1d24" }
    ],
    featured: true,
    inStock: true,
  },
  {
    id: "sg-riddim-tee",
    title: "Sound System Heavy Graphic Tee",
    category: "tees",
    price: 4200, // $42.00
    description: "Vintage-washed 260 GSM drop-shoulder boxy tee featuring screen-printed retro Caribbean soundclash typography and gold foil accents.",
    images: [
      "/mockups/sg_soundclash_tee.jpg",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=1000&fit=crop"
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Washed Carbon", hex: "#16161a" },
      { name: "Vintage Cream", hex: "#f4ede2" }
    ],
    featured: true,
    inStock: true,
  },
  {
    id: "sg-dad-hat",
    title: "Caribbean Nocturne Embroidered Dad Hat",
    category: "headwear",
    price: 3600, // $36.00
    description: "Unstructured 6-panel low profile washed cotton twill cap with 3D high-density embroidered Savage Gentlemen crest and antique brass buckle closure.",
    images: [
      "/mockups/sg_embroidered_cap.jpg",
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=1000&fit=crop"
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Obsidian Black", hex: "#0c0d12" },
      { name: "Safari Sand", hex: "#c4b59f" }
    ],
    featured: true,
    inStock: true,
  },
  {
    id: "sg-flask-set",
    title: "Savage Barology Matte Black Flask Set",
    category: "accessories",
    price: 4800, // $48.00
    description: "Laser-engraved 8oz food-grade stainless steel liquor flask with 2 matching shot cups and filling funnel in a luxury presentation box. Ideal for premium aged rum.",
    images: [
      "/mockups/sg_barology_flask.jpg",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=1000&fit=crop"
    ],
    sizes: ["8 oz"],
    colors: [
      { name: "Matte Black & Gold", hex: "#111111" }
    ],
    featured: true,
    inStock: true,
  },
  {
    id: "sg-nocturne-shades",
    title: "Savage Nocturne Polarized Shield Shades",
    category: "accessories",
    price: 5500, // $55.00
    description: "UV400 polarized frameless shield sunglasses engineered for high-noon fete survival, glare reduction, and pristine style.",
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1000&fit=crop"
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Gold Mirror", hex: "#d4af37" },
      { name: "Obsidian Gradient", hex: "#1a1a1a" }
    ],
    featured: false,
    inStock: true,
  },
  {
    id: "sg-fete-tote",
    title: "Carnival Heavy Duty Canvas Tote",
    category: "accessories",
    price: 3200, // $32.00
    description: "20oz reinforced duck canvas tote bag with inner zippered pocket for valuables, sunglasses clip, and waterproof inner lining.",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=1000&fit=crop"
    ],
    sizes: ["Large (20L)"],
    colors: [
      { name: "Raw Canvas & Black", hex: "#e8e1d5" }
    ],
    featured: false,
    inStock: true,
  }
];

export class PrintifyService {
  private apiKey: string | undefined;
  private shopId: string | undefined;

  constructor() {
    this.apiKey = process.env.PRINTIFY_API_KEY;
    this.shopId = process.env.PRINTIFY_SHOP_ID;
  }

  async getCatalog(): Promise<MerchItem[]> {
    // If Printify API is configured, sync live shop products
    if (this.apiKey && this.shopId) {
      try {
        const res = await fetch(`https://api.printify.com/v1/shops/${this.shopId}/products.json`, {
          headers: { Authorization: `Bearer ${this.apiKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data) && data.data.length > 0) {
            // ONLY SHOW ACTIVE / PUBLISHED ITEMS THAT ARE NOT DELETED AND HAVE ACTIVE VARIANTS
            const activeProducts = data.data.filter((p: any) =>
              !p.is_deleted &&
              p.variants &&
              p.variants.some((v: any) => v.is_enabled && v.is_available)
            );

            if (activeProducts.length > 0) {
              return activeProducts.map((p: any) => {
                const enabledVariants = p.variants.filter((v: any) => v.is_enabled && v.is_available);
                const minPrice = Math.min(...enabledVariants.map((v: any) => v.price));

                // Detect item category
                const titleLower = p.title.toLowerCase();
                const tagsLower = (p.tags || []).map((t: string) => t.toLowerCase());
                let category: "outerwear" | "bottoms" | "tees" | "headwear" | "accessories" = "outerwear";
                if (titleLower.includes("jogger") || titleLower.includes("pants") || titleLower.includes("sweatpants") || tagsLower.includes("bottoms")) {
                  category = "bottoms";
                } else if (titleLower.includes("hoodie") || titleLower.includes("sweatshirt") || titleLower.includes("jacket") || titleLower.includes("pullover")) {
                  category = "outerwear";
                } else if (titleLower.includes("tee") || titleLower.includes("t-shirt") || titleLower.includes("shirt")) {
                  category = "tees";
                } else if (titleLower.includes("hat") || titleLower.includes("cap") || titleLower.includes("beanie")) {
                  category = "headwear";
                } else {
                  category = "accessories";
                }

                // Extract valid mockup images
                const validImages = (p.images || [])
                  .filter((img: any) => img.src && !img.src.endsWith(".svg"))
                  .map((img: any) => img.src);

                // Extract active option IDs
                const activeOptionIds = new Set(enabledVariants.flatMap((v: any) => v.options || []));

                // Parse Colors
                const colorOpt = (p.options || []).find((o: any) => o.type === "color" || o.name.toLowerCase().includes("color"));
                let activeColors: { name: string; hex: string }[] = [];
                if (colorOpt && colorOpt.values) {
                  activeColors = colorOpt.values
                    .filter((val: any) => activeOptionIds.has(val.id) || enabledVariants.some((v: any) => v.title.includes(val.title)))
                    .map((val: any) => ({
                      name: val.title,
                      hex: val.colors?.[0] || "#000000"
                    }));
                }

                // Parse Sizes
                const sizeOpt = (p.options || []).find((o: any) => o.type === "size" || o.name.toLowerCase().includes("size"));
                let activeSizes: string[] = [];
                if (sizeOpt && sizeOpt.values) {
                  activeSizes = sizeOpt.values
                    .filter((val: any) => activeOptionIds.has(val.id) || enabledVariants.some((v: any) => v.title.includes(val.title)))
                    .map((val: any) => val.title);
                }

                if (activeSizes.length === 0) {
                  activeSizes = Array.from(new Set(enabledVariants.map((v: any) => v.title.split(" / ")[0])));
                }
                if (activeColors.length === 0) {
                  activeColors = [{ name: "Standard", hex: "#000000" }];
                }

                return {
                  id: p.id.toString(),
                  title: p.title,
                  category,
                  price: minPrice,
                  description: p.description?.replace(/<\/?[^>]+(>|$)/g, " ").trim() || "Exclusive Savage Gentlemen merchandise.",
                  images: validImages.length > 0 ? validImages : ["/mockups/sg_luxury_hoodie.jpg"],
                  sizes: activeSizes,
                  colors: activeColors,
                  featured: true,
                  inStock: true,
                  printifyBlueprintId: p.blueprint_id,
                };
              });
            }
          }
        }
      } catch (err) {
        console.error("[PrintifyService] Error fetching live Printify catalog, using curated store items:", err);
      }
    }

    return SAVAGE_MERCH_CATALOG;
  }

  async createFulfillmentOrder(orderData: {
    customerName: string;
    email: string;
    phone?: string;
    shippingAddress: {
      address1: string;
      city: string;
      region: string;
      zip: string;
      country: string;
    };
    lineItems: { itemId: string; quantity: number; size: string; color?: string }[];
  }): Promise<{ success: boolean; orderId?: string; simulated: boolean }> {
    if (this.apiKey && this.shopId) {
      try {
        const res = await fetch(`https://api.printify.com/v1/shops/${this.shopId}/orders.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            external_id: `SG_${Date.now()}`,
            label: `Savage Gentlemen Order`,
            line_items: orderData.lineItems.map(item => ({
              product_id: item.itemId,
              variant_id: 1,
              quantity: item.quantity,
            })),
            shipping_method: 1,
            send_shipping_notification: true,
            address_to: {
              first_name: orderData.customerName.split(" ")[0] || "Customer",
              last_name: orderData.customerName.split(" ").slice(1).join(" ") || "SG",
              email: orderData.email,
              phone: orderData.phone || "555-555-5555",
              country: orderData.shippingAddress.country,
              region: orderData.shippingAddress.region,
              address1: orderData.shippingAddress.address1,
              city: orderData.shippingAddress.city,
              zip: orderData.shippingAddress.zip,
            },
          }),
        });

        const data = await res.json();
        if (res.ok && data.id) {
          return { success: true, orderId: data.id, simulated: false };
        }
      } catch (err) {
        console.error("[PrintifyService] Order fulfillment submission error:", err);
      }
    }

    // Simulated fulfillment for local testing
    console.log("[PrintifyService] Simulated Printify print-on-demand fulfillment created for:", orderData.email);
    return { success: true, orderId: `sim_printify_${Date.now()}`, simulated: true };
  }
}

export const printifyService = new PrintifyService();
