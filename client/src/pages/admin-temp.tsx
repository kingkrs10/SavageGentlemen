import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Ticket, 
  Users, 
  LineChart, 
  ShoppingBag, 
  Calendar, 
  Pencil, 
  MapPin, 
  Clock, 
  X, 
  Save,
  Trash
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const queryClient = new QueryClient();

export default function AdminTemp() {
  const [, navigate] = useLocation();
  const { isAdmin, user } = useUser();
  const [activeTab, setActiveTab] = useState("tools");
  const { toast } = useToast();
  
  // Event management state
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    id: 0,
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    imageUrl: "",
    category: "",
    price: "",
    images: [] as string[]
  });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  // Fetch events
  const { 
    data: events = [], 
    isLoading: eventsLoading 
  } = useQuery({ 
    queryKey: ['/api/events'], 
    queryFn: () => apiRequest('GET', '/api/events').then(res => res.json())
  });
  
  // Event Mutations - Not used in the new implementation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsEditEventModalOpen(false);
      toast({
        title: "Event Updated",
        description: "Event has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    }
  });
  
  // Handle event form submission
  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For non-FormData approach (direct JSON)
      const eventData = {
        title: eventFormData.title,
        description: eventFormData.description,
        date: eventFormData.date,
        time: eventFormData.time,
        location: eventFormData.location,
        category: eventFormData.category || null,
        price: eventFormData.price ? parseFloat(eventFormData.price) : null,
        imageUrl: eventFormData.imageUrl || null
      };
      
      const eventId = eventFormData.id;
      
      // Handle the update using direct JSON instead of FormData
      if (eventId === 0) {
        // Create new event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
            'user-id': user?.id?.toString() || ''
          },
          body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create event');
        }
          
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        setIsEditEventModalOpen(false);
        toast({
          title: "Event Created",
          description: "Event has been created successfully"
        });
      } else {
        // Update existing event
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
            'user-id': user?.id?.toString() || ''
          },
          body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update event');
        }
          
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        setIsEditEventModalOpen(false);
        toast({
          title: "Event Updated",
          description: "Event has been updated successfully"
        });
      }
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive"
      });
    }
  };
  
  // Handle single image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle multiple image upload
  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedImages([...uploadedImages, ...filesArray]);
      
      // Create preview URLs for the new images
      const newPreviewUrls = filesArray.map(file => {
        const reader = new FileReader();
        const url = URL.createObjectURL(file);
        
        reader.onload = () => {
          // Nothing needed here as we're using URL.createObjectURL
        };
        reader.readAsDataURL(file);
        
        return url;
      });
      
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    }
  };
  
  // Remove an image from the multiple upload list
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    const newPreviewUrls = [...imagePreviewUrls];
    
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index]);
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setUploadedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };
  
  // Clear image preview
  const clearImagePreview = () => {
    setImagePreview(null);
    setUploadedImage(null);
    setEventFormData({ ...eventFormData, imageUrl: "" });
  };
  
  useEffect(() => {
    // Preload image preview for edit modal
    if (selectedEvent && selectedEvent.imageUrl) {
      setImagePreview(selectedEvent.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [selectedEvent]);
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You need administrator privileges to access this page.</p>
      </div>
    );
  }
  
  return (
    <>
      <SEOHead 
        title="Admin Dashboard" 
        description="Savage Gentlemen Admin Dashboard" 
      />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>
        
        <Tabs 
          defaultValue="tools" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="tools" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1 text-xs sm:text-sm" data-value="content">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-1 text-xs sm:text-sm">
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs sm:text-sm">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Scanner Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Ticket Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Scan and validate tickets for events.</p>
                  <Button 
                    onClick={() => navigate('/ticket-scanner')}
                    className="w-full h-10 text-sm"
                  >
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>
              
              {/* User Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Manage user roles and permissions.</p>
                  <Button 
                    onClick={() => navigate('/user-management')}
                    className="w-full h-10 text-sm"
                  >
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Events List */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Events Management
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => navigate('/events')}
                        className="h-8 text-xs"
                        variant="outline"
                        size="sm"
                      >
                        View Public Page
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm">Loading events...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No events found</p>
                      <Button 
                        onClick={() => {
                          setEventFormData({
                            id: 0,
                            title: "",
                            description: "",
                            date: new Date().toISOString().split('T')[0],
                            time: "19:00",
                            location: "",
                            imageUrl: "",
                            category: "",
                            price: ""
                          });
                          setIsEditEventModalOpen(true);
                        }}
                        className="mt-2"
                      >
                        Create New Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event: any) => (
                          <Card key={event.id} className="overflow-hidden">
                            <div className="relative aspect-video w-full overflow-hidden bg-secondary/30">
                              {event.imageUrl ? (
                                <img 
                                  src={event.imageUrl.startsWith('/') ? event.imageUrl.substring(1) : event.imageUrl} 
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://placehold.co/600x400/222222/FF4136?text=No+Image";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                  <span className="text-muted-foreground">No Image</span>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3">
                              <h3 className="font-semibold truncate">{event.title}</h3>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {event.date}
                                {event.time && (
                                  <>
                                    <Clock className="h-3 w-3 ml-2 mr-1" />
                                    {event.time}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location || 'No location set'}
                              </div>
                              <div className="flex justify-between mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setEventFormData({
                                      id: event.id,
                                      title: event.title,
                                      description: event.description || '',
                                      date: event.date,
                                      time: event.time || '19:00',
                                      location: event.location || '',
                                      imageUrl: event.imageUrl || '',
                                      category: event.category || '',
                                      price: event.price ? event.price.toString() : ''
                                    });
                                    setImagePreview(event.imageUrl);
                                    setIsEditEventModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => navigate(`/ticket-management?eventId=${event.id}`)}
                                >
                                  <Ticket className="h-3 w-3 mr-1" />
                                  Tickets
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button 
                        onClick={() => {
                          setEventFormData({
                            id: 0,
                            title: "",
                            description: "",
                            date: new Date().toISOString().split('T')[0],
                            time: "19:00",
                            location: "",
                            imageUrl: "",
                            category: "",
                            price: ""
                          });
                          setIsEditEventModalOpen(true);
                        }}
                        className="mt-4"
                      >
                        Create New Event
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Products Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Manage store products.</p>
                  <Button 
                    onClick={() => navigate('/shop')}
                    className="w-full h-10 text-sm"
                  >
                    View Products
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Scanner Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Ticket Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm">Scan tickets at the event entrance.</p>
                  <Button 
                    onClick={() => navigate('/ticket-scanner')}
                    className="w-full h-10 text-sm"
                  >
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>
              
              {/* Ticket Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Manage Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm">Create and edit event tickets.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => navigate('/events')}
                      className="w-full h-10 text-sm"
                      variant="outline"
                    >
                      View Events
                    </Button>
                    <Button 
                      onClick={() => {
                        // Navigate to dedicated ticket management interface
                        navigate('/ticket-management');
                      }}
                      className="w-full h-10 text-sm"
                    >
                      Manage Tickets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Analytics Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">View site analytics and statistics.</p>
                  <Button 
                    onClick={() => navigate('/analytics')}
                    className="w-full h-10 text-sm"
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Edit Modal */}
      <Dialog open={isEditEventModalOpen} onOpenChange={setIsEditEventModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? `Edit Event: ${selectedEvent.title}` : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEventFormSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-event-title">Title *</Label>
                <Input
                  id="edit-event-title"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-event-date">Date *</Label>
                  <Input
                    id="edit-event-date"
                    type="date"
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-event-time">Time</Label>
                  <Input
                    id="edit-event-time"
                    type="time"
                    value={eventFormData.time}
                    onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-event-location">Location *</Label>
                  <Input
                    id="edit-event-location"
                    value={eventFormData.location}
                    onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-event-price">Price</Label>
                  <Input
                    id="edit-event-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventFormData.price}
                    onChange={(e) => setEventFormData({...eventFormData, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-event-category">Category</Label>
                <Input
                  id="edit-event-category"
                  value={eventFormData.category}
                  onChange={(e) => setEventFormData({...eventFormData, category: e.target.value})}
                  placeholder="Optional category"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-event-description">Description</Label>
                <Textarea
                  id="edit-event-description"
                  className="min-h-[100px]"
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
                  placeholder="Event description..."
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-event-image">Event Image</Label>
                {imagePreview && (
                  <div className="relative aspect-video mb-2 bg-secondary/30 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Event preview" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={clearImagePreview}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Input
                  id="edit-event-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
            
            <DialogFooter className="flex space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditEventModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateEventMutation.isPending}
                className="flex items-center"
              >
                {updateEventMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}