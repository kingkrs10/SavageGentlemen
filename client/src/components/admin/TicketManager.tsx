import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Ticket, PlusCircle, Edit, Trash2, Plus, X, Info, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category?: string;
  imageUrl?: string;
}

interface Ticket {
  id: number;
  eventId: number;
  name: string;
  description: string;
  price: string;
  quantity: number;
  status: string;
  salesStartDate?: string;
  salesEndDate?: string;
  salesStartTime?: string;
  salesEndTime?: string;
}

interface TicketFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  status: string;
  eventId: number;
  salesStartDate: string;
  salesEndDate: string;
  salesStartTime: string;
  salesEndTime: string;
}

const TicketManager: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);
  const [isEditTicketDialogOpen, setIsEditTicketDialogOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [ticketFormData, setTicketFormData] = useState<TicketFormData>({
    name: '',
    description: '',
    price: '',
    quantity: '100',
    status: 'active',
    eventId: 0,
    salesStartDate: '',
    salesEndDate: '',
    salesStartTime: '',
    salesEndTime: ''
  });
  
  const { toast } = useToast();
  
  // Fetch all events
  const { 
    data: events, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  // Fetch tickets when an event is selected
  const { 
    data: tickets, 
    isLoading: ticketsLoading,
    refetch: refetchTickets
  } = useQuery<Ticket[]>({
    queryKey: ['/api/admin/tickets/event', selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent?.id) return [];
      const response = await fetch(`/api/admin/tickets/event/${selectedEvent.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    },
    enabled: !!selectedEvent
  });
  
  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      return apiRequest('POST', `/api/admin/tickets`, ticketData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ticket created successfully',
      });
      setIsNewTicketDialogOpen(false);
      resetTicketForm();
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', selectedEvent?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create ticket: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, ticketData }: { ticketId: number, ticketData: any }) => {
      return apiRequest('PUT', `/api/admin/tickets/${ticketId}`, ticketData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
      });
      setIsEditTicketDialogOpen(false);
      resetTicketForm();
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', selectedEvent?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update ticket: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return apiRequest('DELETE', `/api/admin/tickets/${ticketId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ticket deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', selectedEvent?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete ticket: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const resetTicketForm = () => {
    setTicketFormData({
      name: '',
      description: '',
      price: '',
      quantity: '100',
      status: 'active',
      eventId: selectedEvent?.id || 0,
      salesStartDate: '',
      salesEndDate: '',
      salesStartTime: '',
      salesEndTime: ''
    });
    setEditingTicketId(null);
  };
  
  const handleCreateTicket = () => {
    const price = parseFloat(ticketFormData.price) * 100; // Convert to cents
    const quantity = parseInt(ticketFormData.quantity);
    
    createTicketMutation.mutate({
      ...ticketFormData,
      price: price.toString(),
      quantity,
    });
  };
  
  const handleUpdateTicket = () => {
    if (!editingTicketId) return;
    
    const price = parseFloat(ticketFormData.price) * 100; // Convert to cents
    const quantity = parseInt(ticketFormData.quantity);
    
    updateTicketMutation.mutate({
      ticketId: editingTicketId,
      ticketData: {
        ...ticketFormData,
        price: price.toString(),
        quantity,
      }
    });
  };
  
  const handleDeleteTicket = (ticketId: number) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      deleteTicketMutation.mutate(ticketId);
    }
  };
  
  const handleEditTicket = (ticket: Ticket) => {
    const formattedPrice = (parseInt(ticket.price) / 100).toFixed(2);
    
    setTicketFormData({
      name: ticket.name,
      description: ticket.description || '',
      price: formattedPrice,
      quantity: ticket.quantity?.toString() || '100',
      status: ticket.status || 'active',
      eventId: ticket.eventId,
      salesStartDate: ticket.salesStartDate || '',
      salesEndDate: ticket.salesEndDate || '',
      salesStartTime: ticket.salesStartTime || '',
      salesEndTime: ticket.salesEndTime || ''
    });
    
    setEditingTicketId(ticket.id);
    setIsEditTicketDialogOpen(true);
  };
  
  // When an event is selected, update the form's eventId
  useEffect(() => {
    if (selectedEvent) {
      setTicketFormData(prev => ({
        ...prev,
        eventId: selectedEvent.id
      }));
      refetchTickets();
    }
  }, [selectedEvent, refetchTickets]);
  
  if (eventsLoading) {
    return <div className="flex items-center justify-center h-48"><div className="loading loading-spinner"></div></div>;
  }
  
  if (eventsError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error Loading Events</AlertTitle>
        <AlertDescription>
          Failed to load events. Please try again.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="w-full sm:w-2/3">
          <Label htmlFor="event-select">Select Event</Label>
          <Select 
            value={selectedEvent ? String(selectedEvent.id) : ''} 
            onValueChange={(value) => {
              const event = events?.find(e => e.id === parseInt(value));
              setSelectedEvent(event || null);
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events && events.map((event) => (
                <SelectItem key={event.id} value={String(event.id)}>{event.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/3 flex items-end">
          <Button 
            onClick={() => {
              resetTicketForm();
              setIsNewTicketDialogOpen(true);
            }}
            disabled={!selectedEvent}
            className="w-full h-10 mt-1"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Ticket
          </Button>
        </div>
      </div>
      
      {selectedEvent ? (
        <>
          <div className="bg-muted/40 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium">{selectedEvent.title}</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="flex items-center mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                {selectedEvent.date} at {selectedEvent.time}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {selectedEvent.location}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tickets</h3>
          </div>
          
          {ticketsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tickets && tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{ticket.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleEditTicket(ticket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ticket.status === 'active' ? 'default' : 'secondary'}>
                        {ticket.status || 'active'}
                      </Badge>
                      <CardDescription>
                        {formatCurrency(parseInt(ticket.price) / 100)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3 text-sm">
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <div>
                        {ticket.description && <p className="text-muted-foreground mb-2">{ticket.description}</p>}
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <Ticket className="h-3 w-3 mr-1" />
                          {ticket.quantity} tickets available
                        </div>
                      </div>
                      
                      {(ticket.salesStartDate || ticket.salesEndDate) && (
                        <div className="text-xs text-muted-foreground">
                          {ticket.salesStartDate && (
                            <div>Sales start: {ticket.salesStartDate} {ticket.salesStartTime}</div>
                          )}
                          {ticket.salesEndDate && (
                            <div>Sales end: {ticket.salesEndDate} {ticket.salesEndTime}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-md">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-lg font-medium mb-1">No Tickets Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add tickets to make this event available for purchase.
              </p>
              <Button onClick={() => setIsNewTicketDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Ticket
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md">
          <Info className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-medium mb-1">Select an Event</h3>
          <p className="text-sm text-muted-foreground">
            Please select an event to manage tickets.
          </p>
        </div>
      )}
      
      {/* New Ticket Dialog */}
      <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Ticket</DialogTitle>
            <DialogDescription>
              Create a new ticket for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-name" className="text-right col-span-1">
                Name
              </Label>
              <Input
                id="ticket-name"
                className="col-span-3"
                value={ticketFormData.name}
                onChange={(e) => setTicketFormData({ ...ticketFormData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-description" className="text-right col-span-1">
                Description
              </Label>
              <Textarea
                id="ticket-description"
                className="col-span-3"
                value={ticketFormData.description}
                onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-price" className="text-right col-span-1">
                Price
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">$</span>
                <Input
                  id="ticket-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ticketFormData.price}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, price: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-quantity" className="text-right col-span-1">
                Quantity
              </Label>
              <Input
                id="ticket-quantity"
                type="number"
                min="1"
                className="col-span-3"
                value={ticketFormData.quantity}
                onChange={(e) => setTicketFormData({ ...ticketFormData, quantity: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticket-status" className="text-right col-span-1">
                Status
              </Label>
              <Select
                value={ticketFormData.status}
                onValueChange={(value) => setTicketFormData({ ...ticketFormData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="soldout">Sold Out</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basics">
                <div className="space-y-3 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sales-start-date" className="text-right col-span-1">
                      Start Date
                    </Label>
                    <Input
                      id="sales-start-date"
                      type="date"
                      className="col-span-3"
                      value={ticketFormData.salesStartDate}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesStartDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sales-start-time" className="text-right col-span-1">
                      Start Time
                    </Label>
                    <Input
                      id="sales-start-time"
                      type="time"
                      className="col-span-3"
                      value={ticketFormData.salesStartTime}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesStartTime: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="space-y-3 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sales-end-date" className="text-right col-span-1">
                      End Date
                    </Label>
                    <Input
                      id="sales-end-date"
                      type="date"
                      className="col-span-3"
                      value={ticketFormData.salesEndDate}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesEndDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sales-end-time" className="text-right col-span-1">
                      End Time
                    </Label>
                    <Input
                      id="sales-end-time"
                      type="time"
                      className="col-span-3"
                      value={ticketFormData.salesEndTime}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesEndTime: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={!ticketFormData.name || !ticketFormData.price}
            >
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Ticket Dialog */}
      <Dialog open={isEditTicketDialogOpen} onOpenChange={setIsEditTicketDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update ticket information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ticket-name" className="text-right col-span-1">
                Name
              </Label>
              <Input
                id="edit-ticket-name"
                className="col-span-3"
                value={ticketFormData.name}
                onChange={(e) => setTicketFormData({ ...ticketFormData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ticket-description" className="text-right col-span-1">
                Description
              </Label>
              <Textarea
                id="edit-ticket-description"
                className="col-span-3"
                value={ticketFormData.description}
                onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ticket-price" className="text-right col-span-1">
                Price
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">$</span>
                <Input
                  id="edit-ticket-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ticketFormData.price}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, price: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ticket-quantity" className="text-right col-span-1">
                Quantity
              </Label>
              <Input
                id="edit-ticket-quantity"
                type="number"
                min="1"
                className="col-span-3"
                value={ticketFormData.quantity}
                onChange={(e) => setTicketFormData({ ...ticketFormData, quantity: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ticket-status" className="text-right col-span-1">
                Status
              </Label>
              <Select
                value={ticketFormData.status}
                onValueChange={(value) => setTicketFormData({ ...ticketFormData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="soldout">Sold Out</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs defaultValue="basics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basics">
                <div className="space-y-3 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sales-start-date" className="text-right col-span-1">
                      Start Date
                    </Label>
                    <Input
                      id="edit-sales-start-date"
                      type="date"
                      className="col-span-3"
                      value={ticketFormData.salesStartDate}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesStartDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sales-start-time" className="text-right col-span-1">
                      Start Time
                    </Label>
                    <Input
                      id="edit-sales-start-time"
                      type="time"
                      className="col-span-3"
                      value={ticketFormData.salesStartTime}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesStartTime: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="space-y-3 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sales-end-date" className="text-right col-span-1">
                      End Date
                    </Label>
                    <Input
                      id="edit-sales-end-date"
                      type="date"
                      className="col-span-3"
                      value={ticketFormData.salesEndDate}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesEndDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-sales-end-time" className="text-right col-span-1">
                      End Time
                    </Label>
                    <Input
                      id="edit-sales-end-time"
                      type="time"
                      className="col-span-3"
                      value={ticketFormData.salesEndTime}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, salesEndTime: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTicket}
              disabled={!ticketFormData.name || !ticketFormData.price}
            >
              Update Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManager;