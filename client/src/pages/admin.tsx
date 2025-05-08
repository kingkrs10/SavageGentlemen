import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  User, 
  Product, 
  Event, 
  Order, 
  DiscountCode,
  Ticket 
} from "@/lib/types";
import { 
  PlusCircle, 
  Trash, 
  Edit, 
  PackageOpen, 
  Calendar, 
  Users, 
  Ticket as TicketIcon, 
  Tag,
  ShoppingCart,
  Upload,
  Lock
} from "lucide-react";

const AdminPage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check if user is logged in and is admin
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        
        // If user is not admin, redirect to home
        if (user.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "You must be an admin to view this page",
            variant: "destructive"
          });
          navigate("/");
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
        navigate("/");
      }
    } else {
      // If no user is logged in, redirect to home
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin panel",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [navigate, toast]);

  // Fetch products
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!currentUser && currentUser.role === "admin"
  });

  // Fetch users
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!currentUser && currentUser.role === "admin"
  });

  // Fetch events
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: !!currentUser && currentUser.role === "admin"
  });

  // Fetch orders
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!currentUser && currentUser.role === "admin"
  });

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center">Admin Access Required</CardTitle>
            <CardDescription className="text-center">
              You must be logged in as an admin to view this page.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your products, events, users, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Logged in as: <span className="font-medium">{currentUser.username}</span></span>
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
            A
          </div>
        </div>
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
                <PlusCircle className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="py-10 text-center">Loading products...</div>
              ) : productsError ? (
                <div className="py-10 text-center text-red-500">
                  Error loading products. Please try again.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products && products.map((product) => (
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => toast({ title: "Feature coming soon" })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => toast({ title: "Feature coming soon" })}
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
                <CardDescription>Manage your events and tickets.</CardDescription>
              </div>
              <Button className="sg-btn" onClick={() => toast({ title: "Feature coming soon" })}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Event
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
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>${(event.price / 100).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => toast({ title: "Feature coming soon" })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => toast({ title: "Feature coming soon" })}
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
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No events found</h3>
                  <p className="text-sm text-gray-500">
                    Create your first event by clicking the "Add Event" button above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and permissions.</CardDescription>
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
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "admin" 
                                ? "bg-primary/20 text-primary" 
                                : user.role === "moderator"
                                ? "bg-blue-500/20 text-blue-500"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>{user.isGuest ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toast({ title: "Feature coming soon" })}
                            >
                              Change Role
                            </Button>
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
                    There are no users in the system yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tickets & Discount Codes</CardTitle>
                <CardDescription>Manage tickets and promotional codes.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button className="sg-btn" onClick={() => toast({ title: "Feature coming soon" })}>
                  <TicketIcon className="h-4 w-4 mr-2" /> Add Ticket
                </Button>
                <Button className="sg-btn" onClick={() => toast({ title: "Feature coming soon" })}>
                  <Tag className="h-4 w-4 mr-2" /> Add Discount
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center">
                <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">Ticket management</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create and manage tickets for your events.
                </p>
                <Button onClick={() => toast({ title: "Feature coming soon" })}>
                  Configure Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage customer orders.</CardDescription>
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
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>User #{order.userId}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>${(order.totalAmount / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === "completed" 
                                ? "bg-green-500/20 text-green-600" 
                                : order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-red-500/20 text-red-600"
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toast({ title: "Feature coming soon" })}
                            >
                              View Details
                            </Button>
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
                    There are no orders in the system yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;