import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Mail,
  Plus,
  Download,
  Upload,
  Calendar,
  Ticket,
  Tag as TagIcon,
  DollarSign as DollarSignIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [ticketFormData, setTicketFormData] = React.useState({
    name: '',
    price: '0.00',
    quantity: '100',
    status: 'active',
    eventId: 0
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
      return await apiRequest('DELETE', `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    }
  });
  
  // Delete Ticket Mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('DELETE', `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    }
  });
  
  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (newTicket: any) => {
      return await apiRequest('POST', '/api/tickets', newTicket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setIsCreateTicketModalOpen(false);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
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
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <p>Loading events...</p>
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((event: any) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="aspect-video bg-muted">
                          {event.imageUrl ? (
                            <img 
                              src={event.imageUrl} 
                              alt={event.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted">
                              <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-2 p-4">
                          <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                              {event.time && ` at ${event.time}`}
                            </div>
                            <div className="flex items-center text-sm font-semibold">
                              <DollarSignIcon className="h-4 w-4 mr-1" />
                              ${parseFloat(event.price).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Event</th>
                        <th className="text-left p-3">Price</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets
                        .filter((ticket: any) => selectedEventId ? ticket.eventId === selectedEventId : true)
                        .map((ticket: any) => (
                          <tr key={ticket.id} className="border-b">
                            <td className="p-3">{ticket.name}</td>
                            <td className="p-3">{ticket.eventName || 'Unknown Event'}</td>
                            <td className="p-3">${parseFloat(ticket.price).toFixed(2)}</td>
                            <td className="p-3">{ticket.quantity || 'Unlimited'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`h-2 w-2 rounded-full ${
                                    ticket.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                ></div>
                                <span className="capitalize">{ticket.status || 'Active'}</span>
                              </div>
                            </td>
                            <td className="p-3">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Add a new ticket for {events.find((e) => e.id === ticketFormData.eventId)?.title || 'event'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={ticketFormData.name}
                onChange={(e) => setTicketFormData({...ticketFormData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={ticketFormData.price}
                onChange={(e) => setTicketFormData({...ticketFormData, price: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={ticketFormData.quantity}
                onChange={(e) => setTicketFormData({...ticketFormData, quantity: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={ticketFormData.status}
                onValueChange={(value) => setTicketFormData({...ticketFormData, status: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const newTicket = {
                  name: ticketFormData.name,
                  price: parseFloat(ticketFormData.price),
                  quantity: parseInt(ticketFormData.quantity),
                  status: ticketFormData.status,
                  eventId: ticketFormData.eventId
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
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}