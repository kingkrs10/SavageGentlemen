import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash, Users, Tag, Layers, Activity, BarChart, Eye, EyeOff, Search, Package, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Ticket,
  ShoppingCart,
  Lock,
  Radio,
  MoreHorizontal,
  Trash2,
  Edit,
  Calendar
} from "lucide-react";

// Interface definitions for the admin dashboard
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
  sku?: string | null;
  stockLevel?: number | null;
  lowStockThreshold?: number | null;
  inStock?: boolean | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
}

interface Event {
  id: number;
  title: string;
  date: Date | string;
  time?: string;
  endTime?: string;
  duration?: number;
  location: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  featured?: boolean;
  organizerName?: string;
  organizerEmail?: string;
}

interface Ticket {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  eventId: number;
  quantity: number;
  remainingQuantity: number;
  isActive: boolean;
  status?: string | null;
  priceType?: string | null;
  minPerOrder?: number | null;
  maxPerPurchase?: number | null;
  displayRemainingQuantity?: boolean | null;
  hideIfSoldOut?: boolean | null;
  hidePriceIfSoldOut?: boolean | null;
  secretCode?: string | null;
  salesStartDate?: Date | string | null; 
  salesStartTime?: string | null;
  salesEndDate?: Date | string | null;
  salesEndTime?: string | null;
  hideBeforeSalesStart?: boolean | null;
  hideAfterSalesEnd?: boolean | null;
  lockMinQuantity?: number | null;
  lockTicketTypeId?: number | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
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

interface AnalyticsData {
  totalPageViews: number;
  totalEventViews: number;
  totalProductViews: number;
  totalTicketSales: number;
  totalProductClicks: number;
  totalRevenue: string;
  totalNewUsers: number;
  totalActiveUsers: number;
  last7Days: {
    pageViews: number;
    eventViews: number;
    productViews: number;
    ticketSales: number;
    productClicks: number;
    revenue: string;
    newUsers: number;
    activeUsers: number;
  };
  dailyData: Array<{
    date: string;
    pageViews: number;
    eventViews: number;
    productViews: number;
    ticketSales: number;
    productClicks: number;
    revenue: number;
    newUsers: number;
    activeUsers: number;
  }>;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    role: 'user',
    avatar: ''
  });
  
  const [livestreamForm, setLivestreamForm] = useState({
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
  
  // State for event form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    duration: 180, // Default duration 3 hours in minutes
    location: '',
    imageUrl: '',
    category: 'concert',
    featured: false,
    organizerName: 'Savage Gentlemen',
    organizerEmail: 'info@savagegentlemen.com'
  });
  
  // State for ticket form
  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    price: 0,
    eventId: 0,
    quantity: 100,
    remainingQuantity: 100,
    maxPerPurchase: 4,
    isActive: true
  });
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [livestreamDialogOpen, setLivestreamDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  
  // Current item being edited states
  const [currentLivestream, setCurrentLivestream] = useState<Livestream | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  
  // Filtered users for search functionality
  const [filteredUsers, setFilteredUsers] = useState<User[] | null>(null);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  
  // Load current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        console.log("User loaded from localStorage:", user);
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    } else {
      // No user in localStorage, redirect to login
      console.warn("No user found in localStorage, redirecting to login");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch products
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch events
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Fetch users
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser,
  });
  
  // Fetch all tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError
  } = useQuery<Ticket[]>({
    queryKey: ["/api/admin/tickets"],
    enabled: !!currentUser,
  });
  
  // Fetch orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!currentUser,
  });
  
  // Fetch livestreams
  const {
    data: livestreams = [],
    isLoading: livestreamsLoading,
    error: livestreamsError
  } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams"],
    enabled: !!currentUser,
  });
  
  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError
  } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: !!currentUser,
  });
  
  // Filter tickets by selected event
  const displayedTickets = selectedEventId && selectedEventId !== "all"
    ? tickets.filter(ticket => ticket.eventId === parseInt(selectedEventId))
    : tickets;
  
  // Livestream handlers
  const handleCreateLivestream = async () => {
    try {
      // Validation
      if (!livestreamForm.title || !livestreamForm.streamDate) {
        toast({
          title: "Missing fields",
          description: "Title and date are required",
          variant: "destructive"
        });
        return;
      }
      
      // Combine date and time and send as an ISO string for proper parsing on the server
      const dateTimeString = `${livestreamForm.streamDate}T${livestreamForm.streamTime || '00:00'}:00`;
      
      // Create payload with streamDate as a proper Date object to match the schema
      const livestreamData = {
        title: livestreamForm.title,
        description: livestreamForm.description,
        streamDate: new Date(dateTimeString),
        thumbnailUrl: livestreamForm.thumbnailUrl,
        isLive: livestreamForm.isLive,
        hostName: livestreamForm.hostName,
        platform: livestreamForm.platform,
        // Platform-specific fields
        youtubeUrl: livestreamForm.platform === 'youtube' ? livestreamForm.youtubeUrl : null,
        twitchChannel: livestreamForm.platform === 'twitch' ? livestreamForm.twitchChannel : null,
        instagramUsername: livestreamForm.platform === 'instagram' ? livestreamForm.instagramUsername : null,
        facebookUrl: livestreamForm.platform === 'facebook' ? livestreamForm.facebookUrl : null,
        tiktokUsername: livestreamForm.platform === 'tiktok' ? livestreamForm.tiktokUsername : null,
        customStreamUrl: livestreamForm.platform === 'custom' ? livestreamForm.customStreamUrl : null,
        embedCode: livestreamForm.platform === 'custom' ? livestreamForm.embedCode : null
      };
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('POST', '/api/admin/livestreams', livestreamData);
      const result = await response.json();
      
      toast({
        title: "Livestream Created",
        description: `Livestream "${livestreamForm.title}" created successfully`,
      });
      
      // Close dialog and reset form
      setLivestreamDialogOpen(false);
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
      
      // Refresh livestreams list
      queryClient.invalidateQueries({queryKey: ["/api/livestreams"]});
    } catch (error) {
      console.error("Failed to create livestream:", error);
      toast({
        title: "Error",
        description: "Failed to create livestream. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // This uses the same logic as handleCreateLivestream but ensures currentLivestream is defined
  const handleUpdateLivestream = async () => {
    if (!currentLivestream) {
      console.error("No livestream selected for update");
      return;
    }
    
    try {
      // Validation
      if (!livestreamForm.title || !livestreamForm.streamDate) {
        toast({
          title: "Missing fields",
          description: "Title and date are required",
          variant: "destructive"
        });
        return;
      }
      
      // Combine date and time and create a proper Date object
      const dateTimeString = `${livestreamForm.streamDate}T${livestreamForm.streamTime || '00:00'}:00`;
      
      // Create payload with streamDate as a proper Date object
      const livestreamData = {
        id: currentLivestream.id,
        title: livestreamForm.title,
        description: livestreamForm.description,
        streamDate: new Date(dateTimeString),
        thumbnailUrl: livestreamForm.thumbnailUrl,
        isLive: livestreamForm.isLive,
        hostName: livestreamForm.hostName,
        platform: livestreamForm.platform,
        // Platform-specific fields
        youtubeUrl: livestreamForm.platform === 'youtube' ? livestreamForm.youtubeUrl : null,
        twitchChannel: livestreamForm.platform === 'twitch' ? livestreamForm.twitchChannel : null,
        instagramUsername: livestreamForm.platform === 'instagram' ? livestreamForm.instagramUsername : null,
        facebookUrl: livestreamForm.platform === 'facebook' ? livestreamForm.facebookUrl : null,
        tiktokUsername: livestreamForm.platform === 'tiktok' ? livestreamForm.tiktokUsername : null,
        customStreamUrl: livestreamForm.platform === 'custom' ? livestreamForm.customStreamUrl : null,
        embedCode: livestreamForm.platform === 'custom' ? livestreamForm.embedCode : null
      };
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('PUT', `/api/admin/livestreams/${currentLivestream.id}`, livestreamData);
      const result = await response.json();
      
      toast({
        title: "Livestream Updated",
        description: `Livestream "${livestreamForm.title}" updated successfully`,
      });
      
      // Close dialog and reset
      setLivestreamDialogOpen(false);
      setCurrentLivestream(null);
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
      
      // Refresh livestreams list
      queryClient.invalidateQueries({queryKey: ["/api/livestreams"]});
    } catch (error) {
      console.error("Failed to update livestream:", error);
      toast({
        title: "Error",
        description: "Failed to update livestream. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleLivestreamStatus = async (livestream: Livestream) => {
    try {
      // Toggle the isLive status
      const newStatus = !livestream.isLive;
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('PUT', `/api/admin/livestreams/${livestream.id}/toggle-status`);
      const result = await response.json();
      
      toast({
        title: newStatus ? 'Stream Set to Live' : 'Stream Set to Offline',
        description: `The livestream "${livestream.title}" is now ${newStatus ? 'live' : 'offline'}`,
      });
      
      // Refresh the livestreams list
      queryClient.invalidateQueries({queryKey: ["/api/livestreams"]});
    } catch (error) {
      console.error('Error updating livestream status:', error);
      toast({
        title: "Error",
        description: "Failed to update livestream status",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteLivestream = async (livestreamId: number) => {
    // Confirm before deletion
    if (!confirm("Are you sure you want to delete this livestream? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('DELETE', `/api/admin/livestreams/${livestreamId}`);
      
      toast({
        title: "Livestream Deleted",
        description: "Livestream has been successfully deleted",
      });
      
      // Refresh the livestreams list
      queryClient.invalidateQueries({queryKey: ["/api/livestreams"]});
    } catch (error) {
      console.error('Error deleting livestream:', error);
      toast({
        title: "Error",
        description: "Failed to delete livestream. Please try again.",
        variant: "destructive",
      });
    }
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
  
  // Event handlers
  const handleCreateEvent = async () => {
    try {
      // Validation
      if (!eventForm.title || !eventForm.date || !eventForm.location) {
        toast({
          title: "Missing fields",
          description: "Title, date, and location are required",
          variant: "destructive"
        });
        return;
      }
      
      // Combine date and time
      const dateTimeString = `${eventForm.date}T${eventForm.time || '19:00'}:00`;
      
      // Create payload with date properly formatted for the server
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        date: new Date(dateTimeString), // Convert to Date object explicitly
        time: eventForm.time || '19:00',
        endTime: eventForm.endTime || '',
        duration: eventForm.duration || 180,
        location: eventForm.location,
        imageUrl: eventForm.imageUrl,
        category: eventForm.category,
        featured: eventForm.featured,
        organizerName: eventForm.organizerName || 'Savage Gentlemen',
        organizerEmail: eventForm.organizerEmail || 'info@savagegentlemen.com'
      };
      
      console.log("Sending event data:", JSON.stringify({
        ...eventData,
        date: eventData.date.toISOString() // Log as ISO string for debugging
      }));
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('POST', '/api/admin/events', eventData);
      const result = await response.json();
      
      toast({
        title: "Event Created",
        description: `Event "${eventForm.title}" created successfully`,
      });
      
      // Close dialog and reset form
      setEventDialogOpen(false);
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        endTime: '',
        duration: 180,
        location: '',
        imageUrl: '',
        category: 'concert',
        featured: false,
        organizerName: 'Savage Gentlemen',
        organizerEmail: 'info@savagegentlemen.com'
      });
      
      // Refresh events list
      queryClient.invalidateQueries({queryKey: ["/api/events"]});
    } catch (error) {
      console.error("Failed to create event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateEvent = async () => {
    if (!currentEvent) {
      console.error("No event selected for update");
      return;
    }
    
    try {
      // Validation
      if (!eventForm.title || !eventForm.date || !eventForm.location) {
        toast({
          title: "Missing fields",
          description: "Title, date, and location are required",
          variant: "destructive"
        });
        return;
      }
      
      // Combine date and time
      const dateTimeString = `${eventForm.date}T${eventForm.time || '19:00'}:00`;
      
      // Create payload with date properly formatted for the server
      const eventData = {
        id: currentEvent.id,
        title: eventForm.title,
        description: eventForm.description,
        date: new Date(dateTimeString), // Convert to Date object explicitly
        time: eventForm.time || '19:00',
        endTime: eventForm.endTime || '',
        duration: eventForm.duration || 180,
        location: eventForm.location,
        imageUrl: eventForm.imageUrl,
        category: eventForm.category,
        featured: eventForm.featured,
        organizerName: eventForm.organizerName || 'Savage Gentlemen',
        organizerEmail: eventForm.organizerEmail || 'info@savagegentlemen.com'
      };
      
      console.log("Updating event data:", JSON.stringify({
        ...eventData,
        date: eventData.date.toISOString() // Log as ISO string for debugging
      }));
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('PUT', `/api/admin/events/${currentEvent.id}`, eventData);
      const result = await response.json();
      
      toast({
        title: "Event Updated",
        description: `Event "${eventForm.title}" updated successfully`,
      });
      
      // Close dialog and reset
      setEventDialogOpen(false);
      setCurrentEvent(null);
      setEventForm({
        title: '',
        description: '',
        date: '',
        time: '',
        endTime: '',
        duration: 180,
        location: '',
        imageUrl: '',
        category: 'concert',
        featured: false,
        organizerName: 'Savage Gentlemen',
        organizerEmail: 'info@savagegentlemen.com'
      });
      
      // Refresh events list
      queryClient.invalidateQueries({queryKey: ["/api/events"]});
    } catch (error) {
      console.error("Failed to update event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteEvent = async (eventId: number) => {
    // Confirm before deletion
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('DELETE', `/api/admin/events/${eventId}`);
      
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted",
      });
      
      // Refresh events list
      queryClient.invalidateQueries({queryKey: ["/api/events"]});
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditEvent = (event: Event) => {
    // Set the current event being edited
    setCurrentEvent(event);
    
    // Convert date to format expected by the form
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toISOString().split('T')[0];
    const formattedTime = eventDate.toISOString().split('T')[1].substring(0, 5);
    
    // Get end time if available or calculate based on duration
    let formattedEndTime = '';
    if (event.endTime) {
      formattedEndTime = event.endTime;
    } else if (event.time && event.duration) {
      // Calculate end time based on start time + duration
      const [hours, minutes] = event.time.split(':').map(num => parseInt(num));
      const durationHours = Math.floor(event.duration / 60);
      const durationMinutes = event.duration % 60;
      
      let endHours = hours + durationHours;
      let endMinutes = minutes + durationMinutes;
      
      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }
      
      endHours = endHours % 24; // Handle wrap around midnight
      
      formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
    
    // Populate the form with the event's data
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: formattedDate,
      time: formattedTime,
      endTime: formattedEndTime,
      duration: event.duration || 180,
      location: event.location,
      imageUrl: event.imageUrl || '',
      category: event.category || 'concert',
      featured: event.featured || false,
      organizerName: event.organizerName || 'Savage Gentlemen',
      organizerEmail: event.organizerEmail || 'info@savagegentlemen.com'
    });
    
    // Open the event dialog
    setEventDialogOpen(true);
  };
  
  // Ticket handlers
  const handleCreateTicket = async () => {
    try {
      // Validation
      if (!ticketForm.name || ticketForm.price < 0 || !ticketForm.eventId) {
        toast({
          title: "Missing fields",
          description: "Name, valid price (0 or more), and event are required",
          variant: "destructive"
        });
        return;
      }
      
      // Create ticket data
      const ticketData = {
        name: ticketForm.name,
        description: ticketForm.description,
        price: ticketForm.price,
        eventId: ticketForm.eventId,
        quantity: ticketForm.quantity,
        remainingQuantity: ticketForm.remainingQuantity,
        maxPerPurchase: ticketForm.maxPerPurchase,
        isActive: ticketForm.isActive
      };
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('POST', '/api/admin/tickets', ticketData);
      const result = await response.json();
      
      toast({
        title: "Ticket Created",
        description: `Ticket "${ticketForm.name}" created successfully`,
      });
      
      // Close dialog and reset form
      setTicketDialogOpen(false);
      setTicketForm({
        name: '',
        description: '',
        price: 0,
        eventId: 0,
        quantity: 100,
        remainingQuantity: 100,
        maxPerPurchase: 4,
        isActive: true
      });
      
      // Refresh tickets list
      await queryClient.invalidateQueries({queryKey: ["/api/admin/tickets"]});
      // Force a refetch to ensure UI is updated with new data
      await queryClient.refetchQueries({queryKey: ["/api/admin/tickets"]});
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateTicket = async () => {
    if (!currentTicket) {
      console.error("No ticket selected for update");
      return;
    }
    
    try {
      // Validation
      if (!ticketForm.name || ticketForm.price < 0 || !ticketForm.eventId) {
        toast({
          title: "Missing fields",
          description: "Name, valid price (0 or more), and event are required",
          variant: "destructive"
        });
        return;
      }
      
      // Create ticket data
      const ticketData = {
        id: currentTicket.id,
        name: ticketForm.name,
        description: ticketForm.description,
        price: ticketForm.price,
        eventId: ticketForm.eventId,
        quantity: ticketForm.quantity,
        remainingQuantity: ticketForm.remainingQuantity,
        maxPerPurchase: ticketForm.maxPerPurchase,
        isActive: ticketForm.isActive
      };
      
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('PUT', `/api/admin/tickets/${currentTicket.id}`, ticketData);
      const result = await response.json();
      
      toast({
        title: "Ticket Updated",
        description: `Ticket "${ticketForm.name}" updated successfully`,
      });
      
      // Close dialog and reset
      setTicketDialogOpen(false);
      setCurrentTicket(null);
      setTicketForm({
        name: '',
        description: '',
        price: 0,
        eventId: 0,
        quantity: 100,
        remainingQuantity: 100,
        maxPerPurchase: 4,
        isActive: true
      });
      
      // Refresh tickets list
      await queryClient.invalidateQueries({queryKey: ["/api/admin/tickets"]});
      // Force a refetch to ensure UI is updated with new data
      await queryClient.refetchQueries({queryKey: ["/api/admin/tickets"]});
    } catch (error) {
      console.error("Failed to update ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleTicketStatus = async (ticketId: number) => {
    try {
      // Use apiRequest instead of direct fetch
      const response = await apiRequest('PUT', `/api/admin/tickets/${ticketId}/toggle-status`);
      const result = await response.json();
      
      toast({
        title: "Ticket Status Updated",
        description: "Ticket status has been successfully updated",
      });
      
      // Refresh tickets list
      await queryClient.invalidateQueries({queryKey: ["/api/admin/tickets"]});
      // Force a refetch to ensure UI is updated with new data
      await queryClient.refetchQueries({queryKey: ["/api/admin/tickets"]});
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };
  
  const handleEditTicket = (ticket: Ticket) => {
    // Set the current ticket being edited
    setCurrentTicket(ticket);
    
    console.log("Editing ticket:", ticket);
    
    // Populate the form with the ticket's data
    setTicketForm({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price,
      eventId: ticket.eventId,
      quantity: ticket.quantity,
      remainingQuantity: ticket.remainingQuantity,
      maxPerPurchase: ticket.maxPerPurchase || 4,
      isActive: ticket.isActive
    });
    
    // Open the ticket dialog
    setTicketDialogOpen(true);
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

      // Use apiRequest instead of direct fetch
      const response = await apiRequest('POST', '/api/admin/users', userData);
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
        role: 'user',
        avatar: ''
      });
      
      // Invalidate the users query to refetch users and update the UI
      queryClient.invalidateQueries({queryKey: ["/api/admin/users"]});
    } catch (error) {
      console.error("Failed to create user:", error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Role change handler
  const handleChangeUserRole = async (userId: number, newRole: string) => {
    try {
      // Use the apiRequest function instead of fetch directly
      await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role: newRole });

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });

      // Refresh the users list
      queryClient.invalidateQueries({queryKey: ["/api/admin/users"]});
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };
  
  // User deletion handler
  const handleDeleteUser = async (userId: number) => {
    // Check if user is trying to delete themselves
    if (currentUser && userId === currentUser.id) {
      toast({
        title: "Cannot Delete Own Account",
        description: "You cannot delete your own account for security reasons.",
        variant: "destructive",
      });
      return;
    }
    
    // Confirm before deletion
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Use the apiRequest function instead of fetch directly
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 
          'user-id': currentUser?.id.toString() || ''
        },
        credentials: 'include'
      });
      
      // Handle response based on status code
      if (response.status === 204) {
        console.log("User deleted successfully");
        toast({
          title: "User Deleted",
          description: "User has been successfully deleted",
        });
        
        // Refresh the users list
        queryClient.invalidateQueries({queryKey: ["/api/admin/users"]});
      } else {
        // If it's not a 204, try to parse the error message
        let errorData = { message: "Unknown error occurred" };
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // More specific error message for network errors
      toast({
        title: "Error",
        description: "Network error while trying to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render main component
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your products, events, users, and more.
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center space-x-2">
              <div className="flex flex-col items-end">
                <p className="text-sm font-medium">{currentUser.username}</p>
                <p className="text-xs text-muted-foreground">
                  {currentUser.role === "admin" 
                    ? "Administrator" 
                    : currentUser.role === "moderator" 
                    ? "Moderator" 
                    : "User"}
                </p>
              </div>
              <Avatar>
                <AvatarFallback>
                  {currentUser.displayName 
                    ? currentUser.displayName.split(" ").map(n => n[0]).join("").toUpperCase()
                    : currentUser.username.slice(0, 2).toUpperCase()
                  }
                </AvatarFallback>
                {currentUser.avatar && (
                  <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                )}
              </Avatar>
            </div>
          )}
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="livestreams">Livestreams</TabsTrigger>
            <TabsTrigger value="inventory">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>Inventory</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <div className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                <span>Analytics</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Events</CardTitle>
                <Button 
                  size="sm" 
                  className="sg-btn"
                  onClick={() => {
                    setCurrentEvent(null);
                    setEventForm({
                      title: '',
                      description: '',
                      date: '',
                      time: '',
                      endTime: '',
                      duration: 180,
                      location: '',
                      price: 0,
                      imageUrl: '',
                      category: 'concert',
                      featured: false,
                      organizerName: 'Savage Gentlemen',
                      organizerEmail: 'info@savagegentlemen.com'
                    });
                    setEventDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-lg font-medium">Loading events...</h3>
                  </div>
                ) : eventsError ? (
                  <div className="py-10 text-center text-red-500">
                    <h3 className="text-lg font-medium">Error loading events</h3>
                    <p className="text-sm">Please try again later</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {event.imageUrl ? (
                                    <img 
                                      src={event.imageUrl} 
                                      alt={event.title} 
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                  )}
                                </div>
                                <span>{event.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(event.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{event.location}</TableCell>
                            <TableCell>${event.price.toFixed(2)}</TableCell>
                            <TableCell>
                              {event.featured ? (
                                <Badge>Featured</Badge>
                              ) : (
                                <Badge variant="outline">Not Featured</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEventId(event.id.toString());
                                    // Switch to tickets tab
                                    const ticketsTab = document.querySelector('[value="tickets"]') as HTMLElement;
                                    if (ticketsTab) ticketsTab.click();
                                  }}
                                >
                                  <Ticket className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No events found</h3>
                    <p className="text-sm text-gray-500">
                      Create your first event by clicking the "Add Event" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{currentEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                  <DialogDescription>
                    {currentEvent 
                      ? "Update the details of your event." 
                      : "Fill in the details to create a new event."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter event title"
                      value={eventForm.title}
                      onChange={(e) => 
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter event description"
                      value={eventForm.description}
                      onChange={(e) => 
                        setEventForm({ ...eventForm, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => 
                          setEventForm({ ...eventForm, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">Start Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => 
                          setEventForm({ ...eventForm, time: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => 
                          setEventForm({ ...eventForm, endTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="0"
                        value={eventForm.duration}
                        onChange={(e) => 
                          setEventForm({ ...eventForm, duration: parseInt(e.target.value) || 180 })
                        }
                        placeholder="Event duration in minutes (e.g. 180)"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Enter event location"
                      value={eventForm.location}
                      onChange={(e) => 
                        setEventForm({ ...eventForm, location: e.target.value })
                      }
                    />
                  </div>
                  {/* Price field removed - use tickets for pricing */}
                  <div className="grid gap-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="Enter image URL (optional)"
                      value={eventForm.imageUrl}
                      onChange={(e) => 
                        setEventForm({ ...eventForm, imageUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={eventForm.category} 
                      onValueChange={(value) => setEventForm({...eventForm, category: value})}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concert">Concert</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="featured" 
                      checked={eventForm.featured}
                      onCheckedChange={(checked) => 
                        setEventForm({ ...eventForm, featured: !!checked })
                      }
                    />
                    <Label htmlFor="featured" className="font-normal cursor-pointer">
                      Feature this event on the homepage
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="sg-btn" 
                    onClick={currentEvent ? handleUpdateEvent : handleCreateEvent}
                  >
                    {currentEvent ? "Update Event" : "Create Event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="tickets">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Tickets</CardTitle>
                <div className="flex items-center space-x-2">
                  {events.length > 0 && (
                    <Select 
                      value={selectedEventId}
                      onValueChange={setSelectedEventId}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.length > 0 ? (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none">No events available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <Button 
                    size="sm" 
                    className="sg-btn"
                    onClick={() => {
                      if (events.length === 0) {
                        toast({
                          title: "No Events Available",
                          description: "You need to create at least one event before creating tickets.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setCurrentTicket(null);
                      setTicketForm({
                        name: '',
                        description: '',
                        price: 0,
                        eventId: events[0]?.id || 0,
                        quantity: 100,
                        remainingQuantity: 100,
                        maxPerPurchase: 4,
                        isActive: true
                      });
                      setTicketDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-lg font-medium">Loading tickets...</h3>
                  </div>
                ) : ticketsError ? (
                  <div className="py-10 text-center text-red-500">
                    <h3 className="text-lg font-medium">Error loading tickets</h3>
                    <p className="text-sm">Please try again later</p>
                  </div>
                ) : displayedTickets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Remaining</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedTickets.map((ticket) => {
                          const event = events.find(e => e.id === ticket.eventId);
                          return (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.name}</TableCell>
                              <TableCell>{event?.title || 'Unknown Event'}</TableCell>
                              <TableCell>${ticket.price.toFixed(2)}</TableCell>
                              <TableCell>{ticket.quantity}</TableCell>
                              <TableCell>{ticket.remainingQuantity}</TableCell>
                              <TableCell>
                                {ticket.isActive ? (
                                  <Badge variant="success">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditTicket(ticket)}
                                  >
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleToggleTicketStatus(ticket.id)}
                                  >
                                    {ticket.isActive ? (
                                      <EyeOff className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-green-500" />
                                    )}
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
                  <div className="py-10 text-center">
                    <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No tickets found</h3>
                    {events.length > 0 ? (
                      <p className="text-sm text-gray-500">
                        Create your first ticket by clicking the "Add Ticket" button above.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        You need to create an event before you can add tickets.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{currentTicket ? "Edit Ticket" : "Add New Ticket"}</DialogTitle>
                  <DialogDescription>
                    {currentTicket 
                      ? "Update the details of your ticket." 
                      : "Fill in the details to create a new ticket."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter ticket name"
                      value={ticketForm.name}
                      onChange={(e) => 
                        setTicketForm({ ...ticketForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ticketDescription">Description</Label>
                    <Textarea
                      id="ticketDescription"
                      placeholder="Enter ticket description"
                      value={ticketForm.description}
                      onChange={(e) => 
                        setTicketForm({ ...ticketForm, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="eventId">Event</Label>
                    <Select 
                      value={ticketForm.eventId ? ticketForm.eventId.toString() : "0"} 
                      onValueChange={(value) => setTicketForm({...ticketForm, eventId: parseInt(value)})}
                    >
                      <SelectTrigger id="eventId">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.length > 0 ? (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="0">No events available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter ticket price"
                        value={ticketForm.price}
                        onChange={(e) => 
                          setTicketForm({ ...ticketForm, price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Total Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="Enter total quantity"
                        value={ticketForm.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setTicketForm({ 
                            ...ticketForm, 
                            quantity: qty,
                            remainingQuantity: currentTicket ? ticketForm.remainingQuantity : qty
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="remainingQuantity">Remaining Quantity</Label>
                      <Input
                        id="remainingQuantity"
                        type="number"
                        min="0"
                        max={ticketForm.quantity}
                        placeholder="Enter remaining quantity"
                        value={ticketForm.remainingQuantity}
                        onChange={(e) => {
                          const remainingQty = parseInt(e.target.value) || 0;
                          const qty = Math.max(remainingQty, ticketForm.quantity);
                          setTicketForm({ 
                            ...ticketForm, 
                            remainingQuantity: remainingQty,
                            quantity: qty
                          });
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxPerPurchase">Max Per Purchase</Label>
                      <Input
                        id="maxPerPurchase"
                        type="number"
                        min="1"
                        placeholder="Enter max tickets per purchase"
                        value={ticketForm.maxPerPurchase}
                        onChange={(e) => 
                          setTicketForm({ ...ticketForm, maxPerPurchase: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isActive" 
                      checked={ticketForm.isActive}
                      onCheckedChange={(checked) => 
                        setTicketForm({ ...ticketForm, isActive: !!checked })
                      }
                    />
                    <Label htmlFor="isActive" className="font-normal cursor-pointer">
                      Make this ticket available for purchase
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="sg-btn" 
                    onClick={currentTicket ? handleUpdateTicket : handleCreateTicket}
                  >
                    {currentTicket ? "Update Ticket" : "Create Ticket"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
                  <div className="relative w-full md:w-[200px]">
                    <Input 
                      placeholder="Search users..." 
                      className="w-full pr-8"
                      onChange={(e) => {
                        // Filter users locally based on search term
                        const searchTerm = e.target.value.toLowerCase();
                        if (searchTerm && users) {
                          setFilteredUsers(
                            users.filter(user => 
                              user.username.toLowerCase().includes(searchTerm) || 
                              (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
                              (user.email && user.email.toLowerCase().includes(searchTerm))
                            )
                          );
                        } else {
                          setFilteredUsers(null);
                        }
                      }}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="h-4 w-4" />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="sg-btn w-full md:w-auto"
                    onClick={() => {
                      setUserForm({
                        username: "",
                        password: "",
                        displayName: "",
                        email: "",
                        role: "user",
                        avatar: ""
                      });
                      setUserDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-lg font-medium">Loading users...</h3>
                  </div>
                ) : usersError ? (
                  <div className="py-10 text-center text-red-500">
                    <h3 className="text-lg font-medium">Error loading users</h3>
                    <p className="text-sm">Please try again later</p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({queryKey: ["/api/admin/users"]})}
                      variant="outline" 
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (filteredUsers || users).length > 0 ? (
                  <>
                    {/* Desktop view: Table for md and larger screens */}
                    <div className="overflow-x-auto hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Display Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Auth Provider</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(filteredUsers || users).map((user) => (
                            <TableRow key={user.id} className={user.isGuest ? "bg-slate-50 dark:bg-slate-900/30" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {user.displayName 
                                        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase()
                                        : user.username.slice(0, 2).toUpperCase()
                                      }
                                    </AvatarFallback>
                                    {user.avatar && (
                                      <AvatarImage src={user.avatar} alt={user.username} />
                                    )}
                                  </Avatar>
                                  <span>{user.username}</span>
                                  {user.isGuest && (
                                    <Badge variant="outline" className="ml-1">Guest</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{user.displayName || "-"}</TableCell>
                              <TableCell>{user.email || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  user.role === "admin" ? "default" :
                                  user.role === "moderator" ? "secondary" :
                                  "outline"
                                }>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.username.startsWith('firebase_') ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Google
                                  </Badge>
                                ) : user.username.startsWith('guest-') ? (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    Guest
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Email
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Select 
                                    defaultValue={user.role} 
                                    onValueChange={(value) => handleChangeUserRole(user.id, value)}
                                    disabled={currentUser && user.id === currentUser.id}
                                  >
                                    <SelectTrigger className="h-8 w-[100px]">
                                      <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="moderator">Moderator</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={currentUser && user.id === currentUser.id}
                                    title={currentUser && user.id === currentUser.id ? "Cannot delete your own account" : "Delete user"}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Mobile view: Card-based layout for small screens */}
                    <div className="md:hidden space-y-4">
                      {(filteredUsers || users).map((user) => (
                        <div 
                          key={user.id} 
                          className={`rounded-lg border p-4 ${user.isGuest ? "bg-slate-50 dark:bg-slate-900/30" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {user.displayName 
                                    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase()
                                    : user.username.slice(0, 2).toUpperCase()
                                  }
                                </AvatarFallback>
                                {user.avatar && (
                                  <AvatarImage src={user.avatar} alt={user.username} />
                                )}
                              </Avatar>
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {user.username}
                                  {user.isGuest && (
                                    <Badge variant="outline" className="text-xs">Guest</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.displayName || "No display name"}
                                </div>
                              </div>
                            </div>
                            <Badge variant={
                              user.role === "admin" ? "default" :
                              user.role === "moderator" ? "secondary" :
                              "outline"
                            }>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid gap-1 text-sm mb-4">
                            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                              <span className="text-muted-foreground">Email</span>
                              <span className="font-medium">{user.email || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800">
                              <span className="text-muted-foreground">Auth Provider</span>
                              <span>
                                {user.username.startsWith('firebase_') ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Google
                                  </Badge>
                                ) : user.username.startsWith('guest-') ? (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    Guest
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Email
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Select 
                              defaultValue={user.role} 
                              onValueChange={(value) => handleChangeUserRole(user.id, value)}
                              disabled={currentUser && user.id === currentUser.id}
                            >
                              <SelectTrigger className="h-9 w-[120px]">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={currentUser && user.id === currentUser.id}
                              className={currentUser && user.id === currentUser.id ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-sm text-gray-500">
                      Create your first user by clicking the "Add User" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new user. Username and password are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={userForm.username}
                      onChange={(e) => 
                        setUserForm({ ...userForm, username: e.target.value })
                      }
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500">
                      Username must be unique and cannot be changed later
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="Enter display name"
                      value={userForm.displayName}
                      onChange={(e) => 
                        setUserForm({ ...userForm, displayName: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Name that will be visible to other users
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={userForm.email}
                      onChange={(e) => 
                        setUserForm({ ...userForm, email: e.target.value })
                      }
                      autoComplete="email"
                    />
                    <p className="text-xs text-gray-500">
                      Used for password recovery and notifications
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={userForm.password}
                        onChange={(e) => 
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                      </button>
                    </div>
                    {userForm.password && (
                      <div className="mt-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-1 flex-1 rounded-full ${userForm.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${/[a-z]/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          </div>
                          <ul className="text-xs text-gray-500 space-y-1 pl-4 list-disc">
                            <li className={userForm.password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
                            <li className={/[A-Z]/.test(userForm.password) ? 'text-green-500' : ''}>At least one uppercase letter</li>
                            <li className={/[a-z]/.test(userForm.password) ? 'text-green-500' : ''}>At least one lowercase letter</li>
                            <li className={/[0-9]/.test(userForm.password) ? 'text-green-500' : ''}>At least one number</li>
                            <li className={/[^A-Za-z0-9]/.test(userForm.password) ? 'text-green-500' : ''}>At least one special character</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={userForm.role} 
                      onValueChange={(value) => setUserForm({...userForm, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">
                        <strong>Permissions:</strong>
                        <ul className="pl-4 list-disc mt-1">
                          {userForm.role === 'admin' && (
                            <>
                              <li>Full access to all features</li>
                              <li>Can create other admin accounts</li>
                              <li>Can manage all content and users</li>
                              <li>Can access payment/financial data</li>
                            </>
                          )}
                          {userForm.role === 'moderator' && (
                            <>
                              <li>Can moderate community content</li>
                              <li>Can validate tickets at events</li>
                              <li>Limited admin dashboard access</li>
                              <li>Cannot access payment/financial data</li>
                            </>
                          )}
                          {userForm.role === 'user' && (
                            <>
                              <li>Standard user permissions</li>
                              <li>Can purchase tickets and products</li>
                              <li>Can participate in community</li>
                              <li>No admin access</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      placeholder="Enter avatar image URL (optional)"
                      value={userForm.avatar}
                      onChange={(e) => 
                        setUserForm({ ...userForm, avatar: e.target.value })
                      }
                    />
                    {userForm.avatar && (
                      <div className="mt-2 flex justify-center">
                        <Avatar className="h-20 w-20">
                          <AvatarFallback>
                            {userForm.displayName
                              ? userForm.displayName.split(" ").map(n => n[0]).join("").toUpperCase()
                              : userForm.username.slice(0, 2).toUpperCase()
                            }
                          </AvatarFallback>
                          <AvatarImage src={userForm.avatar} alt="Avatar preview" />
                        </Avatar>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="sg-btn" 
                    onClick={handleCreateUser}
                    disabled={!userForm.username || !userForm.password}
                  >
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="livestreams">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Livestreams</CardTitle>
                <Button 
                  size="sm" 
                  className="sg-btn"
                  onClick={() => {
                    setCurrentLivestream(null);
                    setLivestreamForm({
                      title: "",
                      description: "",
                      streamDate: "",
                      streamTime: "",
                      thumbnailUrl: "",
                      isLive: false,
                      hostName: "",
                      platform: "",
                      youtubeUrl: "",
                      twitchChannel: "",
                      instagramUsername: "",
                      facebookUrl: "",
                      tiktokUsername: "",
                      customStreamUrl: "",
                      embedCode: ""
                    });
                    setLivestreamDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Livestream
                </Button>
              </CardHeader>
              <CardContent>
                {livestreamsLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-lg font-medium">Loading livestreams...</h3>
                  </div>
                ) : livestreamsError ? (
                  <div className="py-10 text-center text-red-500">
                    <h3 className="text-lg font-medium">Error loading livestreams</h3>
                    <p className="text-sm">Please try again later</p>
                  </div>
                ) : livestreams.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Host</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {livestreams.map((livestream) => (
                          <TableRow key={livestream.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                {livestream.thumbnailUrl && (
                                  <img 
                                    src={livestream.thumbnailUrl} 
                                    alt={livestream.title} 
                                    className="h-8 w-8 rounded object-cover"
                                  />
                                )}
                                <span>{livestream.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(livestream.streamDate).toLocaleString()}</TableCell>
                            <TableCell>{livestream.hostName || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {livestream.platform ? livestream.platform.charAt(0).toUpperCase() + livestream.platform.slice(1) : "Default"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={livestream.isLive ? "default" : "secondary"}>
                                {livestream.isLive ? "Live" : "Scheduled"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditLivestream(livestream)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant={livestream.isLive ? "destructive" : "default"} 
                                  size="sm"
                                  onClick={() => handleToggleLivestreamStatus(livestream)}
                                >
                                  {livestream.isLive ? 'End Stream' : 'Go Live'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-200 hover:bg-red-100 hover:text-red-600"
                                  onClick={() => handleDeleteLivestream(livestream.id)}
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
                  <div className="py-10 text-center">
                    <Radio className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No livestreams found</h3>
                    <p className="text-sm text-gray-500">
                      Create your first livestream by clicking the "Add Livestream" button above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={livestreamDialogOpen} onOpenChange={setLivestreamDialogOpen}>
              <DialogContent className="sm:max-w-md md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {currentLivestream ? "Edit Livestream" : "Add New Livestream"}
                  </DialogTitle>
                  <DialogDescription>
                    {currentLivestream 
                      ? "Update the livestream details below." 
                      : "Fill in the details to create a new livestream."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter livestream title"
                      value={livestreamForm.title}
                      onChange={(e) => 
                        setLivestreamForm({ ...livestreamForm, title: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="streamDate">Date</Label>
                      <Input
                        id="streamDate"
                        type="date"
                        value={livestreamForm.streamDate}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, streamDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="streamTime">Time</Label>
                      <Input
                        id="streamTime"
                        type="time"
                        value={livestreamForm.streamTime}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, streamTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the livestream"
                      value={livestreamForm.description}
                      onChange={(e) =>
                        setLivestreamForm({ ...livestreamForm, description: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                    <Input
                      id="thumbnailUrl"
                      placeholder="Enter thumbnail image URL"
                      value={livestreamForm.thumbnailUrl}
                      onChange={(e) =>
                        setLivestreamForm({ ...livestreamForm, thumbnailUrl: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="hostName">Host Name</Label>
                    <Input
                      id="hostName"
                      placeholder="Enter host name"
                      value={livestreamForm.hostName}
                      onChange={(e) =>
                        setLivestreamForm({ ...livestreamForm, hostName: e.target.value })
                      }
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select 
                      value={livestreamForm.platform} 
                      onValueChange={(value) => setLivestreamForm({...livestreamForm, platform: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="twitch">Twitch</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Platform-specific fields */}
                  {livestreamForm.platform === 'youtube' && (
                    <div className="grid gap-2">
                      <Label htmlFor="youtubeUrl">YouTube URL</Label>
                      <Input
                        id="youtubeUrl"
                        placeholder="Enter YouTube video URL"
                        value={livestreamForm.youtubeUrl}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, youtubeUrl: e.target.value })
                        }
                      />
                    </div>
                  )}
                  
                  {livestreamForm.platform === 'twitch' && (
                    <div className="grid gap-2">
                      <Label htmlFor="twitchChannel">Twitch Channel</Label>
                      <Input
                        id="twitchChannel"
                        placeholder="Enter Twitch channel name"
                        value={livestreamForm.twitchChannel}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, twitchChannel: e.target.value })
                        }
                      />
                    </div>
                  )}
                  
                  {livestreamForm.platform === 'instagram' && (
                    <div className="grid gap-2">
                      <Label htmlFor="instagramUsername">Instagram Username</Label>
                      <Input
                        id="instagramUsername"
                        placeholder="Enter Instagram username"
                        value={livestreamForm.instagramUsername}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, instagramUsername: e.target.value })
                        }
                      />
                    </div>
                  )}
                  
                  {livestreamForm.platform === 'facebook' && (
                    <div className="grid gap-2">
                      <Label htmlFor="facebookUrl">Facebook Video URL</Label>
                      <Input
                        id="facebookUrl"
                        placeholder="Enter Facebook video URL"
                        value={livestreamForm.facebookUrl}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, facebookUrl: e.target.value })
                        }
                      />
                    </div>
                  )}
                  
                  {livestreamForm.platform === 'tiktok' && (
                    <div className="grid gap-2">
                      <Label htmlFor="tiktokUsername">TikTok Username</Label>
                      <Input
                        id="tiktokUsername"
                        placeholder="Enter TikTok username"
                        value={livestreamForm.tiktokUsername}
                        onChange={(e) =>
                          setLivestreamForm({ ...livestreamForm, tiktokUsername: e.target.value })
                        }
                      />
                    </div>
                  )}
                  
                  {livestreamForm.platform === 'custom' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="customStreamUrl">Custom Stream URL</Label>
                        <Input
                          id="customStreamUrl"
                          placeholder="Enter custom stream URL"
                          value={livestreamForm.customStreamUrl}
                          onChange={(e) =>
                            setLivestreamForm({ ...livestreamForm, customStreamUrl: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="embedCode">Embed Code (optional)</Label>
                        <Textarea
                          id="embedCode"
                          placeholder="Enter embed code for the custom stream"
                          value={livestreamForm.embedCode}
                          onChange={(e) =>
                            setLivestreamForm({ ...livestreamForm, embedCode: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isLive" 
                      checked={livestreamForm.isLive}
                      onCheckedChange={(checked) => 
                        setLivestreamForm({ ...livestreamForm, isLive: checked as boolean })
                      }
                    />
                    <Label htmlFor="isLive">Stream is currently live</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setLivestreamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="sg-btn" 
                    onClick={currentLivestream ? handleUpdateLivestream : handleCreateLivestream}
                  >
                    {currentLivestream ? "Update Livestream" : "Create Livestream"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="inventory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Inventory Management</CardTitle>
                <Button 
                  size="sm" 
                  className="sg-btn"
                  onClick={() => {
                    toast({
                      title: "Feature in Progress",
                      description: "The stock update form will be available soon",
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Update Stock
                </Button>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="py-10 text-center">
                    <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <h3 className="text-lg font-medium">Loading inventory data...</h3>
                  </div>
                ) : productsError ? (
                  <div className="py-10 text-center text-red-500">
                    <h3 className="text-lg font-medium">Error loading inventory data</h3>
                    <p className="text-sm">Please try again later</p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-5">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Stock Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                      <img 
                                        src={product.imageUrl} 
                                        alt={product.title} 
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Package className="h-5 w-5 text-gray-500" />
                                    )}
                                  </div>
                                  <span>{product.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {product.sku || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {product.stockLevel !== undefined ? (
                                  <div className="flex items-center">
                                    <span className={product.stockLevel < (product.lowStockThreshold || 5) ? 'text-red-500 font-medium' : ''}>
                                      {product.stockLevel}
                                    </span>
                                    {product.stockLevel < (product.lowStockThreshold || 5) && (
                                      <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                                    )}
                                  </div>
                                ) : (
                                  'Not tracked'
                                )}
                              </TableCell>
                              <TableCell>
                                {product.stockLevel !== undefined ? (
                                  product.stockLevel > 0 ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      In Stock
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                      Out of Stock
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline">Unknown</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Coming Soon",
                                        description: "Stock adjustment functionality will be available soon",
                                      });
                                    }}
                                  >
                                    <ArrowUp className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Coming Soon",
                                        description: "Stock adjustment functionality will be available soon",
                                      });
                                    }}
                                  >
                                    <ArrowDown className="h-4 w-4 text-amber-500" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Coming Soon",
                                        description: "View inventory history functionality will be available soon",
                                      });
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-blue-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-4">Inventory Alerts</h3>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {products
                          .filter(p => p.stockLevel !== undefined && p.stockLevel < (p.lowStockThreshold || 5))
                          .map(product => (
                            <Card key={`alert-${product.id}`} className="border-l-4 border-red-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">{product.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Stock level: <span className="text-red-500 font-semibold">{product.stockLevel}</span>
                                      {product.lowStockThreshold && (
                                        <span> (Threshold: {product.lowStockThreshold})</span>
                                      )}
                                    </p>
                                  </div>
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => {
                                      toast({
                                        title: "Coming Soon",
                                        description: "Restock functionality will be available soon",
                                      });
                                    }}
                                  >
                                    Restock Now
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        
                        {!products.some(p => p.stockLevel !== undefined && p.stockLevel < (p.lowStockThreshold || 5)) && (
                          <div className="col-span-full py-6 text-center bg-gray-50 rounded-md border border-dashed">
                            <p className="text-sm text-muted-foreground">No low stock alerts at this time.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No products found</h3>
                    <p className="text-sm text-gray-500">
                      Add products to start managing inventory.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Analytics Dashboard</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Redirect to full analytics dashboard
                      navigate("/analytics-dashboard");
                    }}
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Detailed View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsLoading ? (
                          <div className="text-3xl font-bold">--</div>
                        ) : analyticsError ? (
                          <div className="text-3xl font-bold text-red-500">Error</div>
                        ) : (
                          <div className="text-3xl font-bold">
                            {analyticsData?.totalPageViews.toLocaleString() || "0"}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {analyticsLoading 
                            ? "Loading data..." 
                            : analyticsError 
                            ? "Failed to load data" 
                            : `${analyticsData?.last7Days.pageViews.toLocaleString() || "0"} in the last 7 days`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Event Views</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsLoading ? (
                          <div className="text-3xl font-bold">--</div>
                        ) : analyticsError ? (
                          <div className="text-3xl font-bold text-red-500">Error</div>
                        ) : (
                          <div className="text-3xl font-bold">
                            {analyticsData?.totalEventViews.toLocaleString() || "0"}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {analyticsLoading 
                            ? "Loading data..." 
                            : analyticsError 
                            ? "Failed to load data" 
                            : `${analyticsData?.last7Days.eventViews.toLocaleString() || "0"} in the last 7 days`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsLoading ? (
                          <div className="text-3xl font-bold">--</div>
                        ) : analyticsError ? (
                          <div className="text-3xl font-bold text-red-500">Error</div>
                        ) : (
                          <div className="text-3xl font-bold">
                            {analyticsData?.totalRevenue || "$0.00"}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {analyticsLoading 
                            ? "Loading data..." 
                            : analyticsError 
                            ? "Failed to load data" 
                            : `${analyticsData?.last7Days.revenue || "$0.00"} in the last 7 days`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyticsLoading ? (
                          <div className="text-3xl font-bold">--</div>
                        ) : analyticsError ? (
                          <div className="text-3xl font-bold text-red-500">Error</div>
                        ) : (
                          <div className="text-3xl font-bold">
                            {analyticsData?.totalActiveUsers.toLocaleString() || "0"}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {analyticsLoading 
                            ? "Loading data..." 
                            : analyticsError 
                            ? "Failed to load data" 
                            : `${analyticsData?.totalNewUsers.toLocaleString() || "0"} new users total`}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Visualization</CardTitle>
                      <CardDescription>
                        Visit the full analytics dashboard for detailed insights and interactive charts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      {analyticsLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      ) : analyticsError ? (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <BarChart className="h-16 w-16 mx-auto text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-red-500">Error Loading Data</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              Failed to load analytics data. Please try again later.
                            </p>
                          </div>
                        </div>
                      ) : !analyticsData?.dailyData?.length ? (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <BarChart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium">No Data Available</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                              No analytics data has been recorded yet. Start collecting data by using your app.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={analyticsData.dailyData.slice(-7)} // Last 7 days
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="pageViews" 
                                stackId="1"
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                name="Page Views"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="eventViews" 
                                stackId="1"
                                stroke="#82ca9d" 
                                fill="#82ca9d" 
                                name="Event Views"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="productViews" 
                                stackId="1"
                                stroke="#ffc658" 
                                fill="#ffc658" 
                                name="Product Views"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}