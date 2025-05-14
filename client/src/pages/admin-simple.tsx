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
} from "@/components/ui/card";

export default function AdminSimplePage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = React.useState("events");

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
              <Button>
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
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // Navigate to the tickets tab
                              setActiveTab("tickets");
                              // Filter tickets by this event
                              const eventId = event.id;
                              console.log(`Managing tickets for event ID: ${eventId}`);
                              // Could also pass eventId to a more detailed ticket management page
                              // navigate(`/admin/events/${eventId}/tickets`);
                            }}
                          >
                            <Ticket className="h-4 w-4 mr-1" />
                            Manage Tickets
                          </Button>
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
            <CardHeader>
              <CardTitle>Ticket Management</CardTitle>
              <CardDescription>Manage event tickets and pricing</CardDescription>
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
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket: any) => (
                        <tr key={ticket.id} className="border-b">
                          <td className="p-3">{ticket.name}</td>
                          <td className="p-3">{ticket.eventName || 'Unknown Event'}</td>
                          <td className="p-3">${parseFloat(ticket.price).toFixed(2)}</td>
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
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Send Test
                      </Button>
                    </div>
                    <Button className="w-full">
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
    </div>
  );
}