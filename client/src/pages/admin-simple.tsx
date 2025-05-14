import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Plus,
  Download,
  Upload,
  Calendar,
  Ticket,
  Tag as TagIcon,
  DollarSign as DollarSignIcon,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions for admin panel
interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  price: string;
  imageUrl?: string;
  location?: string;
}

interface Ticket {
  id: number;
  name: string;
  eventId: number;
  eventName?: string;
  price: string;
  quantity?: number;
  status?: 'active' | 'inactive';
}

export default function AdminSimplePage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = React.useState("events");
  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = React.useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = React.useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = React.useState(false);
  const [ticketFormData, setTicketFormData] = React.useState({
    name: '',
    price: '0.00',
    quantity: '100',
    status: 'active',
    eventId: 0,
    description: '',
    ticketType: 'essential', // 'essential' or 'advanced'
    priceType: 'standard',
    minQuantityPerOrder: '',
    maxQuantityPerOrder: '',
    displayRemainingQuantity: true,
    payWhatYouCan: false,
    salesStartDate: '',
    salesStartTime: '',
    salesEndDate: '',
    salesEndTime: '',
    hideBeforeSalesStart: false,
    hideAfterSalesEnd: false,
    secretCode: '',
    hideIfSoldOut: true,
    hidePriceIfSoldOut: true
  });
  const [eventFormData, setEventFormData] = React.useState({
    id: 0,
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: '',
    imageUrl: ''
  });

  // Event Queries
  const { 
    data: events = [] as Event[], 
    isLoading: eventsLoading 
  } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    enabled: true,
  });

  // Ticket Queries
  const { 
    data: tickets = [] as Ticket[], 
    isLoading: ticketsLoading 
  } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
    enabled: true,
  });
  
  // Delete Event Mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await apiRequest('DELETE', `/api/admin/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    }
  });
  
  // Delete Ticket Mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('DELETE', `/api/admin/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    }
  });
  
  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (newTicket: any) => {
      return await apiRequest('POST', '/api/admin/tickets', newTicket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setIsCreateTicketModalOpen(false);
    }
  });
  
  // Create Event Mutation 
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      return await apiRequest('POST', '/api/admin/events', newEvent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateEventModalOpen(false);
    }
  });
  
  // Edit Event Mutation
  const editEventMutation = useMutation({
    mutationFn: async (event: any) => {
      return await apiRequest('PUT', `/api/admin/events/${event.id}`, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsEditEventModalOpen(false);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>Create and manage events</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEventFormData({
                    id: 0,
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '19:00',
                    location: '',
                    imageUrl: ''
                  });
                  setIsCreateEventModalOpen(true);
                  toast({
                    title: "Create Event",
                    description: "Opening event creation form...",
                  });
                  console.log("Create event button clicked");
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <p>Loading events...</p>
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {events.map((event) => (
                    <Card key={event.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-4">
                        <div className="aspect-video md:aspect-square bg-muted md:col-span-1">
                          {event.imageUrl ? (
                            <img 
                              src={event.imageUrl} 
                              alt={event.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <Calendar className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-3 p-6">
                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(event.date).toLocaleDateString()}
                              {event.time && ` at ${event.time}`}
                            </div>
                            <div className="flex items-center text-sm font-semibold">
                              <DollarSignIcon className="h-4 w-4 mr-2" />
                              ${parseFloat(event.price).toFixed(2)}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                // Navigate to the tickets tab
                                setActiveTab("tickets");
                                // Set the selected event ID for filtering tickets
                                setSelectedEventId(event.id);
                                console.log(`Managing tickets for event ID: ${event.id}`);
                                toast({
                                  title: "Managing Tickets",
                                  description: `Showing tickets for ${event.title}`,
                                });
                              }}
                            >
                              <Ticket className="h-4 w-4 mr-1" />
                              Manage Tickets
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEventFormData({
                                  id: event.id,
                                  title: event.title,
                                  description: event.description || '',
                                  date: event.date,
                                  time: event.time || '19:00',
                                  location: event.location || '',
                                  imageUrl: event.imageUrl || ''
                                });
                                setIsEditEventModalOpen(true);
                                toast({
                                  title: "Edit Event",
                                  description: `Opening editor for ${event.title}`,
                                });
                                console.log(`Editing event ID: ${event.id}`);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
                                  console.log(`Deleting event ID: ${event.id}`);
                                  deleteEventMutation.mutate(event.id, {
                                    onSuccess: () => {
                                      toast({
                                        title: "Event Deleted",
                                        description: `${event.title} has been deleted`,
                                        variant: "destructive"
                                      });
                                    },
                                    onError: (error) => {
                                      console.error("Error deleting event:", error);
                                      toast({
                                        title: "Error Deleting Event",
                                        description: "There was a problem deleting this event. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  });
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border rounded-md">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">NO EVENTS YET</h3>
                  <p className="text-muted-foreground mb-4">Create your first event to start selling tickets.</p>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Create Event",
                        description: "Opening event creation form...",
                      });
                      // In a real implementation, navigate to event creation form or open modal
                      console.log("Create event button clicked");
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tickets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ticket Management</CardTitle>
                <CardDescription>
                  {selectedEventId ? 
                    `Managing tickets for ${events.find((e: any) => e.id === selectedEventId)?.title || 'selected event'}` :
                    'Manage event tickets and pricing'
                  }
                </CardDescription>
              </div>
              {selectedEventId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedEventId(null);
                    toast({
                      title: "Filter Cleared",
                      description: "Showing all tickets",
                    });
                  }}
                >
                  Clear Filter
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-8">
                  <p>Loading tickets...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Event</th>
                        <th className="text-left p-4 font-medium">Price</th>
                        <th className="text-left p-4 font-medium">Quantity</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets
                        .filter((ticket: any) => selectedEventId ? ticket.eventId === selectedEventId : true)
                        .map((ticket: any) => (
                          <tr key={ticket.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-medium">{ticket.name}</td>
                            <td className="p-4">{ticket.eventName || 'Unknown Event'}</td>
                            <td className="p-4 font-medium">${parseFloat(ticket.price).toFixed(2)}</td>
                            <td className="p-4">{ticket.quantity || 'Unlimited'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`h-3 w-3 rounded-full ${
                                    ticket.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                ></div>
                                <span className={`capitalize ${ticket.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                  {ticket.status || 'Active'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    console.log(`Editing ticket ID: ${ticket.id}`);
                                    toast({
                                      title: "Edit Ticket",
                                      description: `Opening ticket editor for ${ticket.name}`,
                                    });
                                    // In a real implementation, this would open a modal or navigate to a ticket editing page
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${ticket.name}" ticket? This action cannot be undone.`)) {
                                      console.log(`Deleting ticket ID: ${ticket.id}`);
                                      deleteTicketMutation.mutate(ticket.id, {
                                        onSuccess: () => {
                                          toast({
                                            title: "Ticket Deleted",
                                            description: `${ticket.name} has been deleted`,
                                            variant: "destructive"
                                          });
                                        },
                                        onError: (error) => {
                                          console.error("Error deleting ticket:", error);
                                          toast({
                                            title: "Error Deleting Ticket",
                                            description: "There was a problem deleting this ticket. Please try again.",
                                            variant: "destructive"
                                          });
                                        }
                                      });
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {selectedEventId && (
                    <div className="mt-6">
                      <Button 
                        onClick={() => {
                          setTicketFormData({
                            ...ticketFormData,
                            eventId: selectedEventId || 0,
                            name: `Ticket for ${events.find((e) => e.id === selectedEventId)?.title || 'Event'}`
                          });
                          setIsCreateTicketModalOpen(true);
                          toast({
                            title: "Add Ticket",
                            description: `Creating new ticket for ${events.find((e) => e.id === selectedEventId)?.title}`,
                          });
                          console.log(`Creating ticket form opened for event ID: ${selectedEventId}`);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ticket for This Event
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">NO TICKETS CREATED</h3>
                  <p className="text-muted-foreground mb-4">Create tickets for your events to sell them online.</p>
                  {selectedEventId && (
                    <Button
                      onClick={() => {
                        setTicketFormData({
                          ...ticketFormData,
                          eventId: selectedEventId || 0,
                          name: `Ticket for ${events.find((e) => e.id === selectedEventId)?.title || 'Event'}`
                        });
                        setIsCreateTicketModalOpen(true);
                        toast({
                          title: "Create Ticket",
                          description: `Opening ticket creation form for ${events.find((e) => e.id === selectedEventId)?.title}`,
                        });
                        console.log(`Creating first ticket for event ID: ${selectedEventId}`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create First Ticket
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Marketing</CardTitle>
              <CardDescription>Manage email campaigns and subscriber lists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscribers</CardTitle>
                    <CardDescription>Manage your subscriber lists</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-muted-foreground">Total Subscribers: 0</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Import Subscribers",
                              description: "Opening CSV import dialog...",
                            });
                            console.log("Import subscribers button clicked");
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export Subscribers",
                              description: "Starting download of subscriber data...",
                            });
                            console.log("Export subscribers button clicked");
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Add Subscriber",
                          description: "Opening subscriber creation form...",
                        });
                        console.log("Add subscriber button clicked");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subscriber
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Campaigns</CardTitle>
                    <CardDescription>Create and send email campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-muted-foreground">Total Campaigns: 0</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Test Email",
                            description: "Sending test email to administrators...",
                          });
                          console.log("Send test email button clicked");
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Send Test
                      </Button>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Create Campaign",
                          description: "Opening campaign creation form...",
                        });
                        console.log("Create campaign button clicked");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Track sales, visitors, and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">Track and analyze visitor engagement, sales, and user activity.</p>
                <Button variant="outline" onClick={() => navigate("/analytics")}>
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Ticket Dialog */}
      <Dialog open={isCreateTicketModalOpen} onOpenChange={setIsCreateTicketModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create new ticket type</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new ticket for <span className="font-medium">{events.find((e) => e.id === ticketFormData.eventId)?.title || 'event'}</span>
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={ticketFormData.ticketType} onValueChange={(value) => setTicketFormData({...ticketFormData, ticketType: value})}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="essential">Essential</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="essential" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-pink-950 text-white">REQ</Badge>
                    <Label htmlFor="ticketName">Name</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    e.g. General admission, Adult, Kid, VIP, Press
                  </div>
                  <Input
                    id="ticketName"
                    value={ticketFormData.name}
                    onChange={(e) => setTicketFormData({...ticketFormData, name: e.target.value})}
                    placeholder="Enter ticket name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-pink-950 text-white">REQ</Badge>
                      <Label htmlFor="ticketQuantity">Quantity</Label>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Availability for each date of the event
                    </div>
                    <Input
                      id="ticketQuantity"
                      type="number"
                      min="1"
                      value={ticketFormData.quantity}
                      onChange={(e) => setTicketFormData({...ticketFormData, quantity: e.target.value})}
                      placeholder="100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-pink-950 text-white">REQ</Badge>
                      <Label htmlFor="ticketPrice">Price</Label>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      The price per unit
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">$</span>
                      <Input
                        id="ticketPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={ticketFormData.price}
                        onChange={(e) => setTicketFormData({...ticketFormData, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="ticketDescription">Description</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Provide more information about this ticket type
                  </div>
                  <Textarea
                    id="ticketDescription"
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData({...ticketFormData, description: e.target.value})}
                    placeholder="Describe what this ticket includes or any special instructions"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="ticketStatus">Status</Label>
                  </div>
                  <Select 
                    value={ticketFormData.status}
                    onValueChange={(value) => setTicketFormData({...ticketFormData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="priceType">Price type</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Add a visual cue for non standard prices
                  </div>
                  <Select 
                    value={ticketFormData.priceType}
                    onValueChange={(value) => setTicketFormData({...ticketFormData, priceType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="early-bird">Early Bird</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">OPT</Badge>
                      <Label htmlFor="minQuantityPerOrder">Min quantity per order</Label>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Minimum purchase quantity per order
                    </div>
                    <Input
                      id="minQuantityPerOrder"
                      type="number"
                      min="1"
                      value={ticketFormData.minQuantityPerOrder}
                      onChange={(e) => setTicketFormData({...ticketFormData, minQuantityPerOrder: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">OPT</Badge>
                      <Label htmlFor="maxQuantityPerOrder">Max quantity per order</Label>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Maximum purchase quantity per order
                    </div>
                    <Input
                      id="maxQuantityPerOrder"
                      type="number"
                      min="1"
                      value={ticketFormData.maxQuantityPerOrder}
                      onChange={(e) => setTicketFormData({...ticketFormData, maxQuantityPerOrder: e.target.value})}
                      placeholder="10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="displayRemainingQuantity">Display remaining quantity</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Inform your customers about the remaining ticket availability
                  </div>
                  <Select 
                    value={ticketFormData.displayRemainingQuantity ? "true" : "false"}
                    onValueChange={(value) => setTicketFormData({...ticketFormData, displayRemainingQuantity: value === "true"})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Make the remaining quantity visible</SelectItem>
                      <SelectItem value="false">Hide the remaining quantity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="payWhatYouCan">Pay What You Can</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    If marked as PWYC, the buyer can choose the price they wish to pay
                  </div>
                  <Select 
                    value={ticketFormData.payWhatYouCan ? "true" : "false"}
                    onValueChange={(value) => setTicketFormData({...ticketFormData, payWhatYouCan: value === "true"})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Mark as Pay What You Can</SelectItem>
                      <SelectItem value="false">Standard fixed price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label>Sales time frame</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sales start date</div>
                      <Input
                        type="date"
                        value={ticketFormData.salesStartDate}
                        onChange={(e) => setTicketFormData({...ticketFormData, salesStartDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sales start time</div>
                      <Input
                        type="time"
                        value={ticketFormData.salesStartTime}
                        onChange={(e) => setTicketFormData({...ticketFormData, salesStartTime: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hideBeforeSalesStart"
                      checked={ticketFormData.hideBeforeSalesStart}
                      onCheckedChange={(checked) => setTicketFormData({...ticketFormData, hideBeforeSalesStart: checked === true})}
                    />
                    <Label htmlFor="hideBeforeSalesStart">Hide before sales start</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sales end date</div>
                      <Input
                        type="date"
                        value={ticketFormData.salesEndDate}
                        onChange={(e) => setTicketFormData({...ticketFormData, salesEndDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Sales end time</div>
                      <Input
                        type="time"
                        value={ticketFormData.salesEndTime}
                        onChange={(e) => setTicketFormData({...ticketFormData, salesEndTime: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hideAfterSalesEnd"
                      checked={ticketFormData.hideAfterSalesEnd}
                      onCheckedChange={(checked) => setTicketFormData({...ticketFormData, hideAfterSalesEnd: checked === true})}
                    />
                    <Label htmlFor="hideAfterSalesEnd">Hide after sales end</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="secretCode">Secret code</Label>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Show this ticket type only to those who enter this code
                  </div>
                  <Input
                    id="secretCode"
                    value={ticketFormData.secretCode}
                    onChange={(e) => setTicketFormData({...ticketFormData, secretCode: e.target.value})}
                    placeholder="Enter a secret code"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="hideIfSoldOut">Hide if sold out</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hideIfSoldOut"
                      checked={ticketFormData.hideIfSoldOut}
                      onCheckedChange={(checked) => setTicketFormData({...ticketFormData, hideIfSoldOut: checked === true})}
                    />
                    <Label htmlFor="hideIfSoldOut">Hide the ticket type when the available quantity is 0</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">OPT</Badge>
                    <Label htmlFor="hidePriceIfSoldOut">Hide the price if sold out</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hidePriceIfSoldOut"
                      checked={ticketFormData.hidePriceIfSoldOut}
                      onCheckedChange={(checked) => setTicketFormData({...ticketFormData, hidePriceIfSoldOut: checked === true})}
                    />
                    <Label htmlFor="hidePriceIfSoldOut">Hide the ticket type price when the available quantity is 0</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsCreateTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedEventId) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Please select an event first"
                  });
                  return;
                }
                
                // Create a new ticket object based on ticketFormData
                const newTicket = {
                  name: ticketFormData.name,
                  price: parseFloat(ticketFormData.price),
                  quantity: parseInt(ticketFormData.quantity),
                  status: ticketFormData.status,
                  eventId: selectedEventId,
                  description: ticketFormData.description || null,
                  // Advanced fields
                  ticketType: ticketFormData.ticketType,
                  priceType: ticketFormData.priceType,
                  minQuantityPerOrder: ticketFormData.minQuantityPerOrder ? parseInt(ticketFormData.minQuantityPerOrder) : null,
                  maxQuantityPerOrder: ticketFormData.maxQuantityPerOrder ? parseInt(ticketFormData.maxQuantityPerOrder) : null,
                  displayRemainingQuantity: ticketFormData.displayRemainingQuantity,
                  payWhatYouCan: ticketFormData.payWhatYouCan,
                  salesStartDate: ticketFormData.salesStartDate || null,
                  salesStartTime: ticketFormData.salesStartTime || null,
                  salesEndDate: ticketFormData.salesEndDate || null,
                  salesEndTime: ticketFormData.salesEndTime || null,
                  hideBeforeSalesStart: ticketFormData.hideBeforeSalesStart,
                  hideAfterSalesEnd: ticketFormData.hideAfterSalesEnd,
                  secretCode: ticketFormData.secretCode || null,
                  hideIfSoldOut: ticketFormData.hideIfSoldOut,
                  hidePriceIfSoldOut: ticketFormData.hidePriceIfSoldOut
                };
                
                createTicketMutation.mutate(newTicket, {
                  onSuccess: () => {
                    toast({
                      title: "Ticket Created",
                      description: `${newTicket.name} has been created successfully`,
                    });
                    setIsCreateTicketModalOpen(false);
                  },
                  onError: (error) => {
                    console.error("Error creating ticket:", error);
                    toast({
                      title: "Error Creating Ticket",
                      description: "There was a problem creating this ticket. Please try again.",
                      variant: "destructive"
                    });
                  }
                });
              }}
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Event Creation Modal */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Create a new event. Fill out the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventTitle" className="text-right">
                Title
              </Label>
              <Input
                id="eventTitle"
                className="col-span-3"
                value={eventFormData.title}
                onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="eventDescription"
                className="col-span-3"
                value={eventFormData.description}
                onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventDate" className="text-right">
                Date
              </Label>
              <Input
                id="eventDate"
                type="date"
                className="col-span-3"
                value={eventFormData.date}
                onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventTime" className="text-right">
                Time
              </Label>
              <Input
                id="eventTime"
                type="time"
                className="col-span-3"
                value={eventFormData.time}
                onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventLocation" className="text-right">
                Location
              </Label>
              <Input
                id="eventLocation"
                className="col-span-3"
                value={eventFormData.location}
                onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="eventImageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="eventImageUrl"
                className="col-span-3"
                value={eventFormData.imageUrl}
                onChange={(e) => setEventFormData({...eventFormData, imageUrl: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateEventModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const newEvent = {
                  title: eventFormData.title,
                  description: eventFormData.description || null,
                  date: eventFormData.date,
                  time: eventFormData.time || null,
                  location: eventFormData.location || null,
                  imageUrl: eventFormData.imageUrl || null
                };
                
                createEventMutation.mutate(newEvent, {
                  onSuccess: () => {
                    toast({
                      title: "Event Created",
                      description: `${newEvent.title} has been created successfully`,
                    });
                    setIsCreateEventModalOpen(false);
                  },
                  onError: (error) => {
                    console.error("Error creating event:", error);
                    toast({
                      title: "Error Creating Event",
                      description: "There was a problem creating this event. Please try again.",
                      variant: "destructive"
                    });
                  }
                });
              }}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Event Edit Modal */}
      <Dialog open={isEditEventModalOpen} onOpenChange={setIsEditEventModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventTitle" className="text-right">
                Title
              </Label>
              <Input
                id="editEventTitle"
                className="col-span-3"
                value={eventFormData.title}
                onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="editEventDescription"
                className="col-span-3"
                value={eventFormData.description}
                onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventDate" className="text-right">
                Date
              </Label>
              <Input
                id="editEventDate"
                type="date"
                className="col-span-3"
                value={eventFormData.date}
                onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventTime" className="text-right">
                Time
              </Label>
              <Input
                id="editEventTime"
                type="time"
                className="col-span-3"
                value={eventFormData.time}
                onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventLocation" className="text-right">
                Location
              </Label>
              <Input
                id="editEventLocation"
                className="col-span-3"
                value={eventFormData.location}
                onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEventImageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="editEventImageUrl"
                className="col-span-3"
                value={eventFormData.imageUrl}
                onChange={(e) => setEventFormData({...eventFormData, imageUrl: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditEventModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const updatedEvent = {
                  id: eventFormData.id,
                  title: eventFormData.title,
                  description: eventFormData.description || null,
                  date: eventFormData.date,
                  time: eventFormData.time || null,
                  location: eventFormData.location || null,
                  imageUrl: eventFormData.imageUrl || null
                };
                
                editEventMutation.mutate(updatedEvent, {
                  onSuccess: () => {
                    toast({
                      title: "Event Updated",
                      description: `${updatedEvent.title} has been updated successfully`,
                    });
                    setIsEditEventModalOpen(false);
                  },
                  onError: (error) => {
                    console.error("Error updating event:", error);
                    toast({
                      title: "Error Updating Event",
                      description: "There was a problem updating this event. Please try again.",
                      variant: "destructive"
                    });
                  }
                });
              }}
              disabled={editEventMutation.isPending}
            >
              {editEventMutation.isPending ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}