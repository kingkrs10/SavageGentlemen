// API Routes
export const API_ROUTES = {
  EVENTS: "/api/events",
  EVENTS_FEATURED: "/api/events/featured",
  EVENT_DETAIL: "/api/events/:id",
  PRODUCTS: "/api/products",
  PRODUCTS_FEATURED: "/api/products/featured",
  LIVESTREAMS: "/api/livestreams",
  LIVESTREAMS_CURRENT: "/api/livestreams/current",
  LIVESTREAMS_UPCOMING: "/api/livestreams/upcoming",
  POSTS: "/api/posts",
  COMMENTS: "/api/comments",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_GUEST: "/api/auth/guest",
};

// External URLs
export const EXTERNAL_URLS = {
  ETSY_SHOP: "https://sgxmerch.etsy.com",
  PRINTFUL_SHOP: "https://savagegentlemen.myshopify.com", // Replace with your actual Printful store URL
  FACEBOOK: "https://www.facebook.com/savagegentlemen",
  INSTAGRAM: "https://www.instagram.com/savagegentlemen",
  TWITTER: "https://www.twitter.com/savagegentlemen",
  YOUTUBE: "https://www.youtube.com/savagegentlemen",
};

// Event Categories
export const EVENT_CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "festival", label: "Festival" },
  { id: "party", label: "Party" },
  { id: "concert", label: "Concert" },
];

// Product Categories
export const PRODUCT_CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "t-shirts", label: "T-Shirts" },
  { id: "hoodies", label: "Hoodies" },
  { id: "hats", label: "Hats" },
  { id: "accessories", label: "Accessories" },
];
