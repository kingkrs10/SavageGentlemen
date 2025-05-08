// User types
export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isGuest: boolean;
}

// Event types
export interface Event {
  id: number;
  title: string;
  description: string;
  date: string | Date;
  location: string;
  price: number;
  imageUrl: string;
  category: string;
  featured: boolean;
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
  streamUrl: string;
  hostName: string;
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
