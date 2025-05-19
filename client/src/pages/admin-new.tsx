import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Mail,
  Plus,
  Download,
  Upload,
  Search,
  Trash,
  FileText,
  Send,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  Ticket,
  ShoppingBag,
  BarChart3,
  MoreHorizontal,
  Image as ImageIcon,
  Tag as TagIcon,
  DollarSign as DollarSignIcon,
  AlertTriangle,
  Pencil as PencilIcon,
  Check as CheckIcon,
  X as XIcon,
  Clock as ClockIcon
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
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("events");

  // Event Queries
  const { 
    data: events = [], 
    isLoading: eventsLoading 
  } = useQuery({
    queryKey: ['/api/events'],
    enabled: true,
  });

  // Ticket Queries
  const { 
    data: tickets = [], 
    isLoading: ticketsLoading 
  } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: true,
  });

  // Email Marketing Queries
  const {
    data: emailLists = [],
    isLoading: emailListsLoading
  } = useQuery({
    queryKey: ['/api/email-marketing/lists'],
    enabled: activeTab === "email",
  });

  const {
    data: subscribers = [],
    isLoading: subscribersLoading
  } = useQuery({
    queryKey: ['/api/email-marketing/subscribers'],
    enabled: activeTab === "email",
  });

  const {
    data: campaigns = [],
    isLoading: campaignsLoading
  } = useQuery({
    queryKey: ['/api/email-marketing/campaigns'],
    enabled: activeTab === "email",
  });

  // Create Event Mutation
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      return await apiRequest('POST', '/api/events', newEvent);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "The event has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Event",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (newTicket: any) => {
      return await apiRequest('POST', '/api/tickets', newTicket);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Created",
        description: "The ticket has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Ticket",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Create Email List Mutation
  const createEmailListMutation = useMutation({
    mutationFn: async (newList: any) => {
      return await apiRequest('POST', '/api/email-marketing/lists', newList);
    },
    onSuccess: () => {
      toast({
        title: "List Created",
        description: "The email list has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-marketing/lists'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create List",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Add Subscriber Mutation
  const addSubscriberMutation = useMutation({
    mutationFn: async (newSubscriber: any) => {
      return await apiRequest('POST', '/api/email-marketing/subscribers', newSubscriber);
    },
    onSuccess: () => {
      toast({
        title: "Subscriber Added",
        description: "The subscriber has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-marketing/subscribers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Subscriber",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Create Campaign Mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign: any) => {
      return await apiRequest('POST', '/api/email-marketing/campaigns', newCampaign);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "The campaign has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Campaign",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Send Campaign Mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await apiRequest('POST', '/api/email-marketing/campaigns/send', campaignData);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Sent",
        description: "The campaign has been sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Campaign",
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Import Subscribers Mutation
  const importSubscribersMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch('/api/email-marketing/subscribers/import', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Subscribers were imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-marketing/subscribers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error?.message || "An error occurred during import",
        variant: "destructive",
      });
    }
  });

  // State variables
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showEmailListForm, setShowEmailListForm] = useState(false);
  const [showSubscriberForm, setShowSubscriberForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedEmailList, setSelectedEmailList] = useState<any>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Form data
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    price: '',
    imageUrl: '',
    category: '',
    featured: false
  });

  const [ticketForm, setTicketForm] = useState({
    name: '',
    eventId: '',
    price: '',
    quantity: '',
    description: '',
    status: 'active'
  });

  const [emailListForm, setEmailListForm] = useState({
    name: '',
    description: ''
  });

  const [subscriberForm, setSubscriberForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    listIds: []
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    listIds: []
  });

  // Handler functions
  const handleCreateEvent = () => {
    createEventMutation.mutate({
      ...eventForm,
      price: parseFloat(eventForm.price)
    });
    setShowEventForm(false);
    setEventForm({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      price: '',
      imageUrl: '',
      category: '',
      featured: false
    });
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate({
      ...ticketForm,
      price: parseFloat(ticketForm.price),
      quantity: parseInt(ticketForm.quantity)
    });
    setShowTicketForm(false);
    setTicketForm({
      name: '',
      eventId: '',
      price: '',
      quantity: '',
      description: '',
      status: 'active'
    });
  };

  const handleCreateEmailList = () => {
    createEmailListMutation.mutate(emailListForm);
    setShowEmailListForm(false);
    setEmailListForm({
      name: '',
      description: ''
    });
  };

  const handleAddSubscriber = () => {
    addSubscriberMutation.mutate(subscriberForm);
    setShowSubscriberForm(false);
    setSubscriberForm({
      email: '',
      firstName: '',
      lastName: '',
      listIds: []
    });
  };

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(campaignForm);
    setShowCampaignForm(false);
    setCampaignForm({
      name: '',
      subject: '',
      content: '',
      listIds: []
    });
  };

  const handleSendCampaign = (campaignId: number) => {
    sendCampaignMutation.mutate({ campaignId });
  };

  const handleImportSubscribers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    importSubscribersMutation.mutate(formData);
    
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="events" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email Marketing
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>Create and manage events</CardDescription>
              </div>
              <Button onClick={() => setShowEventForm(true)}>
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
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-sm font-semibold">
                              <DollarSignIcon className="h-4 w-4 mr-1" />
                              ${parseFloat(event.price).toFixed(2)}
                            </div>
                            <div className="flex items-center text-sm">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {event.category || 'Uncategorized'}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedEvent(event);
                              setEventForm({
                                title: event.title,
                                date: event.date,
                                time: event.time || '',
                                location: event.location,
                                description: event.description || '',
                                price: event.price.toString(),
                                imageUrl: event.imageUrl || '',
                                category: event.category || '',
                                featured: event.featured || false
                              });
                              setShowEventForm(true);
                            }}>
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              setTicketForm({
                                ...ticketForm,
                                eventId: event.id.toString()
                              });
                              setShowTicketForm(true);
                            }}>
                              <Ticket className="h-4 w-4 mr-1" />
                              Add Ticket
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
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Form Dialog */}
          <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                <DialogDescription>
                  {selectedEvent ? 'Update the event details below.' : 'Fill out the form below to create a new event.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium">Title</label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      placeholder="Event title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="category" className="text-sm font-medium">Category</label>
                    <Input
                      id="category"
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="date" className="text-sm font-medium">Date</label>
                    <Input
                      id="date"
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="time" className="text-sm font-medium">Time</label>
                    <Input
                      id="time"
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="location" className="text-sm font-medium">Location</label>
                    <Input
                      id="location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      placeholder="Event location"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="price" className="text-sm font-medium">Base Price</label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.price}
                      onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="imageUrl" className="text-sm font-medium">Image URL</label>
                  <Input
                    id="imageUrl"
                    value={eventForm.imageUrl}
                    onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                    placeholder="Image URL"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <textarea
                    id="description"
                    className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={eventForm.featured}
                    onChange={(e) => setEventForm({ ...eventForm, featured: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="featured" className="text-sm font-medium">
                    Feature this event on the homepage
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowEventForm(false);
                  setSelectedEvent(null);
                  setEventForm({
                    title: '',
                    date: '',
                    time: '',
                    location: '',
                    description: '',
                    price: '',
                    imageUrl: '',
                    category: '',
                    featured: false
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ticket Management</CardTitle>
                <CardDescription>Manage event tickets and pricing</CardDescription>
              </div>
              <Button onClick={() => setShowTicketForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Ticket
              </Button>
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
                      {tickets.map((ticket: any) => (
                        <tr key={ticket.id} className="border-b">
                          <td className="p-3">{ticket.name}</td>
                          <td className="p-3">{ticket.eventName || 'Unknown Event'}</td>
                          <td className="p-3">${(parseFloat(ticket.price) / 100).toFixed(2)}</td>
                          <td className="p-3">{ticket.quantity}</td>
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
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedTicket(ticket);
                              setTicketForm({
                                name: ticket.name,
                                eventId: ticket.eventId.toString(),
                                price: ticket.price.toString(),
                                quantity: ticket.quantity.toString(),
                                description: ticket.description || '',
                                status: ticket.status || 'active'
                              });
                              setShowTicketForm(true);
                            }}>
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">NO TICKETS CREATED</h3>
                  <p className="text-muted-foreground mb-4">Create tickets for your events to sell them online.</p>
                  <Button onClick={() => setShowTicketForm(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Form Dialog */}
          <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{selectedTicket ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
                <DialogDescription>
                  {selectedTicket ? 'Update the ticket details below.' : 'Fill out the form below to create a new ticket.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="ticketName" className="text-sm font-medium">Name</label>
                    <Input
                      id="ticketName"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      placeholder="Ticket name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="eventId" className="text-sm font-medium">Event</label>
                    <select
                      id="eventId"
                      value={ticketForm.eventId}
                      onChange={(e) => setTicketForm({ ...ticketForm, eventId: e.target.value })}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select an event</option>
                      {events.map((event: any) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="ticketPrice" className="text-sm font-medium">Price</label>
                    <Input
                      id="ticketPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticketForm.price}
                      onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={ticketForm.quantity}
                      onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })}
                      placeholder="Quantity available"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="ticketStatus" className="text-sm font-medium">Status</label>
                  <select
                    id="ticketStatus"
                    value={ticketForm.status}
                    onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="ticketDescription" className="text-sm font-medium">Description</label>
                  <textarea
                    id="ticketDescription"
                    className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                    placeholder="Ticket description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowTicketForm(false);
                  setSelectedTicket(null);
                  setTicketForm({
                    name: '',
                    eventId: '',
                    price: '',
                    quantity: '',
                    description: '',
                    status: 'active'
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket}>
                  {selectedTicket ? 'Update Ticket' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Email Marketing Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Marketing</CardTitle>
              <CardDescription>Manage email campaigns and subscriber lists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Subscribers</CardTitle>
                      <CardDescription>Manage your subscriber lists</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowSubscriberForm(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <label 
                        htmlFor="csv-upload" 
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleImportSubscribers}
                        />
                      </label>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subscribersLoading ? (
                      <div className="text-center py-8">
                        <p>Loading subscribers...</p>
                      </div>
                    ) : subscribers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Email</th>
                              <th className="text-left p-3">Name</th>
                              <th className="text-left p-3">Lists</th>
                              <th className="text-left p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscribers.map((subscriber: any) => (
                              <tr key={subscriber.id} className="border-b">
                                <td className="p-3">{subscriber.email}</td>
                                <td className="p-3">
                                  {subscriber.firstName} {subscriber.lastName}
                                </td>
                                <td className="p-3">
                                  {subscriber.lists && subscriber.lists.length > 0 
                                    ? subscriber.lists.map((list: any) => list.name).join(', ')
                                    : 'None'}
                                </td>
                                <td className="p-3">
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedSubscriber(subscriber);
                                    setSubscriberForm({
                                      email: subscriber.email,
                                      firstName: subscriber.firstName || '',
                                      lastName: subscriber.lastName || '',
                                      listIds: subscriber.lists ? subscriber.lists.map((list: any) => list.id) : []
                                    });
                                    setShowSubscriberForm(true);
                                  }}>
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No subscribers yet.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowSubscriberForm(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subscriber
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Campaigns</CardTitle>
                      <CardDescription>Create and send email campaigns</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowCampaignForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {campaignsLoading ? (
                      <div className="text-center py-8">
                        <p>Loading campaigns...</p>
                      </div>
                    ) : campaigns.length > 0 ? (
                      <div className="space-y-4">
                        {campaigns.map((campaign: any) => (
                          <Card key={campaign.id}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <p className="text-sm mb-2"><strong>Subject:</strong> {campaign.subject}</p>
                              <p className="text-sm mb-2"><strong>Lists:</strong> {
                                campaign.lists && campaign.lists.length > 0 
                                  ? campaign.lists.map((list: any) => list.name).join(', ')
                                  : 'None'
                              }</p>
                              {campaign.sentAt && (
                                <p className="text-sm text-muted-foreground">
                                  Sent: {new Date(campaign.sentAt).toLocaleString()}
                                </p>
                              )}
                            </CardContent>
                            <CardFooter className="pt-0">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                  // Preview campaign
                                }}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                                {!campaign.sentAt && (
                                  <Button size="sm" variant="default" onClick={() => handleSendCampaign(campaign.id)}>
                                    <Send className="h-4 w-4 mr-1" />
                                    Send
                                  </Button>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No campaigns created yet.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowCampaignForm(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          {/* Email List Form Dialog */}
          <Dialog open={showEmailListForm} onOpenChange={setShowEmailListForm}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{selectedEmailList ? 'Edit List' : 'Create Email List'}</DialogTitle>
                <DialogDescription>
                  {selectedEmailList ? 'Update the list details below.' : 'Create a new list to organize your subscribers.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="listName" className="text-sm font-medium">List Name</label>
                  <Input
                    id="listName"
                    value={emailListForm.name}
                    onChange={(e) => setEmailListForm({ ...emailListForm, name: e.target.value })}
                    placeholder="List name"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="listDescription" className="text-sm font-medium">Description</label>
                  <textarea
                    id="listDescription"
                    className="min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={emailListForm.description}
                    onChange={(e) => setEmailListForm({ ...emailListForm, description: e.target.value })}
                    placeholder="List description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowEmailListForm(false);
                  setSelectedEmailList(null);
                  setEmailListForm({
                    name: '',
                    description: ''
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEmailList}>
                  {selectedEmailList ? 'Update List' : 'Create List'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Subscriber Form Dialog */}
          <Dialog open={showSubscriberForm} onOpenChange={setShowSubscriberForm}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{selectedSubscriber ? 'Edit Subscriber' : 'Add Subscriber'}</DialogTitle>
                <DialogDescription>
                  {selectedSubscriber ? 'Update the subscriber details below.' : 'Add a new subscriber to your email lists.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="subscriberEmail" className="text-sm font-medium">Email</label>
                  <Input
                    id="subscriberEmail"
                    type="email"
                    value={subscriberForm.email}
                    onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                    <Input
                      id="firstName"
                      value={subscriberForm.firstName}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                    <Input
                      id="lastName"
                      value={subscriberForm.lastName}
                      onChange={(e) => setSubscriberForm({ ...subscriberForm, lastName: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email Lists</label>
                  <div className="space-y-2">
                    {emailListsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading lists...</p>
                    ) : emailLists.length > 0 ? (
                      emailLists.map((list: any) => (
                        <div key={list.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`list-${list.id}`}
                            checked={subscriberForm.listIds.includes(list.id)}
                            onChange={(e) => {
                              const newListIds = e.target.checked
                                ? [...subscriberForm.listIds, list.id]
                                : subscriberForm.listIds.filter(id => id !== list.id);
                              setSubscriberForm({ ...subscriberForm, listIds: newListIds });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`list-${list.id}`} className="text-sm">
                            {list.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">No lists available.</p>
                        <Button size="sm" variant="outline" onClick={() => {
                          setShowSubscriberForm(false);
                          setShowEmailListForm(true);
                        }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create List
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowSubscriberForm(false);
                  setSelectedSubscriber(null);
                  setSubscriberForm({
                    email: '',
                    firstName: '',
                    lastName: '',
                    listIds: []
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddSubscriber}>
                  {selectedSubscriber ? 'Update Subscriber' : 'Add Subscriber'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Campaign Form Dialog */}
          <Dialog open={showCampaignForm} onOpenChange={setShowCampaignForm}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
                <DialogDescription>
                  {selectedCampaign ? 'Update the campaign details below.' : 'Create a new email campaign to send to your subscribers.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="campaignName" className="text-sm font-medium">Campaign Name</label>
                    <Input
                      id="campaignName"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="Campaign name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="campaignSubject" className="text-sm font-medium">Email Subject</label>
                    <Input
                      id="campaignSubject"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      placeholder="Email subject line"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="campaignContent" className="text-sm font-medium">Email Content</label>
                  <textarea
                    id="campaignContent"
                    className="min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                    placeholder="Email content (supports HTML)"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Target Lists</label>
                  <div className="space-y-2">
                    {emailListsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading lists...</p>
                    ) : emailLists.length > 0 ? (
                      emailLists.map((list: any) => (
                        <div key={list.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`campaign-list-${list.id}`}
                            checked={campaignForm.listIds.includes(list.id)}
                            onChange={(e) => {
                              const newListIds = e.target.checked
                                ? [...campaignForm.listIds, list.id]
                                : campaignForm.listIds.filter(id => id !== list.id);
                              setCampaignForm({ ...campaignForm, listIds: newListIds });
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`campaign-list-${list.id}`} className="text-sm">
                            {list.name} ({list.subscriberCount || 0} subscribers)
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">No lists available.</p>
                        <Button size="sm" variant="outline" onClick={() => {
                          setShowCampaignForm(false);
                          setShowEmailListForm(true);
                        }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create List
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCampaignForm(false);
                  setSelectedCampaign(null);
                  setCampaignForm({
                    name: '',
                    subject: '',
                    content: '',
                    listIds: []
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  {selectedCampaign ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Track sales, visitors, and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ticket Sales</CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-2xl">$0.00</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Website Visitors</CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">+0% from last week</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Performance</CardTitle>
                    <CardDescription>Ticket sales by event</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No analytics data available</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                    <CardDescription>Visitor demographics and behavior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-16">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No analytics data available</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}