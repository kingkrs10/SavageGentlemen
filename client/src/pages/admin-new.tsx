import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  Package,
  Calendar, 
  Users, 
  Ticket as TicketIcon, 
  ShoppingCart,
  Lock,
  Radio,
  MoreHorizontal,
  Plus,
  Trash2
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
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [livestreamDialogOpen, setLivestreamDialogOpen] = useState(false);
  
  // Current item being edited states
  const [currentLivestream, setCurrentLivestream] = useState<Livestream | null>(null);
  
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
  
  // Filter tickets by selected event
  const displayedTickets = selectedEventId
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
      
      // Combine date and time
      const dateTimeString = `${livestreamForm.streamDate}T${livestreamForm.streamTime || '00:00'}:00`;
      const streamDate = new Date(dateTimeString);
      
      // Create payload
      const livestreamData = {
        title: livestreamForm.title,
        description: livestreamForm.description,
        streamDate,
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
      
      // Combine date and time
      const dateTimeString = `${livestreamForm.streamDate}T${livestreamForm.streamTime || '00:00'}:00`;
      const streamDate = new Date(dateTimeString);
      
      // Create payload
      const livestreamData = {
        id: currentLivestream.id,
        title: livestreamForm.title,
        description: livestreamForm.description,
        streamDate,
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
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      console.log("Delete user response:", response);

      toast({
        title: "User Deleted",
        description: "User has been successfully deleted",
      });

      // Refresh the users list
      queryClient.invalidateQueries({queryKey: ["/api/admin/users"]});
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // More specific error message
      let errorMessage = "Failed to delete user";
      if (error instanceof Error && error.message.includes("Cannot delete yourself")) {
        errorMessage = "You cannot delete your own account for security reasons.";
      } else if (error instanceof Error && error.message.includes("User not found")) {
        errorMessage = "User not found. They may have already been deleted.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="livestreams">Livestreams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Users</CardTitle>
                <Button 
                  size="sm" 
                  className="sg-btn"
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
                  </div>
                ) : users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Display Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
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
                              <div className="flex items-center space-x-2">
                                <Select 
                                  defaultValue={user.role} 
                                  onValueChange={(value) => handleChangeUserRole(user.id, value)}
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
                    Fill in the details to create a new user.
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
                    />
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={userForm.password}
                      onChange={(e) => 
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                    />
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
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="sg-btn" 
                    onClick={handleCreateUser}
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
        </Tabs>
      </div>
    </div>
  );
}