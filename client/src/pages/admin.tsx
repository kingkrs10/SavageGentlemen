import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getNormalizedImageUrl } from "@/lib/utils/image-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthHeaders } from "@/lib/auth-utils";

// Define types for the admin dashboard
interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
  email: string | null;
  role: string;
  isGuest: boolean;
}

interface Product {
  id: number;
  title: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  featured: boolean;
  sizes?: string[];
  etsyUrl?: string | null;
}

interface AdminEvent {
  id: number;
  title: string;
  date: Date | string;
  location: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  featured?: boolean;
  isSocaPassportEnabled?: boolean;
  stampPointsDefault?: number;
  countryCode?: string | null;
  carnivalCircuit?: string | null;
  accessCode?: string | null;
}

interface Ticket {
  id: number;
  name: string;
  price: number;
  eventId: number;
  quantity: number;
  remainingQuantity: number;
  isActive: boolean;
  maxPerPurchase: number;
  description: string | null;
  status: string;
  priceType: string;
  minPerOrder: number;
  displayRemainingQuantity: boolean;
  hideIfSoldOut: boolean;
  hidePriceIfSoldOut: boolean;
  secretCode: string | null;
  salesStartDate: Date | string | null;
  salesStartTime: string | null;
  salesEndDate: Date | string | null;
  salesEndTime: string | null;
  lockMinQuantity: number | null;
  lockTicketTypeId: number | null;
}

interface Order {
  id: number;
  status: string;
  createdAt: Date | string;
  userId: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentId: string | null;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  orderId: number;
  productId?: number | null;
  ticketId?: number | null;
  quantity: number;
  price: number;
  product?: Product;
  ticket?: Ticket;
}

interface Livestream {
  id: number;
  title: string;
  description: string | null;
  streamDate: Date | string;
  thumbnailUrl: string | null;
  isLive: boolean;
  hostName: string | null;
  // Enhanced multi-platform support
  platform: string; // youtube, twitch, instagram, facebook, tiktok, custom
  youtubeUrl?: string | null;
  twitchChannel?: string | null;
  instagramUsername?: string | null;
  facebookUrl?: string | null;
  tiktokUsername?: string | null;
  customStreamUrl?: string | null;
  embedCode?: string | null;
  // Legacy field
  streamUrl?: string | null;
}

interface MusicMix {
  id: number;
  title: string;
  description: string | null;
  priceInCents: number;
  fileUrl: string;
  previewUrl: string | null;
  artworkUrl: string | null;
  durationSeconds: number | null;
  fileSize: number | null;
  isPublished: boolean;
  displayOrder: number;
  uploadedBy: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  PackageOpen,
  Calendar,
  Users,
  Ticket as TicketIcon,
  ShoppingCart,
  Lock,
  Radio,
  MoreHorizontal,
  Video,
  Music,
  ScanLine,
  Stamp,
  Upload,
  X,
  Image as ImageIcon,
  Megaphone,
  Eye,
  BarChart3,
  Edit,
  Search,
  Filter,
  Plus,
  Trash,
  DollarSign,
  BookOpen,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import AdminMediaPage from "./admin-media";
import { MagazineAdminManager } from "@/components/admin/MagazineAdminManager";
import { BackgroundVideoManager } from "@/components/admin/BackgroundVideoManager";
import AdCreativeStudio from "@/components/admin/AdCreativeStudio";
import LivestreamManager from "@/components/admin/LivestreamManager";
import TicketScanner from "@/components/admin/TicketScanner";
import PassportManager from "@/components/admin/PassportManager";
import { AffiliateManager } from "@/components/admin/AffiliateManager";
import UserManagement from "@/components/admin/UserManagement";

const ADMIN_CATEGORIES = [
  {
    id: "audience",
    label: "Audience & Loyalty",
    icon: Users,
    tabs: [
      { id: "users", label: "User Accounts", icon: Users },
      { id: "passport", label: "Soca Passport", icon: Stamp },
    ]
  },
  {
    id: "events",
    label: "Events & Box Office",
    icon: Calendar,
    tabs: [
      { id: "events", label: "Events Master", icon: Calendar },
      { id: "tickets", label: "Ticket Tiers", icon: TicketIcon },
      { id: "orders", label: "Customer Orders", icon: ShoppingCart },
      { id: "scanner", label: "Gate Scanner", icon: ScanLine },
      { id: "affiliates", label: "Affiliates", icon: DollarSign },
    ]
  },
  {
    id: "media",
    label: "Media & Broadcast",
    icon: Radio,
    tabs: [
      { id: "magazine", label: "Magazine & IG", icon: BookOpen },
      { id: "musicmixes", label: "Music Mixes", icon: Music },
      { id: "livestreams", label: "Livestreams", icon: Radio },
      { id: "ads", label: "Ads Studio", icon: Megaphone },
      { id: "theme", label: "Site Visuals", icon: Video },
      { id: "media", label: "Media Library", icon: ImageIcon },
    ]
  },
  {
    id: "commerce",
    label: "Merchandise",
    icon: PackageOpen,
    tabs: [
      { id: "products", label: "Shop Products", icon: PackageOpen },
    ]
  }
];

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user: contextUser, isAdmin, isModerator, login } = useUser();
  const [currentUser, setCurrentUser] = React.useState<User | null>(() => (contextUser as any) || null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState("users");

  const currentCategory = React.useMemo(() => {
    return ADMIN_CATEGORIES.find(cat => cat.tabs.some(t => t.id === activeDashboardTab)) || ADMIN_CATEGORIES[0];
  }, [activeDashboardTab]);

  // Ad management state
  const [isCreateAdModalOpen, setIsCreateAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    type: 'standard',
    imageUrl: '',
    logoUrl: '',
    linkUrl: '',
    backgroundColor: 'bg-gray-800',
    textColor: 'text-white',
    ctaText: 'Learn More',
    price: '',
    eventDate: '',
    location: '',
    videoUrl: '',
    isActive: true,
    priority: 0,
    startDate: '',
    endDate: ''
  });
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [adUploadedImage, setAdUploadedImage] = useState<File | null>(null);
  const [adVideoPreview, setAdVideoPreview] = useState<string | null>(null);
  const [adUploadedVideo, setAdUploadedVideo] = useState<File | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState<any>({
    name: '',
    price: 0,
    quantity: 0,
    description: '',
    // Essential tab fields
    maxPerPurchase: 4,
    isActive: true,
    // Advanced tab fields
    priceType: 'standard',
    minPerOrder: 1,
    displayRemainingQuantity: true,
    hideIfSoldOut: false,
    hidePriceIfSoldOut: false,
    secretCode: '',
    salesStartDate: '',
    salesStartTime: '',
    salesEndDate: '',
    salesEndTime: '',
    hideBeforeSalesStart: false,
    hideAfterSalesEnd: false,
    lockMinQuantity: null,
    lockTicketTypeId: null,
    status: 'on_sale'
  });
  const [activeTab, setActiveTab] = useState("essential");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [livestreamDialogOpen, setLivestreamDialogOpen] = useState(false);
  const [currentLivestream, setCurrentLivestream] = useState<Livestream | null>(null);
  const [musicMixDialogOpen, setMusicMixDialogOpen] = useState(false);
  const [currentMusicMix, setCurrentMusicMix] = useState<MusicMix | null>(null);
  const [artworkUploadMixId, setArtworkUploadMixId] = useState<number | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Livestream form state
  const [livestreamForm, setLivestreamForm] = useState({
    title: '',
    description: '',
    streamDate: '',
    streamTime: '',
    thumbnailUrl: '',
    isLive: false,
    hostName: '',
    platform: 'custom', // youtube, twitch, instagram, facebook, tiktok, custom
    youtubeUrl: '',
    twitchChannel: '',
    instagramUsername: '',
    facebookUrl: '',
    tiktokUsername: '',
    customStreamUrl: '',
    embedCode: ''
  });

  // Music Mix form state
  const [musicMixForm, setMusicMixForm] = useState({
    title: '',
    description: '',
    priceInCents: 199,
    isPublished: false,
    fullMixFile: null as File | null,
    previewFile: null as File | null,
    artworkFile: null as File | null,
  });

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '', date: '', time: '', location: '', price: 0, description: '', imageUrl: '',
    category: 'party', featured: false, isSocaPassportEnabled: false, stampPointsDefault: 50,
    countryCode: '', carnivalCircuit: '', videoUrl: '', galleryMedia: [] as any[]
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // New state for video and gallery
  const [eventVideoFile, setEventVideoFile] = useState<File | null>(null);
  const [eventVideoPreview, setEventVideoPreview] = useState<string | null>(null);
  const [eventGalleryFiles, setEventGalleryFiles] = useState<File[]>([]);
  const [eventGalleryPreviews, setEventGalleryPreviews] = useState<string[]>([]);

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] }); // If exists
      toast({ title: "Success", description: "AdminEvent deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete event", variant: "destructive" });
    }
  });

  const handleDeleteEvent = async (event: AdminEvent) => {
    if (!event || !event.id) return;
    
    if (!confirm(`Are you sure you want to delete "${event.title}"? This will also remove all associated tickets, purchases, and analytics. This action cannot be undone.`)) return;

    try {
      const response = await apiRequest('DELETE', `/api/admin/events/${event.id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete event');
      }

      toast({
        title: "AdminEvent Deleted",
        description: `"${event.title}" and all related records have been successfully removed.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      toast({
        title: "Error Deleting AdminEvent",
        description: error.message || "Failed to delete event. Please ensure all dependent records can be removed.",
        variant: "destructive"
      });
    }
  };
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  React.useEffect(() => {
    // Synchronize current user with context or local storage
    if (contextUser) {
      setCurrentUser(contextUser as any);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userData = user?.data?.data || user?.data || user;
          if (userData && userData.id) {
            setCurrentUser(userData);
          }
        } catch (err) {
          console.error("Error parsing stored user:", err);
        }
      }
    }
  }, [contextUser]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) return;
    setIsAuthenticating(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        username: adminUsername,
        password: adminPassword,
      });
      const responseData = await res.json();
      if (!res.ok || responseData.status === 'error') {
        throw new Error(responseData.message || "Invalid credentials");
      }
      const userData = responseData.data || responseData;
      if (!userData || !userData.id) {
        throw new Error("Invalid response from authentication server");
      }
      if (userData.role !== 'admin' && userData.role !== 'moderator') {
        throw new Error("Account authenticated, but lacks administrator privileges.");
      }
      login(userData);
      setCurrentUser(userData);
      toast({
        title: "Access Granted",
        description: `Welcome to the Savage Executive Dashboard, ${userData.displayName || userData.username}!`,
      });
    } catch (err: any) {
      toast({
        title: "Authentication Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Fetch products
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch events
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery<AdminEvent[]>({
    queryKey: ["/api/events"],
  });

  // Fetch users
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser,
  });

  // Fetch all tickets
  const {
    data: allTickets,
    isLoading: allTicketsLoading,
    error: allTicketsError
  } = useQuery<Ticket[]>({
    queryKey: ["/api/admin/tickets"],
    enabled: !!currentUser,
  });

  // Fetch orders
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!currentUser,
  });

  // Fetch livestreams
  const {
    data: livestreams,
    isLoading: livestreamsLoading,
    error: livestreamsError
  } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams"],
    enabled: !!currentUser,
  });

  // Fetch music mixes
  const {
    data: musicMixes,
    isLoading: musicMixesLoading,
    error: musicMixesError
  } = useQuery<MusicMix[]>({
    queryKey: ["/api/music/mixes"],
    enabled: !!currentUser,
  });

  // Fetch sponsored content
  const {
    data: sponsoredContent = [],
    isLoading: adsLoading,
    refetch: refetchAds
  } = useQuery<any[]>({
    queryKey: ['/api/sponsored-content'],
    queryFn: () => apiRequest('GET', '/api/sponsored-content').then(res => res.json()),
    enabled: !!currentUser,
  });

  // Fetch articles for Ad Creative Studio
  const { data: articles = [] } = useQuery<any[]>({
    queryKey: ['/api/magazine/articles'],
    queryFn: () => apiRequest('GET', '/api/magazine/articles').then(res => res.json()).catch(() => []),
    enabled: !!currentUser,
  });

  // Auth helper for ad mutations
  const getAdAuthHeaders = (): Record<string, string> => {
    return getAuthHeaders();
  };

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (adData: any) => {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (adData[key] !== null && adData[key] !== undefined) {
          formData.append(key, adData[key]);
        }
      });
      if (adUploadedImage) formData.append('image', adUploadedImage);
      if (adUploadedVideo) formData.append('video', adUploadedVideo);

      const response = await fetch('/api/admin/sponsored-content', {
        method: 'POST',
        body: formData,
        headers: getAdAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create advertisement');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      refetchAds();
      setIsCreateAdModalOpen(false);
      setEditingAd(null);
      resetAdForm();
      toast({ title: "Success", description: "Advertisement created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create advertisement", variant: "destructive" });
    }
  });

  // Update ad mutation
  const updateAdMutation = useMutation({
    mutationFn: async ({ id, adData }: { id: number; adData: any }) => {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (adData[key] !== null && adData[key] !== undefined) {
          formData.append(key, adData[key]);
        }
      });
      if (adUploadedImage) formData.append('image', adUploadedImage);
      if (adUploadedVideo) formData.append('video', adUploadedVideo);

      const response = await fetch(`/api/admin/sponsored-content/${id}`, {
        method: 'PUT',
        body: formData,
        headers: getAdAuthHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update advertisement');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      refetchAds();
      setIsCreateAdModalOpen(false);
      setEditingAd(null);
      resetAdForm();
      toast({ title: "Success", description: "Advertisement updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update advertisement", variant: "destructive" });
    }
  });

  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/sponsored-content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      toast({ title: "Success", description: "Advertisement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete advertisement", variant: "destructive" });
    }
  });

  // Ad helper functions
  const resetAdForm = () => {
    setAdFormData({
      title: '', description: '', type: 'standard', imageUrl: '', logoUrl: '',
      linkUrl: '', backgroundColor: 'bg-gray-800', textColor: 'text-white',
      ctaText: 'Learn More', price: '', eventDate: '', location: '', videoUrl: '',
      isActive: true, priority: 0, startDate: '', endDate: ''
    });
    setAdImagePreview(null);
    setAdUploadedImage(null);
    setAdVideoPreview(null);
    setAdUploadedVideo(null);
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdUploadedImage(file);
      const reader = new FileReader();
      reader.onload = () => setAdImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdUploadedVideo(file);
      setAdVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleAdFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        updateAdMutation.mutate({ id: editingAd.id, adData: adFormData });
      } else {
        createAdMutation.mutate(adFormData);
      }
    } catch (error) {
      console.error("Error submitting ad form:", error);
      toast({ title: "Error", description: "Failed to submit advertisement data", variant: "destructive" });
    }
  };

  const handleEditAd = (ad: any) => {
    setEditingAd(ad);
    setAdFormData({
      title: ad.title || '', description: ad.description || '', type: ad.type || 'standard',
      imageUrl: ad.imageUrl || '', logoUrl: ad.logoUrl || '', linkUrl: ad.linkUrl || '',
      backgroundColor: ad.backgroundColor || 'bg-gray-800', textColor: ad.textColor || 'text-white',
      ctaText: ad.ctaText || 'Learn More', price: ad.price || '', eventDate: ad.eventDate || '',
      location: ad.location || '', videoUrl: ad.videoUrl || '',
      isActive: ad.isActive !== undefined ? ad.isActive : true, priority: ad.priority || 0,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : ''
    });
    setAdImagePreview(ad.imageUrl || null);
    setAdUploadedImage(null);
    setIsCreateAdModalOpen(true);
  };

  const handleDeleteAd = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete the advertisement "${title}"? This action cannot be undone.`)) {
      deleteAdMutation.mutate(id);
    }
  };

  // Handle ticket form submission
  // State for tickets management
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<Error | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);

  // Function to fetch tickets for a selected event
  const fetchTicketsForEvent = async (eventId: number) => {
    if (!eventId) return;

    setTicketsLoading(true);
    setTicketsError(null);

    try {
      // Fetch tickets from the backend
      const headers = getAuthHeaders();

      const response = await fetch(`/api/admin/tickets/event/${eventId}`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`);
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTicketsError(error instanceof Error ? error : new Error('Failed to fetch tickets'));
    } finally {
      setTicketsLoading(false);
    }
  };

  // Fetch tickets when an event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchTicketsForEvent(selectedEventId);
    }
  }, [selectedEventId]);

  const handleEditTicket = (ticket: Ticket) => {
    // Set the current ticket being edited
    setCurrentTicket(ticket);

    // Populate the form with the ticket's data
    setTicketForm({
      name: ticket.name,
      price: ticket.price / 100,
      quantity: ticket.quantity,
      description: ticket.description || '',
      // Essential tab fields
      maxPerPurchase: ticket.maxPerPurchase || 4,
      isActive: ticket.isActive !== undefined ? ticket.isActive : true,
      // Advanced tab fields - populate with actual values
      priceType: ticket.priceType || 'standard',
      minPerOrder: ticket.minPerOrder || 1,
      displayRemainingQuantity: ticket.displayRemainingQuantity !== undefined ? ticket.displayRemainingQuantity : true,
      hideIfSoldOut: ticket.hideIfSoldOut || false,
      hidePriceIfSoldOut: ticket.hidePriceIfSoldOut || false,
      secretCode: ticket.secretCode || '',
      salesStartDate: ticket.salesStartDate ? (typeof ticket.salesStartDate === 'string' ? ticket.salesStartDate.split('T')[0] : new Date(ticket.salesStartDate).toISOString().split('T')[0]) : '',
      salesStartTime: ticket.salesStartTime || '',
      salesEndDate: ticket.salesEndDate ? (typeof ticket.salesEndDate === 'string' ? ticket.salesEndDate.split('T')[0] : new Date(ticket.salesEndDate).toISOString().split('T')[0]) : '',
      salesEndTime: ticket.salesEndTime || '',
      hideBeforeSalesStart: false, // Default if not in interface
      hideAfterSalesEnd: false, // Default if not in interface
      lockMinQuantity: ticket.lockMinQuantity || null,
      lockTicketTypeId: ticket.lockTicketTypeId || null,
      status: ticket.status || 'on_sale'
    });

    // Open the ticket dialog
    setTicketDialogOpen(true);
  };

  const handleEditLivestream = (livestream: Livestream) => {
    // Set the current livestream being edited
    setCurrentLivestream(livestream);

    // Convert date to format expected by the form
    const streamDate = new Date(livestream.streamDate);
    const formattedDate = streamDate.toISOString().split('T')[0];
    const formattedTime = streamDate.toISOString().split('T')[1].substring(0, 5);

    // Populate the form with the livestream's data
    setLivestreamForm({
      title: livestream.title,
      description: livestream.description || '',
      streamDate: formattedDate,
      streamTime: formattedTime,
      thumbnailUrl: livestream.thumbnailUrl || '',
      isLive: livestream.isLive,
      hostName: livestream.hostName || '',
      platform: livestream.platform || 'custom',
      youtubeUrl: livestream.youtubeUrl || '',
      twitchChannel: livestream.twitchChannel || '',
      instagramUsername: livestream.instagramUsername || '',
      facebookUrl: livestream.facebookUrl || '',
      tiktokUsername: livestream.tiktokUsername || '',
      customStreamUrl: livestream.customStreamUrl || '',
      embedCode: livestream.embedCode || ''
    });

    // Open the livestream dialog
    setLivestreamDialogOpen(true);
  };

  const handleToggleLivestreamStatus = async (livestream: Livestream) => {
    try {
      // Toggle the isLive status
      const newStatus = !livestream.isLive;

      // Make API call to update the livestream's status
      const response = await apiRequest('PUT', `/api/admin/livestreams/${livestream.id}/toggle-status`);

      if (!response.ok) {
        throw new Error('Failed to update livestream status');
      }

      const result = await response.json();

      toast({
        title: newStatus ? 'Stream Set to Live' : 'Stream Set to Offline',
        description: `The livestream "${livestream.title}" is now ${newStatus ? 'live' : 'offline'}`,
      });

      // Refresh the livestreams list
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
    } catch (error) {
      console.error('Error updating livestream status:', error);
      toast({
        title: "Error",
        description: "Failed to update livestream status",
        variant: "destructive",
      });
    }
  };

  const handleToggleTicketStatus = async (ticket: Ticket) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/tickets/${ticket.id}/status`, {
        isActive: !ticket.isActive
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      toast({
        title: "Status Updated",
        description: `Ticket status ${!ticket.isActive ? 'activated' : 'deactivated'} successfully`,
      });

      // Refresh the tickets list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm("Are you sure you want to delete this ticket? This will also remove all scan records associated with it.")) return;

    try {
      const response = await apiRequest('DELETE', `/api/admin/tickets/${ticketId}`);

      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }

      toast({
        title: "Ticket Deleted",
        description: "The ticket has been successfully removed.",
      });

      // Refresh the tickets list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  // User creation handler
  const handleCreateUser = async () => {
    try {
      // Validation
      if (!userForm.username || !userForm.password || !userForm.email) {
        toast({
          title: "Missing fields",
          description: "Username, password, and email are required",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for API
      const userData = {
        ...userForm,
        isGuest: false
      };

      // Make API call to create user
      const response = await apiRequest('POST', '/api/admin/users', userData);

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const result = await response.json();

      toast({
        title: "User Created",
        description: `User "${userForm.username}" created successfully`,
      });

      // Close the dialog
      setUserDialogOpen(false);

      // Reset the form
      setUserForm({
        username: '',
        displayName: '',
        email: '',
        password: '',
        role: 'user'
      });

      // Invalidate the users query to refetch users and update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };
  // User edit handler
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      displayName: user.displayName || '',
      email: user.email || '',
      password: '', // Password not editable here
      role: user.role
    });
    setUserDialogOpen(true);
  };

  // User update handler
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      if (!userForm.username || !userForm.email) {
        toast({
          title: "Missing fields",
          description: "Username and email are required",
          variant: "destructive"
        });
        return;
      }

      const response = await apiRequest('PUT', `/api/admin/users/${editingUser.id}`, {
        username: userForm.username,
        displayName: userForm.displayName,
        email: userForm.email,
        role: userForm.role
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      toast({
        title: "User Updated",
        description: `User "${userForm.username}" updated successfully`,
      });

      setUserDialogOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Individual user delete handler
  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete user');
      }

      toast({
        title: "User Deleted",
        description: "The user has been successfully removed.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error Deleting User",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Bulk user delete handler
  const handleDeleteUsersBulk = async () => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`)) return;

    try {
      // Use 'ids' as the payload key to match most API patterns, though routes.ts handles both
      const response = await apiRequest('DELETE', '/api/admin/users', { ids: selectedUsers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete users');
      }

      toast({
        title: "Users Deleted",
        description: `${selectedUsers.length} users have been successfully removed.`,
      });

      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error: any) {
      console.error("Failed to delete users in bulk:", error);
      toast({
        title: "Error Deleting Users",
        description: error.message || "Failed to delete users. Please try again.",
        variant: "destructive"
      });
    }
  };

  // User role change handler
  const handleChangeUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role: newRole });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      toast({
        title: "Role Updated",
        description: `User role changed to "${newRole}" successfully`,
      });

      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      console.error("Failed to change user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive"
      });
    }
  };

  // AdminEvent edit handler
  const handleEditEvent = (event: AdminEvent) => {
    setEditingEvent(event);
    const eventDate = new Date(event.date);
    const dateStr = eventDate.toISOString().split('T')[0];
    const timeStr = eventDate.toTimeString().slice(0, 5);

    setEventForm({
      title: event.title,
      date: dateStr,
      time: timeStr,
      location: event.location,
      price: event.price / 100,
      description: event.description || '',
      imageUrl: event.imageUrl || '',
      category: event.category || 'party',
      featured: event.featured || false,
      isSocaPassportEnabled: event.isSocaPassportEnabled || false,
      stampPointsDefault: event.stampPointsDefault || 50,
      countryCode: event.countryCode || '',
      carnivalCircuit: event.carnivalCircuit || '',
      videoUrl: (event as any).videoUrl || '',
      galleryMedia: (event as any).galleryMedia || []
    });
    setEventImageFile(null);
    setImagePreview(null);
    setEventVideoFile(null);
    setEventVideoPreview(null);
    setEventGalleryFiles([]);
    setEventGalleryPreviews([]);
    setEventDialogOpen(true);
  };

  // AdminEvent update handler
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      if (!eventForm.title || !eventForm.date) {
        toast({ title: "Missing fields", description: "Title and date are required", variant: "destructive" });
        return;
      }

      const formData = buildEventFormData();

      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast({ title: "AdminEvent Updated", description: `AdminEvent "${eventForm.title}" updated successfully` });
      setEventDialogOpen(false);
      setEditingEvent(null);
      resetEventFormState();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    } catch (error) {
      console.error("Failed to update event:", error);
      toast({ title: "Error", description: "Failed to update event. Please try again.", variant: "destructive" });
    }
  };

  // Helper to build FormData for event create/update
  const buildEventFormData = (): FormData => {
    const formData = new FormData();
    const priceInCents = Math.round(eventForm.price * 100);
    const dateTimeString = `${eventForm.date}T${eventForm.time || '00:00:00'}`;
    const eventDate = new Date(dateTimeString);

    formData.append('title', eventForm.title);
    formData.append('date', eventDate.toISOString());
    formData.append('location', eventForm.location || 'TBD');
    formData.append('price', priceInCents.toString());
    if (eventForm.description) formData.append('description', eventForm.description);
    formData.append('category', eventForm.category || 'party');
    formData.append('featured', String(eventForm.featured));
    formData.append('isSocaPassportEnabled', String(eventForm.isSocaPassportEnabled));
    formData.append('stampPointsDefault', String(eventForm.stampPointsDefault));
    if (eventForm.countryCode) formData.append('countryCode', eventForm.countryCode);
    if (eventForm.carnivalCircuit) formData.append('carnivalCircuit', eventForm.carnivalCircuit);

    // Add main image if selected
    if (eventImageFile) {
      formData.append('image', eventImageFile);
    } else if (eventForm.imageUrl) {
      formData.append('imageUrl', eventForm.imageUrl);
    }

    // Add main video if selected
    if (eventVideoFile) {
      formData.append('video', eventVideoFile);
    } else if (eventForm.videoUrl) {
      formData.append('videoUrl', eventForm.videoUrl);
    }

    // Add gallery files
    if (eventGalleryFiles.length > 0) {
      eventGalleryFiles.forEach((file) => {
        formData.append('gallery', file);
      });
    }

    // Pass existing gallery media as JSON
    if (eventForm.galleryMedia && eventForm.galleryMedia.length > 0) {
      formData.append('galleryMedia', JSON.stringify(eventForm.galleryMedia));
    }

    return formData;
  };

  const resetEventFormState = () => {
    setEventForm({
      title: '', date: '', time: '', location: '', price: 0, description: '', imageUrl: '',
      category: 'party', featured: false, isSocaPassportEnabled: false, stampPointsDefault: 50,
      countryCode: '', carnivalCircuit: '', videoUrl: '', galleryMedia: []
    });
    setEventImageFile(null);
    setImagePreview(null);
    setEventVideoFile(null);
    setEventVideoPreview(null);
    setEventGalleryFiles([]);
    setEventGalleryPreviews([]);
  };

  // Helper to get auth headers for FormData requests (no Content-Type — browser sets multipart boundary)
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const firebaseToken = localStorage.getItem('firebaseToken');
    if (firebaseToken) {
      headers['Authorization'] = `Bearer ${firebaseToken}`;
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userData = user?.data?.data || user?.data || user;
        if (userData?.token) headers['Authorization'] = `Bearer ${userData.token}`;
        if (userData?.id) headers['user-id'] = userData.id.toString();
      } catch { }
    }
    return headers;
  };

  // AdminEvent creation handler
  const handleCreateEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.date) {
        toast({ title: "Missing fields", description: "Title and date are required", variant: "destructive" });
        return;
      }

      const formData = buildEventFormData();

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to create event');
      await response.json();

      toast({ title: "AdminEvent Created", description: `AdminEvent "${eventForm.title}" created successfully` });
      setEventDialogOpen(false);
      resetEventFormState();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    } catch (error) {
      console.error("Failed to create event:", error);
      toast({ title: "Error", description: "Failed to create event. Please try again.", variant: "destructive" });
    }
  };

  // Livestream creation handler
  const handleCreateLivestream = async () => {
    try {
      // Validation
      if (!livestreamForm.title || !livestreamForm.streamDate) {
        toast({
          title: "Missing fields",
          description: "Title and stream date are required",
          variant: "destructive"
        });
        return;
      }

      // Combine date and time into a single Date object
      const dateTimeString = `${livestreamForm.streamDate}T${livestreamForm.streamTime || '00:00:00'}`;
      const streamDate = new Date(dateTimeString);

      // Prepare data based on selected platform
      let streamData: any = {
        title: livestreamForm.title,
        description: livestreamForm.description || null,
        streamDate: streamDate,
        thumbnailUrl: livestreamForm.thumbnailUrl || null,
        isLive: livestreamForm.isLive,
        hostName: livestreamForm.hostName || null,
        platform: livestreamForm.platform
      };

      // Add platform-specific fields
      switch (livestreamForm.platform) {
        case 'youtube':
          streamData.youtubeUrl = livestreamForm.youtubeUrl;
          break;
        case 'twitch':
          streamData.twitchChannel = livestreamForm.twitchChannel;
          break;
        case 'instagram':
          streamData.instagramUsername = livestreamForm.instagramUsername;
          break;
        case 'facebook':
          streamData.facebookUrl = livestreamForm.facebookUrl;
          break;
        case 'tiktok':
          streamData.tiktokUsername = livestreamForm.tiktokUsername;
          break;
        case 'custom':
          streamData.customStreamUrl = livestreamForm.customStreamUrl;
          streamData.embedCode = livestreamForm.embedCode;
          break;
      }

      // Make API call to create livestream
      const url = currentLivestream
        ? `/api/admin/livestreams/${currentLivestream.id}`
        : '/api/admin/livestreams';

      const method = currentLivestream ? 'PUT' : 'POST';

      const response = await apiRequest(method, url, streamData);

      if (!response.ok) {
        throw new Error('Failed to save livestream');
      }

      const result = await response.json();

      toast({
        title: currentLivestream ? "Livestream Updated" : "Livestream Created",
        description: `Livestream "${livestreamForm.title}" ${currentLivestream ? 'updated' : 'created'} successfully`,
      });

      // Close the dialog
      setLivestreamDialogOpen(false);

      // Reset the current livestream
      setCurrentLivestream(null);

      // Reset the form
      setLivestreamForm({
        title: '',
        description: '',
        streamDate: '',
        streamTime: '',
        thumbnailUrl: '',
        isLive: false,
        hostName: '',
        platform: 'custom',
        youtubeUrl: '',
        twitchChannel: '',
        instagramUsername: '',
        facebookUrl: '',
        tiktokUsername: '',
        customStreamUrl: '',
        embedCode: ''
      });

      // Invalidate the livestreams query to refetch livestreams and update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
    } catch (error) {
      console.error("Failed to save livestream:", error);
      toast({
        title: "Error",
        description: "Failed to save livestream. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Livestream update handler
  const handleUpdateLivestream = async () => {
    // This uses the same logic as handleCreateLivestream but ensures currentLivestream is defined
    if (!currentLivestream) {
      toast({
        title: "Error",
        description: "No livestream selected for update",
        variant: "destructive"
      });
      return;
    }

    // Use the same create function since it already handles updates
    await handleCreateLivestream();
  };

  const handleCreateTicket = async () => {
    try {
      // Validate logical constraints
      if (ticketForm.minPerOrder > ticketForm.maxPerPurchase) {
        toast({
          title: "Invalid quantities",
          description: "Minimum order quantity cannot be greater than maximum quantity per purchase.",
          variant: "destructive"
        });
        return;
      }

      if (!selectedEventId) {
        toast({
          title: "Select an Event",
          description: "Please select an event to create a ticket for.",
          variant: "destructive"
        });
        return;
      }

      // Prepare the complete ticket data for submission - explicitly map all schema fields
      const ticketData: Record<string, any> = {
        eventId: selectedEventId,
        name: ticketForm.name,
        price: ticketForm.price,
        quantity: ticketForm.quantity,
        description: ticketForm.description || null,
        maxPerPurchase: ticketForm.maxPerPurchase,
        isActive: ticketForm.isActive,
        priceType: ticketForm.priceType,
        minPerOrder: ticketForm.minPerOrder,
        displayRemainingQuantity: ticketForm.displayRemainingQuantity,
        hideIfSoldOut: ticketForm.hideIfSoldOut,
        hidePriceIfSoldOut: ticketForm.hidePriceIfSoldOut,
        secretCode: ticketForm.secretCode || null,
        salesStartDate: ticketForm.salesStartDate || null,
        salesStartTime: ticketForm.salesStartTime || null,
        salesEndDate: ticketForm.salesEndDate || null,
        salesEndTime: ticketForm.salesEndTime || null,
        hideBeforeSalesStart: ticketForm.hideBeforeSalesStart,
        hideAfterSalesEnd: ticketForm.hideAfterSalesEnd,
        lockMinQuantity: ticketForm.lockMinQuantity || null,
        lockTicketTypeId: ticketForm.lockTicketTypeId || null,
        status: ticketForm.status,
        remainingQuantity: ticketForm.quantity,
        // Additional schema fields with safe defaults
        tierLevel: "standard",
        benefits: [],
        includedItems: [],
        transferable: true,
        refundable: false,
        earlyAccess: false,
        prioritySupport: false,
        exclusiveContent: false,
        meetGreet: false,
        backstageAccess: false,
        seatingPriority: "general"
      };

      let url = '/api/admin/tickets';
      let method = 'POST';
      let successMessage = `New ticket "${ticketForm.name}" for event #${selectedEventId} created successfully`;

      // If editing an existing ticket, update instead of create
      if (currentTicket) {
        url = `/api/admin/tickets/${currentTicket.id}`;
        method = 'PUT';
        successMessage = `Ticket "${ticketForm.name}" updated successfully`;
      }

      // Make API call to create or update the ticket — use skipErrorThrow to handle errors ourselves
      const response = await apiRequest(method, url, ticketData, { skipErrorThrow: true });

      if (!response.ok) {
        let errorMsg = 'Failed to save ticket';
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMsg = errorData.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
          } else if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (_) { /* ignore parse error */ }
        throw new Error(errorMsg);
      }

      const result = await response.json();

      toast({
        title: currentTicket ? "Ticket Updated" : "Ticket Created",
        description: successMessage,
      });

      // Close the dialog
      setTicketDialogOpen(false);

      // Reset the ticket being edited
      setCurrentTicket(null);

      // Refresh the tickets list
      if (selectedEventId) {
        fetchTicketsForEvent(selectedEventId);
      }

      // Reset the form to defaults
      setTicketForm({
        name: '',
        price: 0,
        quantity: 0,
        description: '',
        maxPerPurchase: 4,
        isActive: true,
        priceType: 'standard',
        minPerOrder: 1,
        displayRemainingQuantity: true,
        hideIfSoldOut: false,
        hidePriceIfSoldOut: false,
        secretCode: '',
        salesStartDate: '',
        salesStartTime: '',
        salesEndDate: '',
        salesEndTime: '',
        hideBeforeSalesStart: false,
        hideAfterSalesEnd: false,
        lockMinQuantity: null,
        lockTicketTypeId: null,
        status: 'on_sale'
      });

      // Reset to Essential tab
      setActiveTab("essential");

      // Invalidate tickets queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
    } catch (error: any) {
      console.error("Failed to save ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Music Mix handlers
  const handleCreateMusicMix = async () => {
    try {
      if (!musicMixForm.title) {
        toast({
          title: "Missing fields",
          description: "Title is required",
          variant: "destructive"
        });
        return;
      }

      const mixData = {
        title: musicMixForm.title,
        description: musicMixForm.description || null,
        priceInCents: musicMixForm.priceInCents,
        isPublished: musicMixForm.isPublished,
        fileUrl: 'placeholder',
        uploadedBy: currentUser?.id,
      };

      const response = await apiRequest('POST', '/api/music/mixes', mixData);

      const newMix = await response.json();

      if (musicMixForm.fullMixFile) {
        await handleUploadMixFile(newMix.id, musicMixForm.fullMixFile);
      }

      if (musicMixForm.previewFile) {
        await handleUploadPreview(newMix.id, musicMixForm.previewFile);
      }

      if (musicMixForm.artworkFile) {
        await handleUploadArtwork(newMix.id, musicMixForm.artworkFile);
      }

      toast({
        title: "Music Mix Created",
        description: `Music mix "${musicMixForm.title}" created successfully`,
      });

      setMusicMixDialogOpen(false);
      setMusicMixForm({
        title: '',
        description: '',
        priceInCents: 199,
        isPublished: false,
        fullMixFile: null,
        previewFile: null,
        artworkFile: null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/music/mixes"] });
    } catch (error: any) {
      console.error("Failed to create music mix:", error);

      // Check if it's an authentication error
      const isAuthError = error?.message?.includes('401') ||
        error?.message?.includes('403') ||
        error?.message?.includes('authentication') ||
        error?.message?.includes('Admin access');

      toast({
        title: "Error",
        description: isAuthError
          ? "Your session has expired. Please log out and log back in to continue."
          : "Failed to create music mix. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUploadMixFile = async (mixId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Build auth headers manually for FormData uploads
    const headers: Record<string, string> = {};
    const firebaseToken = localStorage.getItem("firebaseToken");
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    } else {
      // Try user's stored token
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userData = user?.data?.data || user?.data || user;
        if (userData?.token) {
          headers["Authorization"] = `Bearer ${userData.token}`;
        }
        if (userData?.id) {
          headers["user-id"] = userData.id.toString();
        }
      }
    }

    const response = await fetch(`/api/music/mixes/${mixId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload mix file');
    }
  };

  const handleUploadPreview = async (mixId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Build auth headers manually for FormData uploads
    const headers: Record<string, string> = {};
    const firebaseToken = localStorage.getItem("firebaseToken");
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    } else {
      // Try user's stored token
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userData = user?.data?.data || user?.data || user;
        if (userData?.token) {
          headers["Authorization"] = `Bearer ${userData.token}`;
        }
        if (userData?.id) {
          headers["user-id"] = userData.id.toString();
        }
      }
    }

    const response = await fetch(`/api/music/mixes/${mixId}/upload-preview`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload preview file');
    }
  };

  const handleUploadArtwork = async (mixId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Build auth headers manually for FormData uploads
    const headers: Record<string, string> = {};
    const firebaseToken = localStorage.getItem("firebaseToken");
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    } else {
      // Try user's stored token
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userData = user?.data?.data || user?.data || user;
        if (userData?.token) {
          headers["Authorization"] = `Bearer ${userData.token}`;
        }
        if (userData?.id) {
          headers["user-id"] = userData.id.toString();
        }
      }
    }

    const response = await fetch(`/api/admin/uploads`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload artwork');
    }

    const result = await response.json();

    await apiRequest('PUT', `/api/music/mixes/${mixId}`, { artworkUrl: result.file.url });
  };

  const handleToggleMixPublished = async (mix: MusicMix) => {
    try {
      const response = await apiRequest('PUT', `/api/music/mixes/${mix.id}`, {
        isPublished: !mix.isPublished
      });

      toast({
        title: mix.isPublished ? "Mix Unpublished" : "Mix Published",
        description: `The mix "${mix.title}" is now ${!mix.isPublished ? 'published' : 'unpublished'}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/music/mixes"] });
    } catch (error) {
      console.error('Error toggling mix published status:', error);
      toast({
        title: "Error",
        description: "Failed to update mix status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMix = async (mix: MusicMix) => {
    try {
      const response = await apiRequest('DELETE', `/api/music/mixes/${mix.id}`);

      toast({
        title: "Mix Deleted",
        description: `The mix "${mix.title}" has been deleted`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/music/mixes"] });
    } catch (error) {
      console.error('Error deleting mix:', error);
      toast({
        title: "Error",
        description: "Failed to delete mix",
        variant: "destructive",
      });
    }
  };

  const handleUploadArtworkForMix = async () => {
    if (!artworkUploadMixId || !artworkFile) {
      toast({
        title: "Missing Information",
        description: "Please select an artwork file",
        variant: "destructive"
      });
      return;
    }

    try {
      await handleUploadArtwork(artworkUploadMixId, artworkFile);

      toast({
        title: "Artwork Uploaded",
        description: "Artwork has been added to the music mix",
      });

      setArtworkUploadMixId(null);
      setArtworkFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/music/mixes"] });
    } catch (error) {
      console.error('Error uploading artwork:', error);
      toast({
        title: "Error",
        description: "Failed to upload artwork",
        variant: "destructive",
      });
    }
  };

  const effectiveUser = currentUser || (contextUser as any);
  const hasAdminAccess = isAdmin || isModerator || effectiveUser?.role === 'admin' || effectiveUser?.role === 'moderator';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-obsidian-strong border border-gold-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5 text-gold-400" />
            Executive Access
          </div>

          <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white">
            Admin Authentication
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Authenticate with administrator or moderator credentials to access the Savage Gentlemen Command Center.
          </p>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-gray-300">Admin Username or Email</Label>
              <Input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                required
                className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-gray-300">Password</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs uppercase tracking-wider py-5 shadow-lg shadow-gold-500/20"
            >
              {isAuthenticating ? "Verifying Credentials..." : "Enter Command Center"}
            </Button>
          </form>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
            <button
              onClick={() => navigate("/")}
              className="hover:text-gold-400 transition-colors"
            >
              &larr; Return to Main Site
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('sg:open-auth-modal', { detail: { tab: 'login' } }));
              }}
              className="text-gold-400 hover:text-gold-300"
            >
              Member Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-6">
        {/* ── LUXURY ADMIN HERO & LIVE SYSTEM METRICS ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SAVAGE EXECUTIVE COMMAND // NEON SG ACTIVE
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight">
                ADMIN <span className="gold-gradient-text">CONSOLE</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-mono max-w-2xl">
                Master command center for luxury merchandise, festival events, Soca Passport, media operations, and diaspora marketing.
              </p>
            </div>

            {/* Quick Actions & Admin Status */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="glass-obsidian border-white/15 text-white/80 hover:text-white hover:border-gold-500/40 text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-5"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5 text-gold-400" />
                Main Stage
              </Button>
              <Button
                onClick={() => navigate("/guyana2027")}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-5 shadow-lg shadow-amber-500/10"
              >
                🇬🇾 Guyana '27
              </Button>
              {currentUser && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-obsidian font-bold text-xs shadow-md">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-gold-400 block font-bold">Admin Active</span>
                    <span className="text-xs font-semibold text-white">{currentUser.displayName || currentUser.username}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-obsidian border border-gold-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-white/50 block font-bold">Registered Members</span>
                <span className="text-xl font-heading font-extrabold text-white">{users?.length ?? 28}</span>
              </div>
            </div>
            <div className="glass-obsidian border border-gold-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-white/50 block font-bold">Published Stories</span>
                <span className="text-xl font-heading font-extrabold text-amber-300">202</span>
              </div>
            </div>
            <div className="glass-obsidian border border-gold-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-white/50 block font-bold">Customer Orders</span>
                <span className="text-xl font-heading font-extrabold text-emerald-300">{orders?.length ?? 21}</span>
              </div>
            </div>
            <div className="glass-obsidian border border-gold-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-white/50 block font-bold">Events Scheduled</span>
                <span className="text-xl font-heading font-extrabold text-cyan-300">{events?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-TIER EXECUTIVE CATEGORY & TAB NAVIGATION ── */}
        <div className="space-y-4">
          {/* Top Category Switcher */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-2 rounded-2xl glass-obsidian-strong border border-white/10 backdrop-blur-xl">
            {ADMIN_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = category.id === currentCategory.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveDashboardTab(category.tabs[0].id)}
                  className={cn(
                    "flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs uppercase font-mono font-bold tracking-wider transition-all duration-200 border",
                    isSelected
                      ? "bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian border-gold-400 shadow-lg shadow-gold-500/25 font-extrabold"
                      : "bg-white/[0.03] text-white/70 border-white/5 hover:text-white hover:bg-white/10 hover:border-gold-500/30"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          <Tabs value={activeDashboardTab} onValueChange={setActiveDashboardTab} className="w-full" data-testid="admin-tabs">
            {/* Sub-Tabs Strip for Selected Category */}
            <TabsList className="flex flex-wrap h-auto w-full mb-6 bg-obsidian-card/90 border border-gold-500/20 p-1.5 gap-1.5 rounded-2xl backdrop-blur-md shadow-xl">
              {currentCategory.tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-white/70 transition-all data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-500/50 data-[state=active]:shadow-md"
                  >
                    <Icon className="h-3.5 w-3.5 text-gold-400" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <PackageOpen className="h-5 w-5 text-gold-400" />
                    Products & Merchandise
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Manage luxury merchandise, apparel, and boutique inventory</CardDescription>
                </div>
                <Button className="sg-btn" onClick={() => toast({ title: "Feature coming soon" })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {productsLoading ? (
                  <div className="py-12 text-center text-white/60 font-mono text-sm">Loading products...</div>
                ) : productsError ? (
                  <div className="py-12 text-center text-red-400 font-mono text-sm">
                    Error loading products. Please try again.
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="w-[100px] text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Image</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Title</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Price</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <TableCell>
                              <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                {product.imageUrl ? (
                                  <img
                                    src={getNormalizedImageUrl(product.imageUrl)}
                                    alt={product.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                                    <PackageOpen className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-white">{product.title}</TableCell>
                            <TableCell className="font-mono text-gold-300 font-bold">${(product.price / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider bg-gold-500/10 border border-gold-500/30 text-gold-300">
                                {product.category || "General"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <PackageOpen className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No products found</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      Add your first product by clicking the "Add Product" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Master Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gold-400" />
                    Events & Performances
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Manage carnival experiences, passport activations, and ticket tiers</CardDescription>
                </div>
                <Button className="sg-btn" onClick={() => { setEditingEvent(null); resetEventFormState(); setEventDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Event
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {eventsLoading ? (
                  <div className="py-12 text-center text-white/60 font-mono text-sm">Loading events...</div>
                ) : eventsError ? (
                  <div className="py-12 text-center text-red-400 font-mono text-sm">
                    Error loading events. Please try again.
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="w-[100px] text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Image</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Title</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Date</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Location</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Price</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Check-In</TableHead>
                          <TableHead className="text-right text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event: AdminEvent) => (
                          <TableRow key={event.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <TableCell>
                              <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                {event.imageUrl ? (
                                  <img
                                    src={getNormalizedImageUrl(event.imageUrl)}
                                    alt={event.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                                    <Calendar className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span>{event.title}</span>
                                {event.isSocaPassportEnabled && (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-mono"
                                  >
                                    🎫 Passport
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-white/80 text-xs font-mono">
                              {typeof event.date === 'string'
                                ? new Date(event.date).toLocaleDateString()
                                : event.date.toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white/70 text-xs">{event.location}</TableCell>
                            <TableCell className="font-mono text-gold-300 font-bold">${(event.price / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              {event.isSocaPassportEnabled && event.accessCode ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg"
                                    onClick={() => {
                                      const url = `${window.location.origin}/socapassport/checkin/${event.accessCode}`;
                                      navigator.clipboard.writeText(url);
                                      toast({
                                        title: "Check-In URL Copied",
                                        description: "Share this URL with event staff for check-ins"
                                      });
                                    }}
                                    data-testid={`button-copy-checkin-${event.id}`}
                                  >
                                    Copy URL
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-white/30 font-mono">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10 rounded-lg"
                                  onClick={() => handleEditEvent(event)}
                                  data-testid={`button-edit-event-${event.id}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg"
                                  onClick={() => {
                                    setSelectedEventId(event.id);
                                    setActiveDashboardTab("tickets");
                                  }}
                                >
                                  Tickets
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => handleDeleteEvent(event)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <Calendar className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No events found</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      Create your first event by clicking the "Add Event" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AdminEvent Dialog */}
            <Dialog open={eventDialogOpen} onOpenChange={(open) => {
              setEventDialogOpen(open);
              if (!open) {
                setEditingEvent(null);
                setEventForm({
                  title: '',
                  date: '',
                  time: '',
                  location: '',
                  price: 0,
                  description: '',
                  imageUrl: '',
                  category: 'party',
                  featured: false,
                  isSocaPassportEnabled: false,
                  stampPointsDefault: 50,
                  countryCode: '',
                  carnivalCircuit: '',
                  videoUrl: '',
                  galleryMedia: []
                });
              }
            }}>
              <DialogContent className="sm:max-w-[600px] bg-obsidian-card border border-gold-500/30 text-white rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">
                    {editingEvent ? 'Edit AdminEvent' : 'Create new event'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingEvent ? 'Update event details and media below.' : 'Add a new event to the system with appropriate details.'}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 mb-4">
                    <TabsTrigger value="details">AdminEvent Details</TabsTrigger>
                    <TabsTrigger value="media">Multimedia & Gallery</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">AdminEvent Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter event title"
                        className="bg-slate-700 border border-slate-600 text-white"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-white">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          className="bg-slate-700 border border-slate-600 text-white"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-white">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          className="bg-slate-700 border border-slate-600 text-white"
                          value={eventForm.time}
                          onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">Location</Label>
                      <Input
                        id="location"
                        placeholder="Enter event location"
                        className="bg-slate-700 border border-slate-600 text-white"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-white">Base Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-slate-700 border border-slate-600 text-white"
                        value={eventForm.price}
                        onChange={(e) => setEventForm({ ...eventForm, price: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Select
                        value={eventForm.category}
                        onValueChange={(value) => setEventForm({ ...eventForm, category: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border border-slate-600 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 text-white">
                          <SelectItem value="party">Party</SelectItem>
                          <SelectItem value="concert">Concert</SelectItem>
                          <SelectItem value="festival">Festival</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter event description"
                        className="bg-slate-700 border border-slate-600 text-white resize-none min-h-[100px]"
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-white flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Main Image</Label>
                      {(imagePreview || eventForm.imageUrl) ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-600">
                          <img
                            src={imagePreview || getNormalizedImageUrl(eventForm.imageUrl)}
                            alt="AdminEvent preview"
                            className="w-full h-40 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => { setEventImageFile(null); setImagePreview(null); setEventForm({ ...eventForm, imageUrl: '' }); }}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors">
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-400">Click to upload image</span>
                          <span className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEventImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      )}

                      {/* URL Fallback for Image */}
                      {!imagePreview && !eventForm.imageUrl && (
                        <div className="pt-2">
                          <p className="text-xs text-slate-500 mb-1">Or paste a URL:</p>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            className="bg-slate-700 border border-slate-600 text-white text-sm"
                            value={eventForm.imageUrl}
                            onChange={(e) => { setEventForm({ ...eventForm, imageUrl: e.target.value }); }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={eventForm.featured}
                        onCheckedChange={(checked) =>
                          setEventForm({ ...eventForm, featured: checked === true })
                        }
                        className="data-[state=checked]:bg-red-500"
                      />
                      <label
                        htmlFor="featured"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                      >
                        Feature on homepage
                      </label>
                    </div>

                    <Separator className="my-4 bg-slate-600" />

                    <div className="space-y-4">
                      {/* Passport Settings */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="passport-enabled" className="text-white font-semibold flex items-center gap-2">
                            🎫 Soca Passport
                          </Label>
                          <p className="text-xs text-slate-400">
                            Award stamps/points for check-ins
                          </p>
                        </div>
                        <Switch
                          id="passport-enabled"
                          checked={eventForm.isSocaPassportEnabled}
                          onCheckedChange={(checked) =>
                            setEventForm({ ...eventForm, isSocaPassportEnabled: checked })
                          }
                        />
                      </div>

                      {eventForm.isSocaPassportEnabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-emerald-500">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="stamp-points" className="text-white text-sm">Points</Label>
                              <Input
                                id="stamp-points"
                                type="number"
                                min="1"
                                placeholder="50"
                                className="bg-slate-700 border border-slate-600 text-white"
                                value={eventForm.stampPointsDefault}
                                onChange={(e) => setEventForm({ ...eventForm, stampPointsDefault: parseInt(e.target.value) || 50 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country-code" className="text-white text-sm">Country</Label>
                              <Select
                                value={eventForm.countryCode}
                                onValueChange={(value) => setEventForm({ ...eventForm, countryCode: value })}
                              >
                                <SelectTrigger className="bg-slate-700 border border-slate-600 text-white">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 text-white">
                                  <SelectItem value="US">🇺🇸 United States</SelectItem>
                                  <SelectItem value="TT">🇹🇹 Trinidad & Tobago</SelectItem>
                                  <SelectItem value="JM">🇯🇲 Jamaica</SelectItem>
                                  <SelectItem value="BB">🇧🇧 Barbados</SelectItem>
                                  <SelectItem value="GD">🇬🇩 Grenada</SelectItem>
                                  <SelectItem value="LC">🇱🇨 Saint Lucia</SelectItem>
                                  <SelectItem value="VC">🇻🇨 Saint Vincent</SelectItem>
                                  <SelectItem value="AG">🇦🇬 Antigua & Barbuda</SelectItem>
                                  <SelectItem value="KN">🇰🇳 Saint Kitts & Nevis</SelectItem>
                                  <SelectItem value="DM">🇩🇲 Dominica</SelectItem>
                                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="carnival-circuit" className="text-white text-sm">Carnival Circuit</Label>
                            <Input
                              id="carnival-circuit"
                              placeholder="e.g., Miami Carnival"
                              className="bg-slate-700 border border-slate-600 text-white"
                              value={eventForm.carnivalCircuit}
                              onChange={(e) => setEventForm({ ...eventForm, carnivalCircuit: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    {/* Main Video Section */}
                    <div className="space-y-4">
                      <Label className="text-white flex items-center gap-2 text-lg"><Video className="h-5 w-5" /> Main AdminEvent Video</Label>
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4 space-y-4">
                          {(eventVideoPreview || eventForm.videoUrl) ? (
                            <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-black aspect-video">
                              <video
                                src={eventVideoPreview || getNormalizedImageUrl(eventForm.videoUrl)}
                                controls
                                className="w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEventVideoFile(null);
                                  setEventVideoPreview(null);
                                  setEventForm({ ...eventForm, videoUrl: '' });
                                }}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors z-10"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-500 rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors">
                              <Video className="h-8 w-8 text-slate-400 mb-2" />
                              <span className="text-sm text-slate-400">Upload Main Video</span>
                              <span className="text-xs text-slate-500 mt-1">MP4, WebM (Max 50MB)</span>
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setEventVideoFile(file);
                                    setEventVideoPreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                            </label>
                          )}

                          {!eventForm.videoUrl && !eventVideoPreview && (
                            <div className="pt-2">
                              <p className="text-xs text-slate-500 mb-1">Or paste a video URL (MP4):</p>
                              <Input
                                placeholder="https://example.com/video.mp4"
                                className="bg-slate-700 border border-slate-600 text-white text-sm"
                                value={eventForm.videoUrl}
                                onChange={(e) => { setEventForm({ ...eventForm, videoUrl: e.target.value }); }}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="bg-slate-700" />

                    {/* Gallery Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white flex items-center gap-2 text-lg"><ImageIcon className="h-5 w-5" /> Media Gallery</Label>
                        <Label htmlFor="gallery-upload" className="cursor-pointer bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add Media
                        </Label>
                        <Input
                          id="gallery-upload"
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const newFiles = Array.from(e.target.files);
                              setEventGalleryFiles(prev => [...prev, ...newFiles]);

                              // Create previews
                              const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                              setEventGalleryPreviews(prev => [...prev, ...newPreviews]);
                            }
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Existing Gallery Items */}
                        {eventForm.galleryMedia && eventForm.galleryMedia.map((item, index) => (
                          <div key={`existing-${index}`} className="relative aspect-square bg-slate-800 rounded-md overflow-hidden border border-slate-600 group">
                            {item.type === 'video' ? (
                              <video src={getNormalizedImageUrl(item.url)} className="w-full h-full object-cover" />
                            ) : (
                              <img src={getNormalizedImageUrl(item.url)} alt="Gallery item" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove from existing gallery
                                  const newGallery = [...eventForm.galleryMedia];
                                  newGallery.splice(index, 1);
                                  setEventForm({ ...eventForm, galleryMedia: newGallery });
                                }}
                                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded uppercase">
                              {item.type}
                            </div>
                          </div>
                        ))}

                        {/* New Upload Previews */}
                        {eventGalleryFiles.map((file, index) => (
                          <div key={`new-${index}`} className="relative aspect-square bg-slate-800 rounded-md overflow-hidden border border-emerald-500/50 group">
                            {file.type.startsWith('video/') ? (
                              <video src={eventGalleryPreviews[index]} className="w-full h-full object-cover" />
                            ) : (
                              <img src={eventGalleryPreviews[index]} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove from new uploads
                                  const newFiles = [...eventGalleryFiles];
                                  newFiles.splice(index, 1);
                                  setEventGalleryFiles(newFiles);

                                  const newPreviews = [...eventGalleryPreviews];
                                  URL.revokeObjectURL(newPreviews[index]); // Cleanup
                                  newPreviews.splice(index, 1);
                                  setEventGalleryPreviews(newPreviews);
                                }}
                                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-1 rounded uppercase">
                              New
                            </div>
                          </div>
                        ))}
                      </div>

                      {(eventForm.galleryMedia.length === 0 && eventGalleryFiles.length === 0) && (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No media in gallery</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="flex space-x-2 justify-end mt-4">
                  <Button
                    onClick={() => setEventDialogOpen(false)}
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                    className="sg-btn"
                  >
                    {editingEvent ? 'Update AdminEvent' : 'Create AdminEvent'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-gold-400" />
                    Ticket Tiers & Inventory
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Manage admission tiers, pricing, sales windows, and capacity</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedEventId?.toString() || ""}
                    onValueChange={(value) => setSelectedEventId(Number(value))}
                  >
                    <SelectTrigger className="w-[220px] bg-obsidian-card/90 border border-white/15 text-white rounded-xl">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-xl shadow-2xl">
                      {events && events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()} className="text-white focus:bg-white/10">
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="sg-btn" onClick={() => {
                        // Set the default values for the form when opening
                        setTicketForm({
                          name: '',
                          price: 0,
                          quantity: 100,
                          description: '',
                          // Essential tab fields
                          maxPerPurchase: 4,
                          isActive: true,
                          // Advanced tab fields
                          priceType: 'standard',
                          minPerOrder: 1,
                          displayRemainingQuantity: true,
                          status: 'on_sale',
                          hideIfSoldOut: false,
                          hidePriceIfSoldOut: false,
                          secretCode: '',
                          salesStartDate: '',
                          salesStartTime: '',
                          salesEndDate: '',
                          salesEndTime: '',
                          hideBeforeSalesStart: false,
                          hideAfterSalesEnd: false,
                          lockMinQuantity: null,
                          lockTicketTypeId: null
                        });
                        // Default to the first event if none selected
                        if (!selectedEventId && events && events.length > 0) {
                          setSelectedEventId(events[0].id);
                        }
                      }}>
                        <TicketIcon className="h-4 w-4 mr-2" /> Create Ticket Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] bg-[#141e2e] text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white text-xl">Create new ticket type</DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Configure the ticket details including pricing, availability, and sales settings.
                        </DialogDescription>
                      </DialogHeader>

                      {/* AdminEvent Selection */}
                      <div className="mb-4">
                        <select
                          id="event"
                          className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
                          value={selectedEventId || ""}
                          onChange={(e) => setSelectedEventId(Number(e.target.value))}
                        >
                          {events?.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Essential/Advanced Tabs */}
                      <div className="mb-6">
                        <div className="flex border-b border-gold-500/20">
                          <button
                            type="button"
                            onClick={() => setActiveTab("essential")}
                            className={`flex-1 py-3 px-4 text-center font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition ${activeTab === "essential" ? "bg-gold-500/20 text-gold-400 border-b-2 border-gold-500" : "bg-obsidian-card text-gray-400"}`}
                          >
                            Essential
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("advanced")}
                            className={`flex-1 py-3 px-4 text-center font-mono text-xs font-bold uppercase tracking-wider rounded-t-lg transition ${activeTab === "advanced" ? "bg-gold-500/20 text-gold-400 border-b-2 border-gold-500" : "bg-obsidian-card text-gray-400"}`}
                          >
                            Advanced
                          </button>
                        </div>
                      </div>

                      {activeTab === "essential" ? (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center mb-1">
                              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">REQ</span>
                              <Label htmlFor="name" className="text-white">Name</Label>
                            </div>
                            <Input
                              id="name"
                              placeholder="e.g. General admission, Adult, Kid, VIP, Press"
                              className="bg-slate-700 border border-slate-600 text-white"
                              value={ticketForm.name}
                              onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center mb-1">
                                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">REQ</span>
                                <Label htmlFor="quantity" className="text-white">Quantity</Label>
                              </div>
                              <p className="text-xs text-slate-400">Availability for each date of the event</p>
                              <Input
                                id="quantity"
                                type="number"
                                className="bg-slate-700 border border-slate-600 text-white"
                                value={ticketForm.quantity}
                                onChange={(e) => setTicketForm({ ...ticketForm, quantity: Number(e.target.value) })}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center mb-1">
                                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">REQ</span>
                                <Label htmlFor="price" className="text-white">Price</Label>
                              </div>
                              <p className="text-xs text-slate-400">The price per unit</p>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">$</span>
                                <Input
                                  id="price"
                                  type="number"
                                  placeholder="0.00"
                                  className="bg-slate-700 border border-slate-600 text-white pl-7"
                                  value={ticketForm.price}
                                  onChange={(e) => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label htmlFor="description" className="text-white">Description</Label>
                            </div>
                            <p className="text-xs text-slate-400">Provide more information about this ticket type</p>
                            <textarea
                              id="description"
                              rows={4}
                              className="w-full rounded-md bg-slate-700 border border-slate-600 text-white p-3"
                              value={ticketForm.description}
                              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                            ></textarea>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label htmlFor="priceType" className="text-white">Price type</Label>
                            </div>
                            <p className="text-xs text-slate-400">Add a visual cue for non-standard prices</p>
                            <div className="bg-slate-700 rounded-md">
                              <select
                                id="priceType"
                                className="w-full rounded-md border-none bg-slate-700 px-3 py-2 text-sm text-white appearance-none"
                                value={ticketForm.priceType}
                                onChange={(e) => setTicketForm({ ...ticketForm, priceType: e.target.value })}
                              >
                                <option value="standard">Standard</option>
                                <option value="pay_what_you_can">Pay What You Can</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center mb-1">
                                <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                                <Label htmlFor="minPerOrder" className="text-white">Min quantity per order</Label>
                              </div>
                              <p className="text-xs text-slate-400">Minimum purchase quantity per order</p>
                              <Input
                                id="minPerOrder"
                                type="number"
                                className="bg-slate-700 border border-slate-600 text-white"
                                value={ticketForm.minPerOrder}
                                onChange={(e) => setTicketForm({ ...ticketForm, minPerOrder: Number(e.target.value) })}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center mb-1">
                                <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                                <Label htmlFor="maxPerPurchase" className="text-white">Max quantity per order</Label>
                              </div>
                              <p className="text-xs text-slate-400">Maximum purchase quantity per order</p>
                              <Input
                                id="maxPerPurchase"
                                type="number"
                                className="bg-slate-700 border border-slate-600 text-white"
                                value={ticketForm.maxPerPurchase}
                                onChange={(e) => setTicketForm({ ...ticketForm, maxPerPurchase: Number(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label className="text-white">Display remaining quantity</Label>
                            </div>
                            <p className="text-xs text-slate-400">Inform your customers about the remaining ticket availability</p>
                            <div className="bg-slate-700 rounded-md">
                              <select
                                className="w-full rounded-md border-none bg-slate-700 px-3 py-2 text-sm text-white appearance-none"
                                value={ticketForm.displayRemainingQuantity ? "visible" : "hidden"}
                                onChange={(e) => setTicketForm({ ...ticketForm, displayRemainingQuantity: e.target.value === "visible" })}
                              >
                                <option value="visible">Make the remaining quantity visible</option>
                                <option value="hidden">Hide the remaining quantity</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label className="text-white">Status</Label>
                            </div>
                            <p className="text-xs text-slate-400">Manually change the ticket type status</p>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="status-on_sale"
                                  checked={ticketForm.status === "on_sale"}
                                  onChange={() => setTicketForm({ ...ticketForm, status: "on_sale" })}
                                  className="h-4 w-4 accent-slate-400"
                                />
                                <label htmlFor="status-on_sale">
                                  <div className="text-white">On sale</div>
                                  <div className="text-xs text-slate-400">The ticket type is available for purchase</div>
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="status-off_sale"
                                  checked={ticketForm.status === "off_sale"}
                                  onChange={() => setTicketForm({ ...ticketForm, status: "off_sale" })}
                                  className="h-4 w-4"
                                />
                                <label htmlFor="status-off_sale">
                                  <div className="text-white">Off sale</div>
                                  <div className="text-xs text-slate-400">The ticket type won't show up in the booking process</div>
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="status-sold_out"
                                  checked={ticketForm.status === "sold_out"}
                                  onChange={() => setTicketForm({ ...ticketForm, status: "sold_out" })}
                                  className="h-4 w-4"
                                />
                                <label htmlFor="status-sold_out">
                                  <div className="text-white">Sold out</div>
                                  <div className="text-xs text-slate-400">The ticket will be forced to be sold out</div>
                                </label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="status-staff_only"
                                  checked={ticketForm.status === "staff_only"}
                                  onChange={() => setTicketForm({ ...ticketForm, status: "staff_only" })}
                                  className="h-4 w-4"
                                />
                                <label htmlFor="status-staff_only">
                                  <div className="text-white">Staff only</div>
                                  <div className="text-xs text-slate-400">The ticket will show up only if logged as owner, admin or event manager</div>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label htmlFor="secretCode" className="text-white">Secret code</Label>
                            </div>
                            <p className="text-xs text-slate-400">Show this ticket type only to those who enter this code</p>
                            <Input
                              id="secretCode"
                              placeholder="Enter secret code"
                              className="bg-slate-700 border border-slate-600 text-white"
                              value={ticketForm.secretCode}
                              onChange={(e) => setTicketForm({ ...ticketForm, secretCode: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 col-span-2">
                              <div className="flex items-center mb-1">
                                <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                                <Label className="text-white">Sales time frame</Label>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="salesStartDate" className="text-white text-xs">Sales start date</Label>
                              <div className="relative">
                                <Input
                                  id="salesStartDate"
                                  placeholder="mm/dd/yyyy"
                                  className="bg-slate-700 border border-slate-600 text-white pl-3 pr-8"
                                  value={ticketForm.salesStartDate}
                                  onChange={(e) => setTicketForm({ ...ticketForm, salesStartDate: e.target.value })}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="salesStartTime" className="text-white text-xs">Sales start time</Label>
                              <div className="relative">
                                <Input
                                  id="salesStartTime"
                                  placeholder="--:-- --"
                                  className="bg-slate-700 border border-slate-600 text-white pl-3 pr-8"
                                  value={ticketForm.salesStartTime}
                                  onChange={(e) => setTicketForm({ ...ticketForm, salesStartTime: e.target.value })}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center col-span-2 text-slate-300">
                              <input
                                type="checkbox"
                                id="hideBeforeSalesStart"
                                checked={ticketForm.hideBeforeSalesStart}
                                onChange={(e) => setTicketForm({ ...ticketForm, hideBeforeSalesStart: e.target.checked })}
                                className="h-4 w-4 mr-2"
                              />
                              <label htmlFor="hideBeforeSalesStart" className="text-slate-300 text-xs">Hide before sales start</label>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="salesEndDate" className="text-white text-xs">Sales end date</Label>
                              <div className="relative">
                                <Input
                                  id="salesEndDate"
                                  placeholder="mm/dd/yyyy"
                                  className="bg-slate-700 border border-slate-600 text-white pl-3 pr-8"
                                  value={ticketForm.salesEndDate}
                                  onChange={(e) => setTicketForm({ ...ticketForm, salesEndDate: e.target.value })}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="salesEndTime" className="text-white text-xs">Sales end time</Label>
                              <div className="relative">
                                <Input
                                  id="salesEndTime"
                                  placeholder="--:-- --"
                                  className="bg-slate-700 border border-slate-600 text-white pl-3 pr-8"
                                  value={ticketForm.salesEndTime}
                                  onChange={(e) => setTicketForm({ ...ticketForm, salesEndTime: e.target.value })}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center col-span-2 text-slate-300">
                              <input
                                type="checkbox"
                                id="hideAfterSalesEnd"
                                checked={ticketForm.hideAfterSalesEnd}
                                onChange={(e) => setTicketForm({ ...ticketForm, hideAfterSalesEnd: e.target.checked })}
                                className="h-4 w-4 mr-2"
                              />
                              <label htmlFor="hideAfterSalesEnd" className="text-slate-300 text-xs">Hide after sales end</label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label className="text-white">Hide if sold out</Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hideIfSoldOut"
                                checked={ticketForm.hideIfSoldOut}
                                onChange={(e) => setTicketForm({ ...ticketForm, hideIfSoldOut: e.target.checked })}
                                className="h-4 w-4 mr-2"
                              />
                              <label htmlFor="hideIfSoldOut" className="text-white text-xs">Hide the ticket type when the available quantity is 0</label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center mb-1">
                              <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-0.5 rounded mr-2">OPT</span>
                              <Label className="text-white">Hide the price if sold out</Label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="hidePriceIfSoldOut"
                                checked={ticketForm.hidePriceIfSoldOut}
                                onChange={(e) => setTicketForm({ ...ticketForm, hidePriceIfSoldOut: e.target.checked })}
                                className="h-4 w-4 mr-2"
                              />
                              <label htmlFor="hidePriceIfSoldOut" className="text-white text-xs">Hide the ticket type price when the available quantity is 0</label>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <Button
                          type="submit"
                          className="bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-md border-none"
                          onClick={handleCreateTicket}
                          disabled={!ticketForm.name || ticketForm.price < 0 || ticketForm.quantity <= 0}
                        >
                          SAVE
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {ticketsLoading ? (
                  <div className="py-12 text-center text-white/60 font-mono text-sm">Loading tickets...</div>
                ) : ticketsError ? (
                  <div className="py-12 text-center text-red-400 font-mono text-sm">
                    Error loading tickets. Please try again.
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Tier Name</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Event</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Price</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Sold</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Remaining</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
                          <TableHead className="text-right text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => {
                          const soldTickets = ticket.quantity - (ticket.remainingQuantity || 0);

                          const event = events?.find(e => e.id === ticket.eventId);
                          const eventName = event ? event.title : `Event #${ticket.eventId}`;

                          return (
                            <TableRow key={ticket.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                              <TableCell className="font-medium text-white">{ticket.name}</TableCell>
                              <TableCell className="text-white/80 text-xs">{eventName}</TableCell>
                              <TableCell className="font-mono text-gold-300 font-bold">${(ticket.price / 100).toFixed(2)}</TableCell>
                              <TableCell className="font-mono text-xs text-white/70">{soldTickets} / {ticket.quantity}</TableCell>
                              <TableCell className="font-mono text-xs text-white/70">{ticket.remainingQuantity || ticket.quantity}</TableCell>
                              <TableCell>
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider ${ticket.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/5 text-white/40 border border-white/10"
                                  }`}>
                                  {ticket.isActive ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-white/20 text-white hover:bg-white/10 rounded-lg"
                                    onClick={() => handleEditTicket(ticket)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant={ticket.isActive ? "destructive" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs rounded-lg"
                                    onClick={() => handleToggleTicketStatus(ticket)}
                                  >
                                    {ticket.isActive ? "Deactivate" : "Activate"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg"
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <TicketIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No tickets found</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      Create your first ticket type by clicking the "Create Ticket Type" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-gold-400" />
                    Customer Orders & Transactions
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Real-time ledger of ticket purchases, merchandise checkout, and fulfillment</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs rounded-xl" onClick={() => toast({ title: "Export Orders", description: "Coming soon" })}>
                    Export
                  </Button>
                  <Button className="sg-btn" onClick={() => toast({ title: "View Reports", description: "Coming soon" })}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Reports
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {ordersLoading ? (
                  <div className="py-12 text-center text-white/60 font-mono text-sm">Loading orders...</div>
                ) : ordersError ? (
                  <div className="py-12 text-center text-red-400 font-mono text-sm">
                    Error loading orders. Please try again.
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Order ID</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Date</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Customer</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Total</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Payment</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
                          <TableHead className="text-right text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <TableCell className="font-mono text-gold-300 font-bold">#{order.id}</TableCell>
                            <TableCell className="text-white/80 text-xs font-mono">
                              {typeof order.createdAt === 'string'
                                ? new Date(order.createdAt).toLocaleDateString()
                                : order.createdAt.toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white text-xs">{`User #${order.userId}`}</TableCell>
                            <TableCell className="font-mono text-gold-300 font-bold">${(order.totalAmount / 100).toFixed(2)}</TableCell>
                            <TableCell className="font-mono text-xs text-white/70 uppercase">{order.paymentMethod || "Credit Card"}</TableCell>
                            <TableCell>
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider ${order.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : order.status === "processing"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : order.status === "cancelled"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                    : "bg-white/5 text-white/50 border border-white/10"
                                }`}>
                                {order.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10 rounded-lg"
                                  onClick={() => toast({
                                    title: "View Order Details",
                                    description: `Order #${order.id} details`
                                  })}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No orders found</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      Customer orders will appear here once they make purchases.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Livestreams Tab */}
          <TabsContent value="livestreams" className="space-y-4">
            <LivestreamManager />
          </TabsContent>

          {/* Music Mixes Tab */}
          <TabsContent value="musicmixes" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <Music className="h-5 w-5 text-gold-400" />
                    Music Mixes & Stems
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Manage curated carnival mixes, DJ stems, and digital audio drops</CardDescription>
                </div>
                <Button className="sg-btn" onClick={() => setMusicMixDialogOpen(true)} data-testid="button-add-music-mix">
                  <Plus className="h-4 w-4 mr-2" /> Add Music Mix
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {musicMixesLoading ? (
                  <div className="py-12 text-center text-white/60 font-mono text-sm" data-testid="loading-music-mixes">Loading music mixes...</div>
                ) : musicMixesError ? (
                  <div className="py-12 text-center text-red-400 font-mono text-sm" data-testid="error-music-mixes">
                    Error loading music mixes. Please try again.
                  </div>
                ) : musicMixes && musicMixes.length > 0 ? (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">ID</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Title</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Price</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Published</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Created</TableHead>
                          <TableHead className="text-right text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {musicMixes.map((mix) => (
                          <TableRow key={mix.id} data-testid={`row-music-mix-${mix.id}`} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <TableCell className="font-mono text-gold-300 font-bold" data-testid={`text-mix-id-${mix.id}`}>#{mix.id}</TableCell>
                            <TableCell className="font-medium text-white" data-testid={`text-mix-title-${mix.id}`}>{mix.title}</TableCell>
                            <TableCell className="font-mono text-gold-300 font-bold" data-testid={`text-mix-price-${mix.id}`}>${(mix.priceInCents / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider ${mix.isPublished
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/5 text-white/50 border border-white/10"
                                  }`}
                                data-testid={`badge-mix-status-${mix.id}`}
                              >
                                {mix.isPublished ? "Published" : "Draft"}
                              </span>
                            </TableCell>
                            <TableCell className="text-white/80 text-xs font-mono" data-testid={`text-mix-created-${mix.id}`}>
                              {typeof mix.createdAt === 'string'
                                ? new Date(mix.createdAt).toLocaleDateString()
                                : mix.createdAt.toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!mix.artworkUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg"
                                    onClick={() => {
                                      setArtworkUploadMixId(mix.id);
                                    }}
                                    data-testid={`button-add-artwork-${mix.id}`}
                                  >
                                    Add Artwork
                                  </Button>
                                )}
                                <Button
                                  variant={mix.isPublished ? "outline" : "default"}
                                  size="sm"
                                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10 rounded-lg"
                                  onClick={() => handleToggleMixPublished(mix)}
                                  data-testid={`button-toggle-publish-${mix.id}`}
                                >
                                  {mix.isPublished ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => handleDeleteMix(mix)}
                                  data-testid={`button-delete-mix-${mix.id}`}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl" data-testid="empty-music-mixes">
                    <Music className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No music mixes found</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      Create your first music mix by clicking the "Add Music Mix" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Music Mix Dialog */}
            <Dialog open={musicMixDialogOpen} onOpenChange={setMusicMixDialogOpen}>
              <DialogContent className="sm:max-w-[500px] bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Create new music mix</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a new music mix with audio files and artwork.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="mix-title" className="text-white">Title *</Label>
                    <Input
                      id="mix-title"
                      placeholder="Enter mix title"
                      className="bg-slate-700 border border-slate-600 text-white"
                      value={musicMixForm.title}
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, title: e.target.value })}
                      data-testid="input-mix-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mix-description" className="text-white">Description</Label>
                    <Textarea
                      id="mix-description"
                      placeholder="Enter mix description"
                      className="bg-slate-700 border border-slate-600 text-white min-h-[80px]"
                      value={musicMixForm.description}
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, description: e.target.value })}
                      data-testid="textarea-mix-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mix-price" className="text-white">Price (in cents)</Label>
                    <Input
                      id="mix-price"
                      type="number"
                      placeholder="199"
                      className="bg-slate-700 border border-slate-600 text-white"
                      value={musicMixForm.priceInCents}
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, priceInCents: parseInt(e.target.value) || 0 })}
                      data-testid="input-mix-price"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mix-published"
                      checked={musicMixForm.isPublished}
                      onCheckedChange={(checked) => setMusicMixForm({ ...musicMixForm, isPublished: checked as boolean })}
                      data-testid="checkbox-mix-published"
                    />
                    <Label htmlFor="mix-published" className="text-white">Is Published</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mix-full-file" className="text-white">Full Mix File (Audio/Video) *</Label>
                    <Input
                      id="mix-full-file"
                      type="file"
                      accept="audio/*,video/*"
                      className="bg-slate-700 border border-slate-600 text-white"
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, fullMixFile: e.target.files?.[0] || null })}
                      data-testid="input-mix-full-file"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mix-preview-file" className="text-white">Preview File (Audio/Video)</Label>
                    <Input
                      id="mix-preview-file"
                      type="file"
                      accept="audio/*,video/*"
                      className="bg-slate-700 border border-slate-600 text-white"
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, previewFile: e.target.files?.[0] || null })}
                      data-testid="input-mix-preview-file"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mix-artwork" className="text-white">Artwork (Image)</Label>
                    <Input
                      id="mix-artwork"
                      type="file"
                      accept="image/*"
                      className="bg-slate-700 border border-slate-600 text-white"
                      onChange={(e) => setMusicMixForm({ ...musicMixForm, artworkFile: e.target.files?.[0] || null })}
                      data-testid="input-mix-artwork"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMusicMixDialogOpen(false)}
                    data-testid="button-cancel-mix"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={handleCreateMusicMix}
                    disabled={!musicMixForm.title || !musicMixForm.fullMixFile}
                    data-testid="button-save-mix"
                  >
                    Create Mix
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Artwork Upload Dialog */}
            <Dialog open={artworkUploadMixId !== null} onOpenChange={(open) => {
              if (!open) {
                setArtworkUploadMixId(null);
                setArtworkFile(null);
              }
            }}>
              <DialogContent className="sm:max-w-[400px] bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">Add Artwork</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Upload artwork image for this music mix.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="artwork-upload" className="text-white">Artwork Image</Label>
                    <Input
                      id="artwork-upload"
                      type="file"
                      accept="image/*"
                      className="bg-slate-700 border border-slate-600 text-white"
                      onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                      data-testid="input-artwork-upload"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setArtworkUploadMixId(null);
                      setArtworkFile(null);
                    }}
                    data-testid="button-cancel-artwork"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={handleUploadArtworkForMix}
                    disabled={!artworkFile}
                    data-testid="button-upload-artwork"
                  >
                    Upload Artwork
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Passport Tab */}
          <TabsContent value="passport" className="space-y-4">
            <PassportManager />
          </TabsContent>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-4">
            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="pb-6 border-b border-white/10 px-0 pt-0">
                <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-gold-400" />
                  Ticket Scanner & Gate Validation
                </CardTitle>
                <CardDescription className="text-white/60 text-xs font-mono">Scan QR codes, validate attendance credentials, and track admissions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                <TicketScanner />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <AdCreativeStudio 
              products={products || []} 
              articles={articles || []} 
              onAdCreated={() => refetchAds()} 
            />

            <Card className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/10 px-0 pt-0">
                <div>
                  <CardTitle className="text-xl font-heading font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-gold-400" />
                    Sponsored Content & Ads
                  </CardTitle>
                  <CardDescription className="text-white/60 text-xs font-mono">Manage viral campaign banners, sponsor takeovers, and impression analytics</CardDescription>
                </div>
                <Button
                  className="sg-btn"
                  onClick={() => {
                    setEditingAd(null);
                    resetAdForm();
                    setIsCreateAdModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Ad
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-0 pb-0">
                {adsLoading ? (
                  <div className="text-center py-12 text-white/60 font-mono text-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400 mx-auto" />
                    <p className="mt-2">Loading ads...</p>
                  </div>
                ) : sponsoredContent.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                    <Megaphone className="h-10 w-10 mx-auto mb-3 text-gray-500" />
                    <p className="font-medium text-white">No ads created yet</p>
                    <p className="text-sm text-gray-400 font-mono mt-1">Click "Create Ad" to get started</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-obsidian-card/80 shadow-inner">
                    <Table>
                      <TableHeader className="bg-white/5 border-b border-gold-500/20">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Title</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Type</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Views</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Clicks</TableHead>
                          <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Priority</TableHead>
                          <TableHead className="text-right text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sponsoredContent.map((ad: any) => (
                          <TableRow key={ad.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{ad.title}</p>
                                <p className="text-xs text-white/50 line-clamp-1">{ad.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-[11px] font-mono border-white/15 text-white/80">{ad.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider ${ad.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/5 text-white/40 border border-white/10"
                                }`}>
                                {ad.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm font-mono text-white/80">
                                <Eye className="h-3 w-3 text-gold-400" /> {ad.views || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm font-mono text-emerald-400">
                                <BarChart3 className="h-3 w-3" /> {ad.clicks || 0}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-gold-300 font-bold">{ad.priority || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-white/20 text-white hover:bg-white/10 rounded-lg"
                                  onClick={() => handleEditAd(ad)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() => handleDeleteAd(ad.id, ad.title)}
                                  disabled={deleteAdMutation.isPending}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="media">
            <div className="glass-obsidian-strong border border-gold-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white">
              <AdminMediaPage embedded />
            </div>
          </TabsContent>
          <TabsContent value="affiliates">
            <AffiliateManager />
          </TabsContent>
          <TabsContent value="magazine">
            <MagazineAdminManager />
          </TabsContent>
          <TabsContent value="theme">
            <BackgroundVideoManager />
          </TabsContent>
        </Tabs>
        </div>

        {/* Create/Edit Ad Dialog */}
        <Dialog open={isCreateAdModalOpen} onOpenChange={setIsCreateAdModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}</DialogTitle>
              <DialogDescription>Fill in the details for your advertisement.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-title">Title *</Label>
                  <Input
                    id="ad-title"
                    value={adFormData.title}
                    onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                    required
                    placeholder="Enter ad title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-type">Type *</Label>
                  <Select
                    value={adFormData.type}
                    onValueChange={(value) => setAdFormData({ ...adFormData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="event">AdminEvent</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-description">Description *</Label>
                <Textarea
                  id="ad-description"
                  value={adFormData.description}
                  onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })}
                  required
                  placeholder="Enter ad description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-link">Link URL</Label>
                  <Input
                    id="ad-link"
                    value={adFormData.linkUrl}
                    onChange={(e) => setAdFormData({ ...adFormData, linkUrl: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-cta">CTA Text</Label>
                  <Input
                    id="ad-cta"
                    value={adFormData.ctaText}
                    onChange={(e) => setAdFormData({ ...adFormData, ctaText: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-bg-color">Background Color</Label>
                  <Input
                    id="ad-bg-color"
                    value={adFormData.backgroundColor}
                    onChange={(e) => setAdFormData({ ...adFormData, backgroundColor: e.target.value })}
                    placeholder="bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-text-color">Text Color</Label>
                  <Input
                    id="ad-text-color"
                    value={adFormData.textColor}
                    onChange={(e) => setAdFormData({ ...adFormData, textColor: e.target.value })}
                    placeholder="text-white"
                  />
                </div>
              </div>

              {(adFormData.type === 'product' || adFormData.type === 'event') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {adFormData.type === 'product' && (
                    <div className="space-y-2">
                      <Label htmlFor="ad-price">Price</Label>
                      <Input
                        id="ad-price"
                        value={adFormData.price}
                        onChange={(e) => setAdFormData({ ...adFormData, price: e.target.value })}
                        placeholder="$99.99"
                      />
                    </div>
                  )}
                  {adFormData.type === 'event' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ad-event-date">AdminEvent Date</Label>
                        <Input
                          id="ad-event-date"
                          value={adFormData.eventDate}
                          onChange={(e) => setAdFormData({ ...adFormData, eventDate: e.target.value })}
                          placeholder="March 15, 2024"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ad-location">Location</Label>
                        <Input
                          id="ad-location"
                          value={adFormData.location}
                          onChange={(e) => setAdFormData({ ...adFormData, location: e.target.value })}
                          placeholder="New York, NY"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {adFormData.type === 'video' && (
                <div className="space-y-2">
                  <Label>Upload Video</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleAdVideoUpload}
                      className="flex-1"
                    />
                    {adVideoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (adVideoPreview) URL.revokeObjectURL(adVideoPreview);
                          setAdVideoPreview(null);
                          setAdUploadedVideo(null);
                          setAdFormData({ ...adFormData, videoUrl: '' });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {adVideoPreview && (
                    <div className="mt-2 relative w-full max-w-xs mx-auto">
                      <video src={adVideoPreview} controls className="rounded border h-32 w-full object-cover" />
                    </div>
                  )}
                  <div className="mt-2">
                    <Label htmlFor="ad-video-url">Or paste Video URL</Label>
                    <Input
                      id="ad-video-url"
                      value={adFormData.videoUrl}
                      onChange={(e) => setAdFormData({ ...adFormData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      type="url"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Advertisement Image</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAdImageUpload}
                    className="flex-1"
                  />
                  {adImagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdImagePreview(null);
                        setAdUploadedImage(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {adImagePreview && (
                  <div className="mt-2 relative w-full max-w-xs mx-auto">
                    <img src={adImagePreview} alt="Ad Preview" className="rounded border object-cover h-32 w-full" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-priority">Priority</Label>
                  <Input
                    id="ad-priority"
                    type="number"
                    value={adFormData.priority}
                    onChange={(e) => setAdFormData({ ...adFormData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-start-date">Start Date</Label>
                  <Input
                    id="ad-start-date"
                    type="date"
                    value={adFormData.startDate}
                    onChange={(e) => setAdFormData({ ...adFormData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ad-end-date">End Date</Label>
                  <Input
                    id="ad-end-date"
                    type="date"
                    value={adFormData.endDate}
                    onChange={(e) => setAdFormData({ ...adFormData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ad-active"
                  checked={adFormData.isActive}
                  onChange={(e) => setAdFormData({ ...adFormData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="ad-active">Active (will be displayed on site)</Label>
              </div>

              <DialogFooter className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateAdModalOpen(false);
                    setEditingAd(null);
                    resetAdForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAdMutation.isPending || updateAdMutation.isPending}
                  className="sg-btn"
                >
                  {(createAdMutation.isPending || updateAdMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {editingAd ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingAd ? 'Update Ad' : 'Create Ad'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div >
  );
}
