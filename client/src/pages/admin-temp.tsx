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
  Trash,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Radio,
  Images
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import LivestreamManager from "@/components/admin/LivestreamManager";

// Helper functions for managing deleted events in localStorage
const storeDeletedEventLocally = (event) => {
  try {
    // Get existing deleted events
    const existingEvents = JSON.parse(localStorage.getItem('sgDeletedEvents') || '[]');
    
    // Add new event with timestamp
    existingEvents.push({
      event,
      deletedAt: new Date().toISOString()
    });
    
    // Clean up events older than 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const filteredEvents = existingEvents.filter(item => 
      new Date(item.deletedAt) > twentyFourHoursAgo
    );
    
    // Save back to localStorage
    localStorage.setItem('sgDeletedEvents', JSON.stringify(filteredEvents));
    console.log(`Stored deleted event in localStorage: ${event.title}`);
  } catch (error) {
    console.error("Error storing deleted event in localStorage:", error);
  }
};

const getDeletedEventsFromLocal = () => {
  try {
    const events = JSON.parse(localStorage.getItem('sgDeletedEvents') || '[]');
    return events;
  } catch (error) {
    console.error("Error retrieving deleted events from localStorage:", error);
    return [];
  }
};

const getLastDeletedEventFromLocal = () => {
  const events = getDeletedEventsFromLocal();
  if (events.length === 0) return null;
  
  // Sort by deletedAt (newest first)
  events.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
  return events[0];
};

// Function to find a deleted event by partial name match
const findDeletedEventByName = (nameFragment) => {
  const events = getDeletedEventsFromLocal();
  if (events.length === 0) return null;
  
  // Find any event with a title containing the nameFragment (case insensitive)
  const matchingEvent = events.find(item => 
    item.event.title.toLowerCase().includes(nameFragment.toLowerCase())
  );
  
  return matchingEvent;
};

// Function to get recently deleted events (past hour)
const getRecentlyDeletedEvents = () => {
  try {
    const events = JSON.parse(localStorage.getItem('sgDeletedEvents') || '[]');
    
    // Filter for events deleted within the past hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    return events.filter(item => new Date(item.deletedAt) > oneHourAgo);
  } catch (error) {
    console.error("Error retrieving recent deleted events:", error);
    return [];
  }
};

export default function AdminTemp() {
  const [, navigate] = useLocation();
  const { isAdmin, user } = useUser();
  const [activeTab, setActiveTab] = useState("tools");
  const { toast } = useToast();
  
  // Event management state
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isUndoAlertVisible, setIsUndoAlertVisible] = useState(false);
  const [lastDeletedEvent, setLastDeletedEvent] = useState<any>(null);
  
  // Sponsored content state
  const [isCreateAdModalOpen, setIsCreateAdModalOpen] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState<string>('standard');
  const [editingAd, setEditingAd] = useState<any>(null);
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    type: 'standard',
    imageUrl: '',
    logoUrl: '',
    linkUrl: '',
    backgroundColor: 'bg-gray-800',
    textColor: 'text-white',
    ctaText: 'Learn More',
    price: '',
    eventDate: '',
    location: '',
    videoUrl: '',
    isActive: true,
    priority: 0,
    startDate: '',
    endDate: ''
  });
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [adUploadedImage, setAdUploadedImage] = useState<File | null>(null);
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

  // Fetch sponsored content
  const { 
    data: sponsoredContent = [], 
    isLoading: adsLoading,
    refetch: refetchAds
  } = useQuery({ 
    queryKey: ['/api/sponsored-content'], 
    queryFn: () => apiRequest('GET', '/api/sponsored-content').then(res => res.json())
  });

  // Mutations for sponsored content
  const createAdMutation = useMutation({
    mutationFn: async (adData: any) => {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (adData[key] !== null && adData[key] !== undefined) {
          formData.append(key, adData[key]);
        }
      });
      
      // Add image if uploaded
      if (adUploadedImage) {
        formData.append('image', adUploadedImage);
      }
      
      const response = await fetch('/api/admin/sponsored-content', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'user-id': user?.id?.toString() || ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      refetchAds();
      setIsCreateAdModalOpen(false);
      setEditingAd(null);
      resetAdForm();
      toast({
        title: "Success",
        description: "Advertisement created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create advertisement",
        variant: "destructive"
      });
    }
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, adData }: { id: number; adData: any }) => {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (adData[key] !== null && adData[key] !== undefined) {
          formData.append(key, adData[key]);
        }
      });
      
      // Add image if uploaded
      if (adUploadedImage) {
        formData.append('image', adUploadedImage);
      }
      
      const response = await fetch(`/api/admin/sponsored-content/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'user-id': user?.id?.toString() || ''
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      refetchAds();
      setIsCreateAdModalOpen(false);
      setEditingAd(null);
      resetAdForm();
      toast({
        title: "Success",
        description: "Advertisement updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update advertisement",
        variant: "destructive"
      });
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/sponsored-content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsored-content'] });
      toast({
        title: "Success",
        description: "Advertisement deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete advertisement",
        variant: "destructive"
      });
    }
  });
  
  // Function for checking deleted events in localStorage
  const [isCheckingLocalEvents, setIsCheckingLocalEvents] = useState(false);
  
  const checkForDeletedEvents = (specificName = '', timeWindow = null) => {
    setIsCheckingLocalEvents(true);
    try {
      let deletedItems = [];
      
      if (specificName) {
        // Look for a specific event name if provided
        const foundItem = findDeletedEventByName(specificName);
        
        if (foundItem) {
          deletedItems = [foundItem];
        } else {
          toast({
            title: "Event Not Found",
            description: `Could not find deleted event containing "${specificName}" in the name.`,
            variant: "destructive"
          });
          setIsCheckingLocalEvents(false);
          return;
        }
      } else if (timeWindow === 'recent') {
        // Get events deleted in the past hour
        deletedItems = getRecentlyDeletedEvents();
        
        if (deletedItems.length === 0) {
          toast({
            title: "No Recent Deletions",
            description: "No events were deleted within the past hour.",
            variant: "destructive"
          });
          setIsCheckingLocalEvents(false);
          return;
        }
      } else {
        // Just get the last deleted event
        const lastItem = getLastDeletedEventFromLocal();
        if (lastItem) deletedItems = [lastItem];
      }
      
      if (deletedItems.length > 0) {
        // Show notifications for found events
        if (deletedItems.length === 1) {
          // Single event found - show it in UI
          const deletedItem = deletedItems[0];
          setLastDeletedEvent(deletedItem.event);
          setIsUndoAlertVisible(true);
          
          toast({
            title: "Deleted Event Found",
            description: `Found deleted event: "${deletedItem.event.title}". You can now restore it.`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestoreEvent(deletedItem.event)}
              >
                Restore
              </Button>
            ),
          });
        } else {
          // Multiple events found - show count and first one
          setLastDeletedEvent(deletedItems[0].event);
          setIsUndoAlertVisible(true);
          
          toast({
            title: `${deletedItems.length} Deleted Events Found`,
            description: `Found ${deletedItems.length} recently deleted events. First one: "${deletedItems[0].event.title}"`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestoreEvent(deletedItems[0].event)}
              >
                Restore First
              </Button>
            ),
          });
        }
      } else {
        toast({
          title: "No Deleted Events",
          description: "No deleted events were found."
        });
      }
    } catch (error) {
      console.error("Error checking for deleted events:", error);
      toast({
        title: "Error",
        description: "Failed to check for deleted events",
        variant: "destructive"
      });
    } finally {
      setIsCheckingLocalEvents(false);
    }
  };
  
  // Function to restore an event from localStorage
  const handleRestoreEvent = async (eventToRestore) => {
    try {
      // Create formData from the stored event
      const formData = new FormData();
      formData.append('title', eventToRestore.title);
      formData.append('description', eventToRestore.description || '');
      formData.append('date', new Date(eventToRestore.date).toISOString().split('T')[0]);
      formData.append('time', eventToRestore.time || '');
      formData.append('location', eventToRestore.location);
      formData.append('imageUrl', eventToRestore.imageUrl || '');
      formData.append('category', eventToRestore.category || '');
      formData.append('price', String(eventToRestore.price || 0));
      
      // Create the event
      const response = await apiRequest('POST', '/api/admin/events', formData);
      if (!response.ok) {
        throw new Error('Failed to restore event');
      }
      
      // Remove from localStorage
      const allEvents = getDeletedEventsFromLocal();
      const updatedEvents = allEvents.filter(item => item.event.id !== eventToRestore.id);
      localStorage.setItem('sgDeletedEvents', JSON.stringify(updatedEvents));
      
      // Success notification
      setIsUndoAlertVisible(false);
      setLastDeletedEvent(null);
      toast({
        title: "Event Restored",
        description: `${eventToRestore.title} has been restored successfully!`
      });
      
      // Refresh events list
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      return await response.json();
    } catch (error) {
      console.error("Error restoring event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to restore event",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Restore deleted event mutation
  const restoreEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest('POST', `/api/admin/events/restore/${eventId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to restore event: ${errorText}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsUndoAlertVisible(false);
      setLastDeletedEvent(null);
      toast({
        title: "Event Restored",
        description: `${data.event.title} has been restored successfully!`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore event",
        variant: "destructive"
      });
    }
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
            'user-id': user?.id?.toString() || ''
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create event: ${errorText}`);
        }
        return await response.json();
      } else {
        // Update existing event
        const response = await fetch(`/api/admin/events/${eventId}`, {
          method: 'PUT',
          body: eventData,
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'user-id': user?.id?.toString() || '',
            'x-user-data': JSON.stringify({
              id: user?.id,
              username: user?.username,
              role: user?.role
            })
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update event: ${errorText}`);
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

  // Ad form management functions
  const resetAdForm = () => {
    setAdFormData({
      title: '',
      description: '',
      type: 'standard',
      imageUrl: '',
      logoUrl: '',
      linkUrl: '',
      backgroundColor: 'bg-gray-800',
      textColor: 'text-white',
      ctaText: 'Learn More',
      price: '',
      eventDate: '',
      location: '',
      videoUrl: '',
      isActive: true,
      priority: 0,
      startDate: '',
      endDate: ''
    });
    setAdImagePreview(null);
    setAdUploadedImage(null);
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdUploadedImage(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setAdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        // Update existing ad
        updateAdMutation.mutate({ id: editingAd.id, adData: adFormData });
      } else {
        // Create new ad
        createAdMutation.mutate(adFormData);
      }
    } catch (error) {
      console.error("Error submitting ad form:", error);
      toast({
        title: "Error",
        description: "Failed to submit advertisement data",
        variant: "destructive"
      });
    }
  };

  const handleEditAd = (ad: any) => {
    setEditingAd(ad);
    setAdFormData({
      title: ad.title || '',
      description: ad.description || '',
      type: ad.type || 'standard',
      imageUrl: ad.imageUrl || '',
      logoUrl: ad.logoUrl || '',
      linkUrl: ad.linkUrl || '',
      backgroundColor: ad.backgroundColor || 'bg-gray-800',
      textColor: ad.textColor || 'text-white',
      ctaText: ad.ctaText || 'Learn More',
      price: ad.price || '',
      eventDate: ad.eventDate || '',
      location: ad.location || '',
      videoUrl: ad.videoUrl || '',
      isActive: ad.isActive !== undefined ? ad.isActive : true,
      priority: ad.priority || 0,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : ''
    });
    setAdImagePreview(ad.imageUrl || null);
    setAdUploadedImage(null);
    setIsCreateAdModalOpen(true);
  };

  const handleDeleteAd = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete the advertisement "${title}"? This action cannot be undone.`)) {
      deleteAdMutation.mutate(id);
    }
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
        
        {/* Undo deletion alert */}
        {isUndoAlertVisible && lastDeletedEvent && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-yellow-400">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Event "{lastDeletedEvent.title}" was deleted.
                    <button 
                      onClick={() => restoreEventMutation.mutate(lastDeletedEvent.id)}
                      className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                    >
                      Undo
                    </button>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
                onClick={() => setIsUndoAlertVisible(false)}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <Tabs 
          defaultValue="tools" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full grid grid-cols-6 mb-6">
            <TabsTrigger value="tools" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1 text-xs sm:text-sm" data-value="content">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-1 text-xs sm:text-sm">
              <Radio className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1 text-xs sm:text-sm">
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Ads</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Free Tickets Monitoring Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Free Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Monitor free ticket usage and analytics.</p>
                  <Button 
                    onClick={() => navigate('/free-tickets')}
                    className="w-full h-10 text-sm"
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              {/* Email Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Email Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Manage user emails and password resets.</p>
                  <Button 
                    onClick={() => navigate('/email-management')}
                    className="w-full h-10 text-sm"
                  >
                    Manage Emails
                  </Button>
                </CardContent>
              </Card>

              {/* Media Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Images className="h-4 w-4 mr-2" />
                    Media Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Upload and manage photos and videos securely.</p>
                  <Button 
                    onClick={() => navigate('/admin/media')}
                    className="w-full h-10 text-sm"
                  >
                    Manage Media
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
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={checkForDeletedEvents}
                          className="h-8 text-xs"
                          variant="outline"
                          size="sm"
                          disabled={isCheckingLocalEvents}
                        >
                          {isCheckingLocalEvents ? "Checking..." : "Check for Deleted Events"}
                        </Button>
                      </div>
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
                                        // Store the event info for potential undo operation
                                        setLastDeletedEvent(event);
                                        
                                        // Use the admin-specific endpoint to ensure proper authorization
                                        const response = await apiRequest('DELETE', `/api/admin/events/${event.id}`);
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                                          setIsUndoAlertVisible(true);
                                          toast({
                                            title: "Event Deleted",
                                            description: `${event.title} has been deleted successfully. You can undo this deletion if needed.`
                                          });
                                        } else {
                                          // Get detailed error message if available
                                          let errorMessage = `Failed to delete event: ${response.statusText}`;
                                          try {
                                            const errorData = await response.json();
                                            if (errorData && errorData.message) {
                                              errorMessage = errorData.message;
                                            }
                                          } catch (e) {
                                            // If we can't parse the response, use the original error message
                                          }
                                          throw new Error(errorMessage);
                                        }
                                      } catch (error: any) {
                                        console.error("Delete event error:", error);
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
          
          <TabsContent value="ads" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Sponsored Content Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Sponsored Content Management
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingAd(null);
                        setSelectedAdType('standard');
                        setIsCreateAdModalOpen(true);
                      }}
                      className="h-8 text-xs"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Ad
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm mb-4">Manage sponsored content and advertisements displayed on your site.</p>
                  
                  {/* Ad Types Quick Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Standard Ad",
                          description: "Create a standard text-based advertisement"
                        });
                      }}
                    >
                      Standard Ad
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Banner Ad",
                          description: "Create a banner with background image"
                        });
                      }}
                    >
                      Banner Ad
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Product Showcase",
                          description: "Create a product showcase advertisement"
                        });
                      }}
                    >
                      Product Showcase
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Event Promotion",
                          description: "Create an event promotion advertisement"
                        });
                      }}
                    >
                      Event Promo
                    </Button>
                  </div>

                  {/* Current Ads List */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Current Advertisements</h3>
                    {adsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-xs">Loading ads...</p>
                      </div>
                    ) : sponsoredContent.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No ads created yet</p>
                        <p className="text-xs">Click "Create Ad" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sponsoredContent.map((ad: any) => (
                          <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{ad.title}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {ad.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                                  {ad.type}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{ad.description}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {ad.views || 0} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {ad.clicks || 0} clicks
                                </span>
                                <span>Priority: {ad.priority || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEditAd(ad)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteAd(ad.id, ad.title)}
                                disabled={deleteAdMutation.isPending}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ad Management Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "View Analytics",
                          description: "Ad performance analytics will be shown here"
                        });
                      }}
                    >
                      View Analytics
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Schedule Ads",
                          description: "Ad scheduling interface will be shown here"
                        });
                      }}
                    >
                      Schedule Ads
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        toast({
                          title: "Ad Settings",
                          description: "Global ad settings will be shown here"
                        });
                      }}
                    >
                      Ad Settings
                    </Button>
                  </div>
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
          
          <TabsContent value="live" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Live Controls Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Radio className="h-4 w-4 mr-2" />
                    Live Stream Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LivestreamManager />
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

      {/* Ad Creation/Edit Modal */}
      <Dialog open={isCreateAdModalOpen} onOpenChange={setIsCreateAdModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAdFormSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-title">Title *</Label>
                <Input
                  id="ad-title"
                  value={adFormData.title}
                  onChange={(e) => setAdFormData({...adFormData, title: e.target.value})}
                  required
                  placeholder="Enter ad title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ad-type">Advertisement Type *</Label>
                <Select 
                  value={adFormData.type} 
                  onValueChange={(value) => setAdFormData({...adFormData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ad-description">Description *</Label>
              <Textarea
                id="ad-description"
                value={adFormData.description}
                onChange={(e) => setAdFormData({...adFormData, description: e.target.value})}
                required
                placeholder="Enter ad description"
                rows={3}
              />
            </div>
            
            {/* URLs and Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-link">Link URL</Label>
                <Input
                  id="ad-link"
                  value={adFormData.linkUrl}
                  onChange={(e) => setAdFormData({...adFormData, linkUrl: e.target.value})}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ad-cta">Call-to-Action Text</Label>
                <Input
                  id="ad-cta"
                  value={adFormData.ctaText}
                  onChange={(e) => setAdFormData({...adFormData, ctaText: e.target.value})}
                  placeholder="Learn More"
                />
              </div>
            </div>
            
            {/* Visual Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-bg-color">Background Color</Label>
                <Input
                  id="ad-bg-color"
                  value={adFormData.backgroundColor}
                  onChange={(e) => setAdFormData({...adFormData, backgroundColor: e.target.value})}
                  placeholder="bg-gray-800"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ad-text-color">Text Color</Label>
                <Input
                  id="ad-text-color"
                  value={adFormData.textColor}
                  onChange={(e) => setAdFormData({...adFormData, textColor: e.target.value})}
                  placeholder="text-white"
                />
              </div>
            </div>
            
            {/* Conditional Fields Based on Type */}
            {(adFormData.type === 'product' || adFormData.type === 'event') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adFormData.type === 'product' && (
                  <div className="space-y-2">
                    <Label htmlFor="ad-price">Price</Label>
                    <Input
                      id="ad-price"
                      value={adFormData.price}
                      onChange={(e) => setAdFormData({...adFormData, price: e.target.value})}
                      placeholder="$99.99"
                    />
                  </div>
                )}
                
                {adFormData.type === 'event' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ad-event-date">Event Date</Label>
                      <Input
                        id="ad-event-date"
                        value={adFormData.eventDate}
                        onChange={(e) => setAdFormData({...adFormData, eventDate: e.target.value})}
                        placeholder="March 15, 2024"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ad-location">Location</Label>
                      <Input
                        id="ad-location"
                        value={adFormData.location}
                        onChange={(e) => setAdFormData({...adFormData, location: e.target.value})}
                        placeholder="New York, NY"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Video URL for Video Ads */}
            {adFormData.type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="ad-video">Video URL</Label>
                <Input
                  id="ad-video"
                  value={adFormData.videoUrl}
                  onChange={(e) => setAdFormData({...adFormData, videoUrl: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                />
              </div>
            )}
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Advertisement Image</Label>
              <div className="flex items-center space-x-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAdImageUpload}
                  className="flex-1"
                />
                {adImagePreview && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setAdImagePreview(null);
                      setAdUploadedImage(null);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {adImagePreview && (
                <div className="mt-2 relative w-full max-w-xs mx-auto">
                  <img 
                    src={adImagePreview} 
                    alt="Ad Preview" 
                    className="rounded border object-cover h-32 w-full"
                  />
                </div>
              )}
            </div>
            
            {/* Scheduling and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-priority">Priority</Label>
                <Input
                  id="ad-priority"
                  type="number"
                  value={adFormData.priority}
                  onChange={(e) => setAdFormData({...adFormData, priority: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ad-start-date">Start Date</Label>
                <Input
                  id="ad-start-date"
                  type="date"
                  value={adFormData.startDate}
                  onChange={(e) => setAdFormData({...adFormData, startDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ad-end-date">End Date</Label>
                <Input
                  id="ad-end-date"
                  type="date"
                  value={adFormData.endDate}
                  onChange={(e) => setAdFormData({...adFormData, endDate: e.target.value})}
                />
              </div>
            </div>
            
            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ad-active"
                checked={adFormData.isActive}
                onChange={(e) => setAdFormData({...adFormData, isActive: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ad-active">Active (will be displayed on site)</Label>
            </div>
            
            <DialogFooter className="flex space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateAdModalOpen(false);
                  setEditingAd(null);
                  resetAdForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createAdMutation.isPending || updateAdMutation.isPending}
                className="flex items-center"
              >
                {(createAdMutation.isPending || updateAdMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingAd ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingAd ? 'Update Ad' : 'Create Ad'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}