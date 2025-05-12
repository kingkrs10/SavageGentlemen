// User types
export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isGuest: boolean;
  role?: string;
  email?: string;
  token?: string;         // Authentication token
  stripeCustomerId?: string;
  paypalCustomerId?: string;
  firebaseId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Event types
export interface Event {
  id: number;
  title: string;
  description: string;
  date: string | Date;
  time?: string;
  endTime?: string;
  duration?: number;
  location: string;
  price: number;
  imageUrl: string;
  category: string;
  featured: boolean;
  organizerName?: string;
  organizerEmail?: string;
}

// Product types
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sizes: string[];
  featured: boolean;
  etsyUrl: string;
}

// Livestream types
export interface Livestream {
  id: number;
  title: string;
  description: string;
  streamDate: string | Date;
  thumbnailUrl: string;
  isLive: boolean;
  hostName: string;
  // Enhanced multi-platform support
  platform: string; // youtube, twitch, instagram, facebook, tiktok, custom
  youtubeUrl?: string;
  twitchChannel?: string;
  instagramUsername?: string;
  facebookUrl?: string;
  tiktokUsername?: string;
  customStreamUrl?: string;
  embedCode?: string;
  // Legacy field
  streamUrl?: string;
  // UI-only properties
  viewerCount?: number;
}

// Post types
export interface Post {
  id: number;
  userId: number;
  content: string;
  mediaUrl?: string;
  createdAt: string | Date;
  likes: number;
  comments: number;
  user: {
    id: number;
    displayName: string;
    avatar?: string;
  };
}

// Comment types
export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string | Date;
  user: {
    id: number;
    displayName: string;
    avatar?: string;
  };
}

// Chat message types
export interface ChatMessage {
  id: number;
  userId: number;
  livestreamId?: number;
  content: string;
  createdAt: string | Date;
  user: {
    id: number;
    displayName: string;
    avatar?: string;
  };
}

// Order types
export interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  paymentMethod?: string;
  paymentId?: string;
  discountCodeId?: number;
}

// Ticket types
export interface Ticket {
  id: number;
  name: string;
  description?: string;
  price: number;
  eventId: number;
  quantity: number;
  remainingQuantity?: number;
  isActive?: boolean;
  maxPerPurchase?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Discount code types
export interface DiscountCode {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  eventId?: number;
  expiresAt?: string | Date;
  isActive?: boolean;
  maxUses?: number;
  currentUses?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Media upload types
export interface MediaUpload {
  id: number;
  url: string;
  userId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
