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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

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
  
  // Event Mutations
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: FormData) => {
      const eventId = eventFormData.id;
      if (eventId === 0) {
        // Create new event
        const response = await fetch('/api/admin/events', {
          method: 'POST',
          body: eventData,
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          }
        });
        if (!response.ok) {
          throw new Error('Failed to create event');
        }
        return await response.json();
      } else {
        // Update existing event
        const response = await fetch(`/api/admin/events/${eventId}`, {
          method: 'PUT',
          body: eventData,
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          }
        });
        if (!response.ok) {
          throw new Error('Failed to update event');
        }
        return await response.json();
      }
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
      // Need to use FormData approach to handle multiple images
      const formData = new FormData();
      formData.append('title', eventFormData.title);
      formData.append('description', eventFormData.description);
      formData.append('date', eventFormData.date);
      formData.append('time', eventFormData.time);
      formData.append('location', eventFormData.location);
      
      if (eventFormData.category) {
        formData.append('category', eventFormData.category);
      }
      
      if (eventFormData.price) {
        formData.append('price', eventFormData.price);
      }
      
      // Add main image if selected
      if (uploadedImage) {
        formData.append('image', uploadedImage);
      } else if (eventFormData.imageUrl) {
        formData.append('imageUrl', eventFormData.imageUrl);
      }
      
      // Log form data structure for debugging
      console.log("Form data being submitted:", {
        title: eventFormData.title,
        description: eventFormData.description,
        date: eventFormData.date,
        images: uploadedImages.length,
        existingImages: eventFormData.images.length
      });
      
      // Add all additional images
      uploadedImages.forEach((image) => {
        formData.append('additionalImages', image);
      });
      
      // Add existing images that should be kept
      if (eventFormData.images && eventFormData.images.length > 0) {
        formData.append('existingImages', JSON.stringify(eventFormData.images));
        formData.append('retainExistingImages', 'true');
      }
      
      // Submit the form data through the mutation
      updateEventMutation.mutate(formData);
    } catch (error) {
      console.error("Error submitting event form:", error);
      toast({
        title: "Error",
        description: "Failed to submit event data",
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
  
  // Clear multiple image previews
  const clearAllImagePreviews = () => {
    // Release all object URLs to avoid memory leaks
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setImagePreviewUrls([]);
    setUploadedImages([]);
  };
  
  useEffect(() => {
    // Preload image preview for edit modal
    if (selectedEvent && selectedEvent.imageUrl) {
      setImagePreview(selectedEvent.imageUrl);
    } else {
      setImagePreview(null);
    }
    
    // Set up additional images if present
    if (selectedEvent && selectedEvent.additionalImages && Array.isArray(selectedEvent.additionalImages)) {
      // Set images array in form data (for editing existing images)
      setEventFormData(prev => ({
        ...prev,
        images: selectedEvent.additionalImages
      }));
      // Clear uploaded images since we're loading from existing data
      setUploadedImages([]);
      setImagePreviewUrls([]);
    } else {
      setEventFormData(prev => ({
        ...prev,
        images: []
      }));
      setImagePreviewUrls([]);
    }
    
    // Reset uploaded images
    setUploadedImages([]);
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
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Tickets</span>
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
                            price: "", 
                            images: []
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
                      <div className="flex justify-end">
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
                              price: "",
                              images: []
                            });
                            setIsEditEventModalOpen(true);
                          }}
                          size="sm"
                        >
                          Add New Event
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event: any) => (
                          <Card key={event.id} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted">
                              <img 
                                src={event.imageUrl} 
                                alt={event.title}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/222222/FF4136?text=No+Image';
                                }}
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold truncate">{event.title}</h3>
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1 inline" />
                                  <span>{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1 inline" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 inline" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs h-8 px-2 flex-1"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setEventFormData({
                                      id: event.id,
                                      title: event.title,
                                      description: event.description,
                                      date: event.date.split('T')[0],
                                      time: event.time,
                                      location: event.location,
                                      imageUrl: event.imageUrl,
                                      category: event.category || "",
                                      price: event.price ? event.price.toString() : "",
                                      images: event.additionalImages || []
                                    });
                                    setIsEditEventModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="text-xs h-8 px-2"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete ${event.title}?`)) {
                                      try {
                                        const response = await apiRequest('DELETE', `/api/events/${event.id}`);
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                                          toast({
                                            title: "Event Deleted",
                                            description: `${event.title} has been deleted`
                                          });
                                        } else {
                                          throw new Error(`Failed to delete event: ${response.statusText}`);
                                        }
                                      } catch (error: any) {
                                        toast({
                                          title: "Error",
                                          description: error.message || "Failed to delete event",
                                          variant: "destructive"
                                        });
                                      }
                                    }
                                  }}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Tickets Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Ticket className="h-4 w-4 mr-2" />
                      Tickets Management
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">Manage tickets for events.</p>
                  <Button 
                    onClick={() => navigate('/ticket-management')}
                    className="w-full sm:w-auto"
                  >
                    Manage Tickets
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Analytics Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">View site and event analytics.</p>
                  <Button 
                    onClick={() => navigate('/analytics')}
                    className="w-full sm:w-auto"
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Event Modal */}
      <Dialog open={isEditEventModalOpen} onOpenChange={setIsEditEventModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{eventFormData.id === 0 ? 'Create New Event' : 'Edit Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEventFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventFormData.date}
                  onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventFormData.time}
                  onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  type="text"
                  value={eventFormData.price}
                  onChange={(e) => setEventFormData({...eventFormData, price: e.target.value})}
                  placeholder="e.g. 20.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={eventFormData.category}
                onChange={(e) => setEventFormData({...eventFormData, category: e.target.value})}
                placeholder="e.g. Music, Sports, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventFormData.description}
                onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Main Image</Label>
              <div className="mt-1 flex items-center space-x-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                {imagePreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={clearImagePreview}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative w-full max-w-xs mx-auto">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="rounded border object-cover h-40 w-full"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Additional Images</Label>
              <div className="mt-1 flex items-center space-x-3">
                <Input
                  id="additionalImages"
                  type="file"
                  accept="image/*"
                  onChange={handleMultipleImageUpload}
                  className="flex-1"
                  multiple
                />
                {(imagePreviewUrls.length > 0 || (eventFormData.images && eventFormData.images.length > 0)) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={clearAllImagePreviews}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Previews of newly uploaded images */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">New Uploads:</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={`upload-${index}`} className="relative h-20 rounded border overflow-hidden">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Display of existing images */}
              {eventFormData.images && eventFormData.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Existing Images:</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {eventFormData.images.map((img, index) => (
                      <div key={`existing-${index}`} className="relative h-20 rounded border overflow-hidden">
                        <img 
                          src={img} 
                          alt={`Image ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => {
                            const updatedImages = [...eventFormData.images];
                            updatedImages.splice(index, 1);
                            setEventFormData({...eventFormData, images: updatedImages});
                          }}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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