import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TicketQRCode from "@/components/TicketQRCode";
import { Loader2, Calendar, MapPin, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ics } from "ics";
import { saveAs } from "file-saver";

interface TicketPurchase {
  id: number;
  userId: number;
  ticketId: number;
  eventId: number;
  orderId: number;
  purchaseDate: string;
  status: string;
  qrCodeData: string;
  ticketType: string;
  price: number;
  attendeeEmail?: string;
  attendeeName?: string;
  scanned: boolean;
  firstScanAt?: string;
  lastScanAt?: string;
  scanCount: number;
  event?: {
    title: string;
    date: string;
    location: string;
  };
}

export default function MyTickets() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<TicketPurchase | null>(null);

  const {
    data: tickets = [],
    isLoading,
    error
  } = useQuery<TicketPurchase[]>({
    queryKey: ["/api/user/tickets"],
    enabled: !!user && isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
        <p className="mb-6">Please log in to view your tickets.</p>
        <Button onClick={() => navigate("/login")}>Log In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">My Tickets</h1>
        <p className="text-red-500 mb-6">Error loading tickets. Please try again later.</p>
        <Button onClick={() => navigate("/")}>Go Back Home</Button>
      </div>
    );
  }

  const upcomingTickets = tickets.filter(
    ticket => 
      ticket.status === "valid" && 
      new Date(ticket.event?.date as string) >= new Date()
  );
  
  const pastTickets = tickets.filter(
    ticket => 
      new Date(ticket.event?.date as string) < new Date()
  );

  const handleAddToCalendar = (ticket: TicketPurchase) => {
    if (!ticket.event) {
      toast({
        title: "Error",
        description: "Event details not available",
        variant: "destructive"
      });
      return;
    }
    
    const eventDate = new Date(ticket.event.date);
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth() + 1;
    const day = eventDate.getDate();
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    
    // Create an event that lasts 3 hours
    const event = {
      start: [year, month, day, hours, minutes],
      duration: { hours: 3 },
      title: ticket.event.title,
      description: `Your ${ticket.ticketType} ticket for ${ticket.event.title}`,
      location: ticket.event.location,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
    };
    
    ics.createEvent(event, (error, value) => {
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create calendar event",
          variant: "destructive"
        });
        return;
      }
      
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, `${ticket.event?.title.replace(/\s+/g, '-').toLowerCase()}.ics`);
      
      toast({
        title: "Success!",
        description: "Event saved to your calendar",
      });
    });
  };

  const renderTicket = (ticket: TicketPurchase) => {
    const eventDate = ticket.event?.date ? new Date(ticket.event.date) : null;
    
    return (
      <Card key={ticket.id} className="mb-6 overflow-hidden">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-4 right-4">
            <Badge 
              variant={
                ticket.status === "valid" ? "default" : 
                ticket.status === "used" ? "secondary" : 
                "destructive"
              }
            >
              {ticket.status.toUpperCase()}
              {ticket.scanned && " (SCANNED)"}
            </Badge>
          </div>
          <CardTitle className="text-xl md:text-2xl">{ticket.event?.title}</CardTitle>
          <CardDescription>
            {ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1)} Ticket
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {eventDate && (
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  <p>{format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                </div>
              )}
              {ticket.event?.location && (
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <p>{ticket.event.location}</p>
                </div>
              )}
              <div className="mb-2">
                <p className="font-medium">Ticket Price:</p>
                <p>${(ticket.price / 100).toFixed(2)}</p>
              </div>
              {ticket.attendeeName && (
                <div className="mb-2">
                  <p className="font-medium">Attendee:</p>
                  <p>{ticket.attendeeName}</p>
                </div>
              )}
              <div className="mb-2">
                <p className="font-medium">Purchase Date:</p>
                <p>{format(new Date(ticket.purchaseDate), "MMMM d, yyyy")}</p>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={() => handleAddToCalendar(ticket)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View Ticket
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="border rounded-lg p-4 bg-white">
                <TicketQRCode data={ticket.qrCodeData} orderId={ticket.orderId.toString()} />
              </div>
              <p className="text-xs mt-2 text-center text-muted-foreground">
                Present this QR code at the event
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">My Tickets</h1>
      
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl mb-4">You don't have any tickets yet</h2>
          <p className="mb-6">Explore upcoming events and get your tickets now!</p>
          <Button onClick={() => navigate("/events")}>
            Browse Events
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastTickets.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcomingTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="mb-4">No upcoming tickets found</p>
                <Button onClick={() => navigate("/events")}>
                  Browse Events
                </Button>
              </div>
            ) : (
              <div>
                {upcomingTickets.map(renderTicket)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {pastTickets.length === 0 ? (
              <div className="text-center py-8">
                <p>No past tickets found</p>
              </div>
            ) : (
              <div>
                {pastTickets.map(renderTicket)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{selectedTicket.event?.title}</h3>
            <p className="mb-4">{selectedTicket.attendeeName || "Attendee"}'s {selectedTicket.ticketType} Ticket</p>
            
            <div className="mb-6 flex justify-center">
              <div className="border rounded-lg p-4 bg-white">
                <TicketQRCode 
                  data={selectedTicket.qrCodeData} 
                  orderId={selectedTicket.orderId.toString()} 
                  size={250}
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="font-medium">{selectedTicket.event?.title}</p>
              {selectedTicket.event?.date && (
                <p>{format(new Date(selectedTicket.event.date), "EEEE, MMMM d, yyyy")}</p>
              )}
              <p>{selectedTicket.event?.location}</p>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const image = canvas.toDataURL("image/png");
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `${selectedTicket.event?.title.replace(/\s+/g, '-').toLowerCase()}-ticket.png`;
                    link.click();
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}