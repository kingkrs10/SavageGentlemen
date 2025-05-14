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
  MoreHorizontal
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // State for list modals
  const [createListOpen, setCreateListOpen] = useState(false);
  const [listForm, setListForm] = useState({ name: '', description: '' });
  
  // State for subscriber modals
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false);
  const [subscriberForm, setSubscriberForm] = useState({ email: '', name: '', listId: '' });
  
  // State for import/export
  const [importCsvOpen, setImportCsvOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('');
  
  // Campaign state
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ 
    name: '', 
    subject: '', 
    content: '', 
    listIds: [] as string[],
    sendTo: 'list' // 'list' or 'all'
  });
  const [sendTestEmailOpen, setSendTestEmailOpen] = useState(false);
  const [testEmails, setTestEmails] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [editingCampaign, setEditingCampaign] = useState(false);
  
  // Event management state
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    category: '',
    featured: false,
    imageUrl: ''
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  
  // Ticket management state
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [editTicketOpen, setEditTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    status: 'active',
    eventId: '',
    saleStartDate: '',
    saleEndDate: ''
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriberParams, setSubscriberParams] = useState({
    search: '',
    listId: '',
    status: '',
  });

  useEffect(() => {
    // Check user authentication
    const user = localStorage.getItem('user');
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the admin page.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      console.log("Admin page - Raw parsed user:", parsedUser);
      
      // Handle deeply nested data structure
      let userData;
      if (parsedUser.data && parsedUser.data.data) {
        userData = parsedUser.data.data;
      } else if (parsedUser.data) {
        userData = parsedUser.data;
      } else {
        userData = parsedUser;
      }
      
      console.log("Admin page - Final user data:", userData);
      setCurrentUser(userData);
      
      if (!userData.role || userData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
      } else {
        console.log("Admin page - Access granted for admin user:", userData.username);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast({
        title: "Authentication Error",
        description: "There was a problem with your session. Please log in again.",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, []);

  // Fetch email lists
  const {
    data: emailLists = [],
    isLoading: emailListsLoading,
    error: emailListsError
  } = useQuery({
    queryKey: ["/api/email-marketing/lists"],
    enabled: !!currentUser && currentUser?.role === 'admin',
    retry: 3,
  });

  // Fetch subscribers
  const {
    data: emailSubscribers = { subscribers: [] },
    isLoading: emailSubscribersLoading,
    error: emailSubscribersError
  } = useQuery({
    queryKey: ["/api/email-marketing/subscribers", subscriberParams],
    enabled: !!currentUser && currentUser?.role === 'admin',
    retry: 3,
  });
  
  // Fetch campaigns
  const {
    data: emailCampaigns = [],
    isLoading: emailCampaignsLoading,
    error: emailCampaignsError
  } = useQuery({
    queryKey: ["/api/email-marketing/campaigns"],
    enabled: !!currentUser && currentUser?.role === 'admin',
    retry: 3,
  });
  
  // Fetch events
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError
  } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!currentUser && currentUser?.role === 'admin',
    retry: 3,
  });
  
  // Fetch tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError
  } = useQuery({
    queryKey: ["/api/tickets"],
    enabled: !!currentUser && currentUser?.role === 'admin',
    retry: 3,
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async () => {
      if (!listForm.name.trim()) {
        throw new Error('List name is required');
      }
      
      const response = await apiRequest('POST', '/api/email-marketing/lists', listForm);
      
      if (response.ok) {
        setCreateListOpen(false);
        setListForm({ name: '', description: '' });
        toast({
          title: "List Created",
          description: `Successfully created "${listForm.name}" list`,
        });
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/lists"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create list');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating List",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Add subscriber mutation
  const addSubscriberMutation = useMutation({
    mutationFn: async () => {
      if (!subscriberForm.email.trim()) {
        throw new Error('Email is required');
      }
      
      const response = await apiRequest('POST', '/api/email-marketing/subscribers', subscriberForm);
      
      if (response.ok) {
        setAddSubscriberOpen(false);
        setSubscriberForm({ email: '', name: '', listId: '' });
        toast({
          title: "Subscriber Added",
          description: `Successfully added ${subscriberForm.email} to the list`,
        });
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/subscribers"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add subscriber');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Subscriber",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Import CSV mutation
  const importCsvMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please select a CSV file');
      }
      
      if (!selectedListId) {
        throw new Error('Please select a list');
      }
      
      const formData = new FormData();
      formData.append('csv', selectedFile);
      formData.append('listId', selectedListId);
      
      const response = await fetch(`/api/email-marketing/subscribers/import`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setImportCsvOpen(false);
        setSelectedFile(null);
        setSelectedListId('');
        
        const result = await response.json();
        
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.imported} subscribers`,
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/subscribers"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import subscribers');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Export CSV handler
  const handleExportCsv = async () => {
    try {
      const response = await fetch('/api/email-marketing/subscribers/export');
      
      if (!response.ok) {
        throw new Error('Failed to export subscribers');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Subscribers exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle list creation submission
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    createListMutation.mutate();
  };

  // Handle subscriber addition
  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    addSubscriberMutation.mutate();
  };

  // Handle import submission
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importCsvMutation.mutate();
  };

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!campaignForm.name.trim() || !campaignForm.subject.trim() || !campaignForm.content.trim()) {
        throw new Error('Name, subject, and content are required');
      }
      
      // For list targeting, check if at least one list is selected
      if (campaignForm.sendTo === 'list' && campaignForm.listIds.length === 0) {
        throw new Error('Please select at least one list for the campaign');
      }
      
      const response = await apiRequest('POST', '/api/email-marketing/campaigns', campaignForm);
      
      if (response.ok) {
        setCreateCampaignOpen(false);
        setCampaignForm({ 
          name: '', 
          subject: '', 
          content: '', 
          listIds: [],
          sendTo: 'list'
        });
        setEditingCampaign(false);
        
        toast({
          title: "Campaign Created",
          description: `Successfully created "${campaignForm.name}" campaign`,
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/campaigns"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create campaign');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Campaign",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      if (!testEmails.trim()) {
        throw new Error('Please enter at least one email address');
      }
      
      if (!selectedCampaignId) {
        throw new Error('No campaign selected for test email');
      }
      
      const emails = testEmails.split(',').map(email => email.trim());
      
      const response = await apiRequest('POST', `/api/email-marketing/campaigns/${selectedCampaignId}/test`, {
        emails
      });
      
      if (response.ok) {
        setSendTestEmailOpen(false);
        setTestEmails('');
        
        toast({
          title: "Test Email Sent",
          description: `Test email sent to ${emails.length} recipient(s)`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send test email');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Test Email",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest('POST', `/api/email-marketing/campaigns/${campaignId}/send`, {});
      
      if (response.ok) {
        toast({
          title: "Campaign Sent",
          description: "Your campaign has been queued for delivery",
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/campaigns"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send campaign');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Campaign",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest('DELETE', `/api/email-marketing/campaigns/${campaignId}`, {});
      
      if (response.ok) {
        toast({
          title: "Campaign Deleted",
          description: "Campaign has been deleted successfully",
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/email-marketing/campaigns"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete campaign');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Campaign",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventForm.title.trim() || !eventForm.date || !eventForm.location) {
        throw new Error("Please fill all required fields");
      }
      
      // First upload image if one is selected
      let imageUrl = eventForm.imageUrl;
      
      if (eventImageFile) {
        const formData = new FormData();
        formData.append('image', eventImageFile);
        
        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }
      
      // Then create the event
      const payload = {
        ...eventForm,
        price: parseFloat(eventForm.price),
        imageUrl
      };
      
      const response = await apiRequest('POST', '/api/events', payload);
      
      if (response.ok) {
        toast({
          title: "Event Created",
          description: "Event has been created successfully",
        });
        
        setCreateEventOpen(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          price: '',
          category: '',
          featured: false,
          imageUrl: ''
        });
        setEventImageFile(null);
        
        queryClient.invalidateQueries({queryKey: ["/api/events"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Event",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !eventForm.title.trim() || !eventForm.date || !eventForm.location) {
        throw new Error("Please fill all required fields");
      }
      
      // First upload image if a new one is selected
      let imageUrl = eventForm.imageUrl;
      
      if (eventImageFile) {
        const formData = new FormData();
        formData.append('image', eventImageFile);
        
        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }
      
      // Then update the event
      const payload = {
        ...eventForm,
        price: parseFloat(eventForm.price),
        imageUrl
      };
      
      const response = await apiRequest('PUT', `/api/events/${selectedEvent.id}`, payload);
      
      if (response.ok) {
        toast({
          title: "Event Updated",
          description: "Event has been updated successfully",
        });
        
        setEditEventOpen(false);
        setSelectedEvent(null);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          price: '',
          category: '',
          featured: false,
          imageUrl: ''
        });
        setEventImageFile(null);
        
        queryClient.invalidateQueries({queryKey: ["/api/events"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Event",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest('DELETE', `/api/events/${eventId}`, {});
      
      if (response.ok) {
        toast({
          title: "Event Deleted",
          description: "Event has been deleted successfully",
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/events"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Event",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Create ticket type mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!ticketForm.name.trim() || !ticketForm.price || !ticketForm.eventId) {
        throw new Error("Please fill all required fields");
      }
      
      const payload = {
        ...ticketForm,
        price: parseFloat(ticketForm.price),
        quantity: ticketForm.quantity === 'unlimited' ? -1 : parseInt(ticketForm.quantity)
      };
      
      const response = await apiRequest('POST', '/api/tickets', payload);
      
      if (response.ok) {
        toast({
          title: "Ticket Type Created",
          description: "Ticket type has been created successfully",
        });
        
        setCreateTicketOpen(false);
        setTicketForm({
          name: '',
          description: '',
          price: '',
          quantity: '',
          status: 'active',
          eventId: '',
          saleStartDate: '',
          saleEndDate: ''
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/tickets"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ticket type');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Ticket Type",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Update ticket type mutation
  const updateTicketMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !ticketForm.name.trim() || !ticketForm.price) {
        throw new Error("Please fill all required fields");
      }
      
      const payload = {
        ...ticketForm,
        price: parseFloat(ticketForm.price),
        quantity: ticketForm.quantity === 'unlimited' ? -1 : parseInt(ticketForm.quantity)
      };
      
      const response = await apiRequest('PUT', `/api/tickets/${selectedTicket.id}`, payload);
      
      if (response.ok) {
        toast({
          title: "Ticket Type Updated",
          description: "Ticket type has been updated successfully",
        });
        
        setEditTicketOpen(false);
        setSelectedTicket(null);
        setTicketForm({
          name: '',
          description: '',
          price: '',
          quantity: '',
          status: 'active',
          eventId: '',
          saleStartDate: '',
          saleEndDate: ''
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/tickets"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update ticket type');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Ticket Type",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });
  
  // Delete ticket type mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest('DELETE', `/api/tickets/${ticketId}`, {});
      
      if (response.ok) {
        toast({
          title: "Ticket Type Deleted",
          description: "Ticket type has been deleted successfully",
        });
        
        queryClient.invalidateQueries({queryKey: ["/api/tickets"]});
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete ticket type');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Ticket Type",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Handle campaign creation/update 
  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate();
  };

  // Handle test email send
  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    sendTestEmailMutation.mutate();
  };
  
  // Handle campaign sending
  const handleSendCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };
  
  // Handle campaign deletion
  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };
  
  // Handle campaign editing
  const handleEditCampaign = (campaign: any) => {
    setCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      listIds: campaign.listIds || [],
      sendTo: campaign.listIds && campaign.listIds.length > 0 ? 'list' : 'all'
    });
    setSelectedCampaignId(campaign.id);
    setEditingCampaign(true);
    setCreateCampaignOpen(true);
  };
  
  // Open test email dialog
  const handleOpenTestEmailDialog = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSendTestEmailOpen(true);
  };

  // Apply search filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle event image upload
  const handleEventImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setEventImageFile(e.target.files[0]);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEventForm(prev => ({ ...prev, imageUrl: reader.result }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Open event create modal
  const handleOpenCreateEvent = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      price: '',
      category: '',
      featured: false,
      imageUrl: ''
    });
    setEventImageFile(null);
    setCreateEventOpen(true);
  };
  
  // Edit event handler
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time || '',
      location: event.location,
      price: event.price.toString(),
      category: event.category || '',
      featured: event.featured || false,
      imageUrl: event.imageUrl || ''
    });
    setEventImageFile(null);
    setEditEventOpen(true);
  };
  
  // Delete event handler
  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This will also delete all associated tickets.')) {
      deleteEventMutation.mutate(eventId);
    }
  };
  
  // Create ticket type for event
  const handleCreateTicketForEvent = (eventId: string, eventTitle: string) => {
    setTicketForm({
      name: '',
      description: '',
      price: '',
      quantity: '',
      status: 'active',
      eventId,
      saleStartDate: '',
      saleEndDate: ''
    });
    setSelectedEventId(eventId);
    setCreateTicketOpen(true);
  };
  
  // Edit ticket handler
  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketForm({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price.toString(),
      quantity: ticket.quantity === -1 ? 'unlimited' : ticket.quantity.toString(),
      status: ticket.status || 'active',
      eventId: ticket.eventId.toString(),
      saleStartDate: ticket.saleStartDate ? new Date(ticket.saleStartDate).toISOString().split('T')[0] : '',
      saleEndDate: ticket.saleEndDate ? new Date(ticket.saleEndDate).toISOString().split('T')[0] : '',
    });
    setEditTicketOpen(true);
  };
  
  // Delete ticket type handler
  const handleDeleteTicket = (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket type?')) {
      deleteTicketMutation.mutate(ticketId);
    }
  };
  
  // Toggle ticket status
  const handleToggleTicketStatus = (ticket: any) => {
    const newStatus = ticket.status === 'active' ? 'inactive' : 'active';
    
    const updatePayload = {
      ...ticket,
      status: newStatus
    };
    
    apiRequest('PUT', `/api/tickets/${ticket.id}`, updatePayload)
      .then(response => {
        if (response.ok) {
          toast({
            title: "Status Updated",
            description: `Ticket type is now ${newStatus}`,
          });
          
          queryClient.invalidateQueries({queryKey: ["/api/tickets"]});
        } else {
          toast({
            title: "Update Failed",
            description: "Failed to update ticket status",
            variant: "destructive"
          });
        }
      })
      .catch(error => {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive"
        });
      });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriberParams(prev => ({
      ...prev,
      search: searchQuery
    }));
  };

  // Apply list filter
  const handleListFilter = (listId: string) => {
    setSubscriberParams(prev => ({
      ...prev,
      listId: listId === prev.listId ? '' : listId
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSubscriberParams({
      search: '',
      listId: '',
      status: ''
    });
  };

  const [activeTab, setActiveTab] = React.useState("dashboard");
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ADMIN DASHBOARD</h1>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold">Logged in</span>
          <br/>
          <span>{currentUser?.username || 'User'}</span>
        </div>
      </div>
      
      <div className="mb-8 border rounded-md p-1 bg-card">
        <Tabs defaultValue="events" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="livestreams">Livestreams</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="email-marketing">Email Marketing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Email Marketing Content */}
          <TabsContent value="email-marketing">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Email Marketing</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportCsv}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setImportCsvOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Import CSV
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setCreateListOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create New List
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="subscribers" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                    <TabsTrigger value="email-lists">Email Lists</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="subscribers">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">ALL SUBSCRIBERS</h3>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setAddSubscriberOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subscriber
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center gap-4">
                        <form onSubmit={handleSearchSubmit} className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by email or name..."
                              className="pl-8"
                              value={searchQuery}
                              onChange={handleSearchChange}
                            />
                          </div>
                        </form>
                        
                        <div className="flex gap-2">
                          <select 
                            className="border rounded-md px-3 py-2 bg-background text-sm" 
                            value={subscriberParams.status}
                            onChange={(e) => setSubscriberParams(prev => ({...prev, status: e.target.value}))}
                          >
                            <option value="">Filter by status</option>
                            <option value="active">Active</option>
                            <option value="unsubscribed">Unsubscribed</option>
                            <option value="bounced">Bounced</option>
                          </select>
                          
                          <select 
                            className="border rounded-md px-3 py-2 bg-background text-sm" 
                            value={subscriberParams.listId}
                            onChange={(e) => setSubscriberParams(prev => ({...prev, listId: e.target.value}))}
                          >
                            <option value="">Filter by list</option>
                            {emailLists && Array.isArray(emailLists) && emailLists.map((list: any) => (
                              <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                          </select>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={resetFilters}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                      
                      {emailSubscribersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p>Loading subscribers...</p>
                        </div>
                      ) : emailSubscribersError ? (
                        <div className="text-center py-8 text-destructive">
                          <p>Error loading subscribers. Please try again.</p>
                        </div>
                      ) : emailSubscribers.subscribers && emailSubscribers.subscribers.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Lists</th>
                                <th className="px-4 py-3 text-left font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {emailSubscribers.subscribers.map((subscriber: any) => (
                                <tr key={subscriber.id} className="hover:bg-muted/50">
                                  <td className="px-4 py-3">{subscriber.email}</td>
                                  <td className="px-4 py-3">{subscriber.name || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      subscriber.status === 'active' ? 'bg-green-100 text-green-800' :
                                      subscriber.status === 'unsubscribed' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {subscriber.status || 'active'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {subscriber.lists && subscriber.lists.length > 0
                                      ? subscriber.lists.map((list: any) => list.name).join(', ')
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                          Remove
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-16 border rounded-md">
                          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg mb-2">NO SUBSCRIBERS YET</h3>
                          <p className="text-muted-foreground mb-4">Import subscribers via CSV or add them manually.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email-lists">
                    <div className="space-y-4">
                      {emailListsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p>Loading email lists...</p>
                        </div>
                      ) : emailListsError ? (
                        <div className="text-center py-8 text-destructive">
                          <p>Error loading email lists. Please try again.</p>
                        </div>
                      ) : emailLists && emailLists.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {emailLists.map((list: any) => (
                            <Card key={list.id} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle>{list.name}</CardTitle>
                                <CardDescription>
                                  {list.description || 'No description provided'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Subscribers:</span>
                                    <span className="font-medium">{list.subscriberCount || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="font-medium">
                                      {new Date(list.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="flex gap-2 justify-end border-t pt-4">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button variant="destructive" size="sm">
                                  <Trash className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 border rounded-md">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg mb-2">NO EMAIL LISTS YET</h3>
                          <p className="text-muted-foreground mb-4">Create your first email list to organize your subscribers.</p>
                          <Button onClick={() => setCreateListOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Create New List
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="campaigns">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">ALL CAMPAIGNS</h3>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            setCampaignForm({ 
                              name: '', 
                              subject: '', 
                              content: '', 
                              listIds: [],
                              sendTo: 'list' 
                            });
                            setEditingCampaign(false);
                            setCreateCampaignOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Campaign
                        </Button>
                      </div>
                      
                      {emailCampaignsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p>Loading campaigns...</p>
                        </div>
                      ) : emailCampaignsError ? (
                        <div className="text-center py-8 text-destructive">
                          <p>Error loading campaigns. Please try again.</p>
                        </div>
                      ) : emailCampaigns && emailCampaigns.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {emailCampaigns.map((campaign: any) => (
                            <Card key={campaign.id} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="mr-2">{campaign.name}</CardTitle>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleOpenTestEmailDialog(campaign.id)}>
                                        Send Test
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                                        Send Campaign
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <CardDescription>
                                  {campaign.subject}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={`font-medium ${campaign.status === 'sent' ? 'text-green-600' : campaign.status === 'sending' ? 'text-amber-600' : ''}`}>
                                      {campaign.status === 'draft' ? 'Draft' : 
                                       campaign.status === 'sending' ? 'Sending' : 
                                       campaign.status === 'sent' ? 'Sent' : 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="font-medium">
                                      {new Date(campaign.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {campaign.status === 'sent' && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Sent to:</span>
                                      <span className="font-medium">
                                        {campaign.sentCount || 0} recipients
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="flex gap-2 justify-end border-t pt-4">
                                <Button variant="outline" size="sm" onClick={() => handleOpenTestEmailDialog(campaign.id)}>
                                  Test
                                </Button>
                                {campaign.status !== 'sent' && (
                                  <Button variant="default" size="sm" onClick={() => handleSendCampaign(campaign.id)}>
                                    <Send className="h-4 w-4 mr-1" />
                                    Send
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 border rounded-md">
                          <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg mb-2">NO CAMPAIGNS YET</h3>
                          <p className="text-muted-foreground mb-4">Create your first email campaign to engage with your subscribers.</p>
                          <Button onClick={() => {
                            setCampaignForm({ 
                              name: '', 
                              subject: '', 
                              content: '', 
                              listIds: [],
                              sendTo: 'list' 
                            });
                            setEditingCampaign(false);
                            setCreateCampaignOpen(true);
                          }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Create Campaign
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other Tabs Content */}
          <TabsContent value="events">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The events management section will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="tickets">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The tickets management section will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The users management section will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="livestreams">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The livestreams management section will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The inventory management section will be available soon.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="text-center py-16 border rounded-md">
              <p className="mb-4">The analytics section will be available soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create List Dialog */}
      <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Email List</DialogTitle>
            <DialogDescription>
              Create a new list to organize your subscribers.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateList}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="list-name" className="text-sm font-medium">
                  List Name
                </label>
                <Input
                  id="list-name"
                  value={listForm.name}
                  onChange={(e) => setListForm({...listForm, name: e.target.value})}
                  placeholder="e.g., Newsletter Subscribers"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="list-description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Input
                  id="list-description"
                  value={listForm.description}
                  onChange={(e) => setListForm({...listForm, description: e.target.value})}
                  placeholder="e.g., Main newsletter subscribers list"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateListOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createListMutation.isPending}>
                {createListMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Creating...
                  </>
                ) : 'Create List'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Subscriber Dialog */}
      <Dialog open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subscriber</DialogTitle>
            <DialogDescription>
              Add a new subscriber to your email list.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddSubscriber}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="subscriber-email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="subscriber-email"
                  type="email"
                  value={subscriberForm.email}
                  onChange={(e) => setSubscriberForm({...subscriberForm, email: e.target.value})}
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="subscriber-name" className="text-sm font-medium">
                  Name (Optional)
                </label>
                <Input
                  id="subscriber-name"
                  value={subscriberForm.name}
                  onChange={(e) => setSubscriberForm({...subscriberForm, name: e.target.value})}
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="subscriber-list" className="text-sm font-medium">
                  Email List (Optional)
                </label>
                <select
                  id="subscriber-list"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={subscriberForm.listId}
                  onChange={(e) => setSubscriberForm({...subscriberForm, listId: e.target.value})}
                >
                  <option value="">Select a list</option>
                  {emailLists && Array.isArray(emailLists) && emailLists.map((list: any) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddSubscriberOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSubscriberMutation.isPending}>
                {addSubscriberMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Adding...
                  </>
                ) : 'Add Subscriber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Import CSV Dialog */}
      <Dialog open={importCsvOpen} onOpenChange={setImportCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Subscribers from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with subscriber data. The file should have headers: email, name (optional).
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleImportSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="csv-file" className="text-sm font-medium">
                  CSV File
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 2MB
                </p>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="import-list" className="text-sm font-medium">
                  Add to List (Optional)
                </label>
                <select
                  id="import-list"
                  className="border rounded-md px-3 py-2 bg-background"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                >
                  <option value="">Select a list</option>
                  {emailLists && Array.isArray(emailLists) && emailLists.map((list: any) => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImportCsvOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={importCsvMutation.isPending}>
                {importCsvMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Importing...
                  </>
                ) : 'Import Subscribers'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Create Campaign Dialog */}
      <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? 'Update your email campaign details.' : 'Create a new email campaign to send to your subscribers.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCampaignSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="campaign-name" className="text-sm font-medium">
                  Campaign Name
                </label>
                <Input
                  id="campaign-name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  placeholder="e.g., May Newsletter"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is for your reference only and won't be shown to recipients.
                </p>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="campaign-subject" className="text-sm font-medium">
                  Email Subject
                </label>
                <Input
                  id="campaign-subject"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                  placeholder="e.g., Your May Newsletter Is Here!"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="campaign-content" className="text-sm font-medium">
                  Email Content
                </label>
                <textarea
                  id="campaign-content"
                  className="min-h-[200px] border rounded-md p-3 bg-background"
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                  placeholder="Write your email content here..."
                  required
                ></textarea>
                <p className="text-xs text-muted-foreground">
                  You can use HTML for formatting. Use {'{name}'} to personalize with the recipient's name.
                </p>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="send-to" className="text-sm font-medium">
                  Send To
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="send-to"
                      value="all"
                      checked={campaignForm.sendTo === 'all'}
                      onChange={() => setCampaignForm({...campaignForm, sendTo: 'all', listIds: []})}
                    />
                    <span>All Subscribers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="send-to"
                      value="list"
                      checked={campaignForm.sendTo === 'list'}
                      onChange={() => setCampaignForm({...campaignForm, sendTo: 'list'})}
                    />
                    <span>Specific Lists</span>
                  </label>
                </div>
              </div>
              
              {campaignForm.sendTo === 'list' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Select Lists
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {emailLists && Array.isArray(emailLists) && emailLists.map((list: any) => (
                      <label key={list.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <input
                          type="checkbox"
                          checked={campaignForm.listIds.includes(list.id)}
                          onChange={(e) => {
                            const updatedLists = e.target.checked
                              ? [...campaignForm.listIds, list.id]
                              : campaignForm.listIds.filter(id => id !== list.id);
                            setCampaignForm({...campaignForm, listIds: updatedLists});
                          }}
                        />
                        <span>{list.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateCampaignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaignMutation.isPending}>
                {createCampaignMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    {editingCampaign ? 'Updating...' : 'Creating...'}
                  </>
                ) : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Test Email Dialog */}
      <Dialog open={sendTestEmailOpen} onOpenChange={setSendTestEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify how your campaign will look.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="test-emails" className="text-sm font-medium">Email Addresses</label>
                <input 
                  type="text" 
                  id="test-emails"
                  value={testEmails}
                  onChange={e => setTestEmails(e.target.value)}
                  className="border rounded-md p-2 text-sm"
                  placeholder="email@example.com, another@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSendTestEmailOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={sendTestEmailMutation.isPending}>
                {sendTestEmailMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Sending...
                  </>
                ) : 'Send Test'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}