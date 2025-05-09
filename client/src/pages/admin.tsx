import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface Event {
  id: number;
  title: string;
  date: Date | string;
  location: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  featured?: boolean;
}

interface Ticket {
  id: number;
  name: string;
  price: number;
  eventId: number;
  quantity: number;
  remainingQuantity: number;
  isActive: boolean;
  maxPerPurchase?: number;
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
import { 
  PackageOpen, 
  Calendar, 
  Users, 
  Ticket as TicketIcon, 
  ShoppingCart,
  Lock,
  Radio,
  MoreHorizontal
} from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number>(1); // Default to first event for development
  const [ticketForm, setTicketForm] = useState({
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
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    price: 0,
    description: '',
    imageUrl: '',
    category: 'party',
    featured: false
  });
  
  React.useEffect(() => {
    // Check if user is logged in and is admin
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // Create a mock admin user for development
        if (!user.role || user.role !== "admin") {
          const adminUser = {
            ...user,
            role: "admin"
          };
          setCurrentUser(adminUser);
          localStorage.setItem("user", JSON.stringify(adminUser));
          console.log("User upgraded to admin for development purposes");
        }
        
        // In production we would check role here
        // if (user.role !== "admin") {
        //   toast({
        //     title: "Access Denied",
        //     description: "You must be an admin to view this page",
        //     variant: "destructive"
        //   });
        //   navigate("/");
        // }
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    } else {
      // Create a mock user for development purposes
      const mockAdminUser = {
        id: 1,
        username: "admin",
        displayName: "Admin User",
        avatar: null,
        email: "admin@example.com",
        role: "admin",
        isGuest: false
      };
      setCurrentUser(mockAdminUser);
      localStorage.setItem("user", JSON.stringify(mockAdminUser));
      console.log("Created mock admin user for development");
    }
  }, [navigate, toast]);

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
  } = useQuery<Event[]>({
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
      const response = await fetch(`/api/admin/tickets/event/${eventId}`);
      
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
      price: ticket.price,
      quantity: ticket.quantity,
      description: ticket.description || '',
      // Essential tab fields
      maxPerPurchase: ticket.maxPerPurchase || 4,
      isActive: ticket.isActive !== null ? ticket.isActive : true,
      // Advanced tab fields - populate with defaults or existing values
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
      const response = await fetch(`/api/admin/livestreams/${livestream.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update livestream status');
      }
      
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

  const handleToggleTicketStatus = async (ticket: Ticket) => {
    try {
      // Toggle the status
      const newStatus = !ticket.isActive;
      
      // Make API call to update the ticket's status
      const response = await fetch(`/api/admin/tickets/${ticket.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }
      
      const result = await response.json();
      
      toast({
        title: `Ticket ${newStatus ? 'Activated' : 'Deactivated'}`,
        description: `The ticket "${ticket.name}" is now ${newStatus ? 'active' : 'inactive'}`,
      });
      
      // Refresh the tickets list
      if (selectedEventId) {
        fetchTicketsForEvent(selectedEventId);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

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

  // Event creation handler
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

      // Convert form data to the format expected by the API
      // Convert the price from dollars to cents for storage
      const priceInCents = Math.round(eventForm.price * 100);
      
      // Combine date and time into a single Date object
      const dateTimeString = `${eventForm.date}T${eventForm.time || '00:00:00'}`;
      const eventDate = new Date(dateTimeString);
      
      // Prepare data for API
      const eventData = {
        title: eventForm.title,
        date: eventDate,
        location: eventForm.location,
        price: priceInCents,
        description: eventForm.description || null,
        imageUrl: eventForm.imageUrl || null,
        category: eventForm.category || 'party',
        featured: eventForm.featured
      };

      // Make API call to create event
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const result = await response.json();
      
      toast({
        title: "Event Created",
        description: `Event "${eventForm.title}" created successfully`,
      });
      
      // Close the dialog
      setEventDialogOpen(false);
      
      // Reset the form
      setEventForm({
        title: '',
        date: '',
        time: '',
        location: '',
        price: 0,
        description: '',
        imageUrl: '',
        category: 'party',
        featured: false
      });
      
      // Invalidate the events query to refetch events and update the UI
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
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamData),
      });

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
      queryClient.invalidateQueries({queryKey: ["/api/livestreams"]});
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
      // Prepare the complete ticket data for submission
      const ticketData = {
        eventId: selectedEventId,
        ...ticketForm,
        // Convert date strings to timestamps if needed
        salesStartDate: ticketForm.salesStartDate ? new Date(ticketForm.salesStartDate) : null,
        salesEndDate: ticketForm.salesEndDate ? new Date(ticketForm.salesEndDate) : null,
        // Ensure remainingQuantity starts equal to quantity
        remainingQuantity: ticketForm.quantity
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
      
      // Make API call to create or update the ticket
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save ticket');
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
      
      // Reset to Essential tab
      setActiveTab("essential");
      
      // In a production implementation, we would invalidate the tickets query to refetch tickets
      // queryClient.invalidateQueries(["/api/admin/tickets"]);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

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
            <div className="flex items-center gap-2">
              <span className="text-sm hidden md:inline">Logged in as: <span className="font-medium">{currentUser.username}</span></span>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        <Separator />
      
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <PackageOpen className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Events
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" /> Tickets
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="livestreams" className="flex items-center gap-2">
            <Radio className="h-4 w-4" /> Livestreams
          </TabsTrigger>
        </TabsList>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your merchandise and products.</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => toast({ title: "Feature coming soon" })}>
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="py-10 text-center">Loading products...</div>
              ) : productsError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading products. Please try again.
                </div>
              ) : products && products.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="h-12 w-12 overflow-hidden rounded border">
                              {product.imageUrl ? (
                                <img 
                                  src={getNormalizedImageUrl(product.imageUrl)} 
                                  alt={product.title} 
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                  <PackageOpen className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.title}</TableCell>
                          <TableCell>${(product.price / 100).toFixed(2)}</TableCell>
                          <TableCell>{product.category || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <PackageOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p className="text-sm text-gray-500">
                    Add your first product by clicking the "Add Product" button above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Events</CardTitle>
                <CardDescription>Manage events and performances</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => setEventDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" /> Add Event
              </Button>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="py-10 text-center">Loading events...</div>
              ) : eventsError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading events. Please try again.
                </div>
              ) : events && events.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="h-12 w-12 overflow-hidden rounded border">
                              {event.imageUrl ? (
                                <img 
                                  src={getNormalizedImageUrl(event.imageUrl)} 
                                  alt={event.title} 
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                  <Calendar className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            {typeof event.date === 'string' 
                              ? new Date(event.date).toLocaleDateString() 
                              : event.date.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>${(event.price / 100).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "Edit Event",
                                  description: "Coming soon"
                                })}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "Manage Tickets",
                                  description: "Coming soon"
                                })}
                              >
                                Tickets
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

          {/* Event Dialog */}
          <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
            <DialogContent className="sm:max-w-[450px] bg-[#141e2e] text-white">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Create new event</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new event to the system with appropriate details.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
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
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-white">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      className="bg-slate-700 border border-slate-600 text-white"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
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
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
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
                    onChange={(e) => setEventForm({...eventForm, price: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select 
                    value={eventForm.category} 
                    onValueChange={(value) => setEventForm({...eventForm, category: value})}
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
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="Enter image URL for the event"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={eventForm.imageUrl}
                    onChange={(e) => setEventForm({...eventForm, imageUrl: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="featured" 
                    checked={eventForm.featured}
                    onCheckedChange={(checked) => 
                      setEventForm({...eventForm, featured: checked === true})
                    }
                    className="data-[state=checked]:bg-red-500"
                  />
                  <label
                    htmlFor="featured"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                  >
                    Feature this event on homepage
                  </label>
                </div>
                
              </div>
              
              <DialogFooter className="flex space-x-2 justify-end">
                <Button
                  onClick={() => setEventDialogOpen(false)}
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEvent} 
                  className="sg-btn"
                >
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => setUserDialogOpen(true)}>
                <Users className="h-4 w-4 mr-2" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="py-10 text-center">Loading users...</div>
              ) : usersError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading users. Please try again.
                </div>
              ) : users && users.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Avatar</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="h-8 w-8 overflow-hidden rounded-full border">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.username} 
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                <div className="h-full w-full bg-primary flex items-center justify-center text-white text-xs">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.displayName || "—"}</TableCell>
                          <TableCell>{user.email || "—"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === "admin" 
                                ? "bg-red-100 text-red-700" 
                                : user.role === "moderator"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "Edit User",
                                  description: "Coming soon"
                                })}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "Change Role",
                                  description: "Coming soon"
                                })}
                              >
                                Role
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
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No users found</h3>
                  <p className="text-sm text-gray-500">
                    Add your first user by clicking the "Add User" button above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Dialog */}
          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogContent className="sm:max-w-[450px] bg-[#141e2e] text-white">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Create new user</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new user to the system with appropriate permissions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Enter display name"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={userForm.displayName}
                    onChange={(e) => setUserForm({...userForm, displayName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="bg-slate-700 border border-slate-600 text-white"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white">Role</Label>
                  <Select
                    value={userForm.role}
                    onValueChange={(value) => setUserForm({...userForm, role: value})}
                  >
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      <SelectItem value="user" className="text-white focus:bg-slate-700">User</SelectItem>
                      <SelectItem value="moderator" className="text-white focus:bg-slate-700">Moderator</SelectItem>
                      <SelectItem value="admin" className="text-white focus:bg-slate-700">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="bg-[#141e2e]">
                <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="sg-btn" onClick={handleCreateUser}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tickets</CardTitle>
                <CardDescription>Manage event tickets and ticket sales</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedEventId?.toString() || ""}
                  onValueChange={(value) => setSelectedEventId(Number(value))}
                >
                  <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {events && events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()} className="text-white focus:bg-slate-700">
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
                    // Default to the first event if available
                    if (events && events.length > 0) {
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
                  
                  {/* Event Selection */}
                  <div className="mb-4">
                    <select
                      id="event"
                      className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
                      value={selectedEventId}
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
                    <div className="flex w-full rounded-md overflow-hidden">
                      <button 
                        className={`flex-1 py-3 px-4 text-center ${activeTab === "essential" ? "bg-slate-700" : "bg-[#141e2e]"}`}
                        onClick={() => setActiveTab("essential")}
                      >
                        Essential
                      </button>
                      <button 
                        className={`flex-1 py-3 px-4 text-center ${activeTab === "advanced" ? "bg-slate-700" : "bg-[#141e2e]"}`}
                        onClick={() => setActiveTab("advanced")}
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
                          onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
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
                            onChange={(e) => setTicketForm({...ticketForm, quantity: Number(e.target.value)})}
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
                              onChange={(e) => setTicketForm({...ticketForm, price: Number(e.target.value)})}
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
                          onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
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
                            onChange={(e) => setTicketForm({...ticketForm, priceType: e.target.value})}
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
                            onChange={(e) => setTicketForm({...ticketForm, minPerOrder: Number(e.target.value)})}
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
                            onChange={(e) => setTicketForm({...ticketForm, maxPerPurchase: Number(e.target.value)})}
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
                            onChange={(e) => setTicketForm({...ticketForm, displayRemainingQuantity: e.target.value === "visible"})}
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
                              onChange={() => setTicketForm({...ticketForm, status: "on_sale"})}
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
                              onChange={() => setTicketForm({...ticketForm, status: "off_sale"})}
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
                              onChange={() => setTicketForm({...ticketForm, status: "sold_out"})}
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
                              onChange={() => setTicketForm({...ticketForm, status: "staff_only"})}
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
                          onChange={(e) => setTicketForm({...ticketForm, secretCode: e.target.value})}
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
                              onChange={(e) => setTicketForm({...ticketForm, salesStartDate: e.target.value})}
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
                              onChange={(e) => setTicketForm({...ticketForm, salesStartTime: e.target.value})}
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
                            onChange={(e) => setTicketForm({...ticketForm, hideBeforeSalesStart: e.target.checked})}
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
                              onChange={(e) => setTicketForm({...ticketForm, salesEndDate: e.target.value})}
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
                              onChange={(e) => setTicketForm({...ticketForm, salesEndTime: e.target.value})}
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
                            onChange={(e) => setTicketForm({...ticketForm, hideAfterSalesEnd: e.target.checked})}
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
                            onChange={(e) => setTicketForm({...ticketForm, hideIfSoldOut: e.target.checked})}
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
                            onChange={(e) => setTicketForm({...ticketForm, hidePriceIfSoldOut: e.target.checked})}
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
                      disabled={!ticketForm.name || ticketForm.price <= 0 || ticketForm.quantity <= 0}
                    >
                      SAVE
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="py-10 text-center">Loading tickets...</div>
              ) : ticketsError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading tickets. Please try again.
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Sold</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => {
                        const soldTickets = ticket.quantity - (ticket.remainingQuantity || 0);
                        const percentSold = Math.round((soldTickets / ticket.quantity) * 100);
                        
                        // Find the event name instead of just showing the ID
                        const event = events?.find(e => e.id === ticket.eventId);
                        const eventName = event ? event.title : `Event #${ticket.eventId}`;
                        
                        return (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.name}</TableCell>
                            <TableCell>{eventName}</TableCell>
                            <TableCell>${(ticket.price / 100).toFixed(2)}</TableCell>
                            <TableCell>{soldTickets} / {ticket.quantity}</TableCell>
                            <TableCell>{ticket.remainingQuantity || ticket.quantity}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                ticket.isActive 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {ticket.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditTicket(ticket)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant={ticket.isActive ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleTicketStatus(ticket)}
                                >
                                  {ticket.isActive ? "Deactivate" : "Activate"}
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
                  <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No tickets found</h3>
                  <p className="text-sm text-gray-500">
                    Create your first ticket type by clicking the "Create Ticket Type" button above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Manage customer orders and payments</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Export Orders", description: "Coming soon" })}>
                  Export
                </Button>
                <Button className="sg-btn" onClick={() => toast({ title: "View Reports", description: "Coming soon" })}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Reports
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="py-10 text-center">Loading orders...</div>
              ) : ordersError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading orders. Please try again.
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            {typeof order.createdAt === 'string' 
                              ? new Date(order.createdAt).toLocaleDateString() 
                              : order.createdAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{`User #${order.userId}`}</TableCell>
                          <TableCell>${(order.totalAmount / 100).toFixed(2)}</TableCell>
                          <TableCell>{order.paymentMethod || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === "completed" 
                                ? "bg-green-100 text-green-700" 
                                : order.status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toast({
                                  title: "View Order Details",
                                  description: "Coming soon"
                                })}
                              >
                                View
                              </Button>
                              {order.status !== "completed" && order.status !== "cancelled" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toast({
                                    title: "Update Order Status",
                                    description: "Coming soon"
                                  })}
                                >
                                  Update
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No orders found</h3>
                  <p className="text-sm text-gray-500">
                    Customer orders will appear here once they make purchases.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Livestreams Tab */}
        <TabsContent value="livestreams" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Livestreams</CardTitle>
                <CardDescription>Manage live streaming content</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => setLivestreamDialogOpen(true)}>
                <Radio className="h-4 w-4 mr-2" /> Add Livestream
              </Button>
            </CardHeader>
            <CardContent>
              {livestreamsLoading ? (
                <div className="py-10 text-center">Loading livestreams...</div>
              ) : livestreamsError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading livestreams. Please try again.
                </div>
              ) : livestreams && livestreams.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Thumbnail</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {livestreams.map((livestream) => (
                        <TableRow key={livestream.id}>
                          <TableCell>
                            <div className="h-12 w-12 overflow-hidden rounded border">
                              {livestream.thumbnailUrl ? (
                                <img 
                                  src={getNormalizedImageUrl(livestream.thumbnailUrl)} 
                                  alt={livestream.title} 
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                  <Radio className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{livestream.title}</TableCell>
                          <TableCell>
                            {typeof livestream.streamDate === 'string' 
                              ? new Date(livestream.streamDate).toLocaleDateString() 
                              : livestream.streamDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{livestream.hostName || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                              {livestream.platform || 'custom'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              livestream.isLive
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {livestream.isLive ? 'Live' : 'Upcoming'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
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
        </TabsContent>
      </Tabs>
      
      {/* Livestream Dialog */}
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
  );
}