import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
import { 
  PackageOpen, 
  Calendar, 
  Users, 
  Ticket as TicketIcon, 
  ShoppingCart,
  Lock
} from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
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
  
  // Fetch tickets
  const {
    data: tickets,
    isLoading: ticketsLoading,
    error: ticketsError
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
  
  // Handle ticket form submission
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
      
      // In a real implementation, this would be an API call:
      // const response = await fetch('/api/admin/tickets', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(ticketData),
      // });
      
      // const result = await response.json();
      
      toast({
        title: "Ticket Created",
        description: `New ticket "${ticketForm.name}" for event #${selectedEventId} created successfully`,
      });
      
      // Close the dialog
      setTicketDialogOpen(false);
      
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
          <TabsList className="grid grid-cols-5 mb-8">
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
                                  src={product.imageUrl} 
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
              <Button className="sg-btn" onClick={() => toast({ title: "Add Event Feature", description: "Coming soon" })}>
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
                                  src={event.imageUrl} 
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

          {/* Event Creation Form would go here */}
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => toast({ title: "Add User Feature", description: "Coming soon" })}>
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

          {/* User Creation Form would go here */}
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tickets</CardTitle>
                <CardDescription>Manage event tickets and ticket sales</CardDescription>
              </div>
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
                        const soldTickets = ticket.quantity - ticket.remainingQuantity;
                        const percentSold = Math.round((soldTickets / ticket.quantity) * 100);
                        
                        return (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.name}</TableCell>
                            <TableCell>{`Event #${ticket.eventId}`}</TableCell>
                            <TableCell>${(ticket.price / 100).toFixed(2)}</TableCell>
                            <TableCell>{soldTickets} / {ticket.quantity}</TableCell>
                            <TableCell>{ticket.remainingQuantity}</TableCell>
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
      </Tabs>
      </div>
    </div>
  );
}