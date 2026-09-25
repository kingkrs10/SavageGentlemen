import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Unlock,
  Key,
  Shield,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Layers,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Megaphone,
  FileText,
  Layout,
  RefreshCw,
  Smartphone,
  Laptop,
  ArrowRight,
  Eye,
  Save,
  Filter,
  CheckSquare,
  Square,
  Flag,
  AlertCircle,
  ListChecks,
  MessageSquare,
  MessageCircle,
  Send,
  Image as ImageIcon,
  UploadCloud,
  UserPlus,
  UserCheck,
  RotateCcw,
  Download,
  ZoomIn,
  Search,
  Mail,
  Phone,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  date: string;
  hub: "NJ/NY Committee" | "Guyana Operations" | "UK Logistics" | "All Committee";
  venue: string;
  status: "planned" | "in_progress" | "completed";
  description: string;
  checklist: string[];
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  hub: "NJ/NY Committee" | "Guyana Operations" | "UK Logistics" | "All Committee";
  whatsapp?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  status: "active" | "lead" | "advisor";
  joinedAt: string;
}

export interface CommitteeComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  authorHub: string;
  targetType: "proposal" | "milestone" | "media" | "general";
  targetId?: string;
  targetTitle?: string;
  content: string;
  createdAt: string;
}

export interface CommitteeMediaItem {
  id: string;
  title: string;
  description?: string;
  category: "flyer" | "layout" | "merch" | "moodboard" | "stage" | "general";
  url: string;
  uploadedBy: string;
  uploadedByHub: string;
  targetEvent?: string;
  fileSize?: number;
  createdAt: string;
}

// Fallback default passcode (case-insensitive)
const DEFAULT_ACCESS_KEY = "EUPHORIA2027";
const AUTH_STORAGE_KEY = "sg_committee_auth_2027";
const ACTIVE_MEMBER_STORAGE_KEY = "sg_committee_active_member_2027";

interface GeneratedDeliverable {
  summary: string;
  microsite: {
    headline: string;
    subheadline: string;
    countdownTarget: string;
    dateBadge: string;
    venueBadge: string;
    checkoutUrl: string;
    highlights: string[];
    lineup: string[];
    ticketTiers: Array<{
      name: string;
      price: number;
      quantity: number;
      perks: string[];
    }>;
    merchIntegration: {
      active: boolean;
      title: string;
      price: number;
      checkoutUrl: string;
    };
  };
  runOfShow: {
    date: string;
    venue: string;
    schedule: Array<{ time: string; activity: string }>;
    technicalChecklist: string[];
  };
  promoKit: {
    instagramCaption: string;
    teaserHookScript: string;
    emailBlastSubject: string;
    emailBlastBody: string;
  };
  financialModel: {
    capacity: number;
    earlyBirdTickets: number;
    tier1Tickets: number;
    cabanaPackages: number;
    projectedGrossRevenue: number;
    estimatedProductionCost: number;
    projectedNetProfit: number;
    breakEvenTickets: number;
  };
}

interface ProposalItem {
  id?: number;
  title: string;
  category: string;
  author: string;
  status: string;
  venue?: string;
  targetDate?: string;
  slug?: string;
  inputData: any;
  generatedOutput: GeneratedDeliverable;
  createdAt?: string;
  updatedAt?: string;
}

export default function CommitteePortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active View State
  const [activeTab, setActiveTab] = useState<string>("generator");
  const [outputSubTab, setOutputSubTab] = useState<string>("microsite");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedProposalForModal, setSelectedProposalForModal] = useState<ProposalItem | null>(null);
  const [proposalToDelete, setProposalToDelete] = useState<ProposalItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timeline State
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [hasUnsavedTimeline, setHasUnsavedTimeline] = useState<boolean>(false);
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState<boolean>(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState<Partial<TimelineMilestone>>({
    phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
    title: "",
    date: "May 21, 2027",
    hub: "All Committee",
    venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
    status: "planned",
    description: "",
    checklist: [],
  });
  const [rawChecklistInput, setRawChecklistInput] = useState<string>("");

  // Active Committee Member Identity
  const [activeMember, setActiveMember] = useState<{ name: string; hub: string; role: string } | null>(null);
  const [isMemberIdentityModalOpen, setIsMemberIdentityModalOpen] = useState<boolean>(false);
  const [identityInputName, setIdentityInputName] = useState<string>("");
  const [identityInputHub, setIdentityInputHub] = useState<string>("NJ/NY Committee");
  const [identityInputRole, setIdentityInputRole] = useState<string>("Committee Member");

  // Member Directory state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<CommitteeMember>>({
    name: "",
    role: "Operations Lead",
    hub: "NJ/NY Committee",
    whatsapp: "",
    email: "",
    phone: "",
    bio: "",
    status: "active",
  });

  // Media Vault state & filters
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<string>("all");
  const [isUploadMediaModalOpen, setIsUploadMediaModalOpen] = useState<boolean>(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [mediaFormData, setMediaFormData] = useState({
    title: "",
    description: "",
    category: "flyer",
    url: "",
    targetEvent: "Oasis Pool Party",
  });
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [selectedImageForLightbox, setSelectedImageForLightbox] = useState<CommitteeMediaItem | null>(null);

  // Comments state & filters
  const [commentFilterHub, setCommentFilterHub] = useState<string>("all");
  const [commentFilterTarget, setCommentFilterTarget] = useState<string>("all");
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [commentTargetType, setCommentTargetType] = useState<"general" | "proposal" | "milestone">("general");
  const [commentTargetTitle, setCommentTargetTitle] = useState<string>("");
  const [commentSearchTerm, setCommentSearchTerm] = useState<string>("");
  const [expandedDiscussionMilestoneId, setExpandedDiscussionMilestoneId] = useState<string | null>(null);

  // Admin Reset Dialog State
  const [isResetDataModalOpen, setIsResetDataModalOpen] = useState<boolean>(false);

  // Clean Slate Live Input Form State (ready for live input)
  const [formData, setFormData] = useState({
    title: "",
    category: "event",
    author: "NJ/NY Committee",
    targetDate: "",
    venue: "",
    concept: "",
    talentWishlist: "",
    capacity: 450,
    earlyBirdPrice: 45,
    tier1Price: 65,
    vipCabanaPrice: 1250,
    merchTitle: "",
    merchPrice: 68,
    estimatedProductionCost: 14000,
    coverImageUrl: "",
  });

  const [activeOutput, setActiveOutput] = useState<GeneratedDeliverable | null>(null);
  const [currentEditingId, setCurrentEditingId] = useState<number | null>(null);

  // Check URL query parameters or localStorage on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlKey = searchParams.get("key") || searchParams.get("code");

    if (urlKey) {
      if (urlKey.trim().toUpperCase() === DEFAULT_ACCESS_KEY) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        toast({
          title: "Access Granted",
          description: "Authenticated via committee access link.",
        });
        return;
      }
    }

    const cachedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cachedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, [toast]);

  // Handle Passcode Unlock
  const handleVerifyPasscode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError("");
    setIsVerifying(true);

    const normalized = passcode.trim().toUpperCase();

    // Client-side quick check fallback
    if (normalized === DEFAULT_ACCESS_KEY) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      setIsVerifying(false);
      toast({
        title: "Access Granted",
        description: "Welcome to the Guyana Carnival 2027 Executive Committee Portal.",
      });
      return;
    }

    try {
      const res = await apiRequest("POST", "/api/committee/verify", { code: passcode });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        toast({
          title: "Access Granted",
          description: "Welcome to the Guyana Carnival 2027 Executive Committee Portal.",
        });
      } else {
        setAuthError("Invalid access key. Please verify with the executive committee.");
      }
    } catch {
      setAuthError("Incorrect committee access key. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockPortal = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPasscode("");
    toast({
      title: "Portal Locked",
      description: "Session closed securely.",
    });
  };

  // Queries: Saved Proposals
  const { data: savedProposals = [], isLoading: isLoadingProposals } = useQuery<ProposalItem[]>({
    queryKey: ["/api/committee/proposals"],
    enabled: isAuthenticated,
  });

  // Mutation: Generate Deliverables
  const generateMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiRequest("POST", "/api/committee/generate", payload);
      return res.json();
    },
    onSuccess: (data) => {
      setActiveOutput(data.generatedOutput);
      toast({
        title: "Output Generated",
        description: "Live microsite, run-of-show, copy kit, and budget model are ready.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Error",
        description: "Failed to generate deliverables. Please check input parameters.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Save Proposal
  const saveProposalMutation = useMutation({
    mutationFn: async (proposalPayload: any) => {
      if (currentEditingId) {
        const res = await apiRequest("PUT", `/api/committee/proposals/${currentEditingId}`, proposalPayload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/committee/proposals", proposalPayload);
        return res.json();
      }
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/proposals"] });
      setCurrentEditingId(savedItem.id);
      toast({
        title: "Proposal Saved",
        description: `Successfully saved "${savedItem.title}" to committee records.`,
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to persist proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete Proposal
  const deleteProposalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/committee/proposals/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/proposals"] });
      setProposalToDelete(null);
      if (proposalToDelete?.id === currentEditingId) {
        setCurrentEditingId(null);
      }
      toast({
        title: "Proposal Deleted",
        description: "Record removed from committee database.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not remove proposal.",
        variant: "destructive",
      });
    },
  });

  // Query: Master Timeline Milestones
  const { data: serverTimeline = [], isLoading: isLoadingTimeline } = useQuery<TimelineMilestone[]>({
    queryKey: ["/api/committee/timeline"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (serverTimeline && serverTimeline.length > 0 && milestones.length === 0) {
      setMilestones(serverTimeline);
    }
  }, [serverTimeline, milestones.length]);

  // Mutation: Save Master Timeline
  const saveTimelineMutation = useMutation({
    mutationFn: async (updatedList: TimelineMilestone[]) => {
      const res = await apiRequest("POST", "/api/committee/timeline", { milestones: updatedList });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/timeline"] });
      setHasUnsavedTimeline(false);
      toast({
        title: "Timeline Synchronized",
        description: "Master roadmap saved to cloud across all committee hubs.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not sync timeline changes to database.",
        variant: "destructive",
      });
    },
  });

  // -------------------------------------------------------------
  // Queries & Mutations: Committee Members
  // -------------------------------------------------------------
  const { data: committeeMembers = [], isLoading: isLoadingMembers } = useQuery<CommitteeMember[]>({
    queryKey: ["/api/committee/members"],
    enabled: isAuthenticated,
  });

  const saveMemberMutation = useMutation({
    mutationFn: async (payload: Partial<CommitteeMember>) => {
      const res = await apiRequest("POST", "/api/committee/members", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/members"] });
      setIsAddMemberModalOpen(false);
      setEditingMemberId(null);
      toast({
        title: "Member Saved",
        description: "Committee roster updated.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save committee member.",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/committee/members/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/members"] });
      toast({
        title: "Member Removed",
        description: "Removed from committee directory.",
      });
    },
  });

  // -------------------------------------------------------------
  // Queries & Mutations: Committee Comments
  // -------------------------------------------------------------
  const { data: committeeComments = [], isLoading: isLoadingComments } = useQuery<CommitteeComment[]>({
    queryKey: ["/api/committee/comments"],
    enabled: isAuthenticated,
  });

  const postCommentMutation = useMutation({
    mutationFn: async (payload: Partial<CommitteeComment>) => {
      const res = await apiRequest("POST", "/api/committee/comments", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/comments"] });
      setNewCommentText("");
      toast({
        title: "Comment Posted",
        description: "Feedback logged to committee record.",
      });
    },
    onError: () => {
      toast({
        title: "Post Failed",
        description: "Could not post comment.",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/committee/comments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/comments"] });
      toast({
        title: "Comment Removed",
        description: "Comment deleted from record.",
      });
    },
  });

  // -------------------------------------------------------------
  // Queries & Mutations: Media & Visual Assets
  // -------------------------------------------------------------
  const { data: mediaAssets = [], isLoading: isLoadingMedia } = useQuery<CommitteeMediaItem[]>({
    queryKey: ["/api/committee/media"],
    enabled: isAuthenticated,
  });

  const saveMediaMutation = useMutation({
    mutationFn: async (payload: Partial<CommitteeMediaItem>) => {
      const res = await apiRequest("POST", "/api/committee/media", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/media"] });
      setIsUploadMediaModalOpen(false);
      setPreviewMediaUrl(null);
      setMediaFormData({
        title: "",
        description: "",
        category: "flyer",
        url: "",
        targetEvent: "Oasis Pool Party",
      });
      toast({
        title: "Asset Saved",
        description: "Visual asset added to Executive Media Vault.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save media asset.",
        variant: "destructive",
      });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/committee/media/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/media"] });
      toast({
        title: "Asset Removed",
        description: "Visual asset deleted from vault.",
      });
    },
  });

  // -------------------------------------------------------------
  // Mutation: Reset / Clean Demo Data
  // -------------------------------------------------------------
  const resetDataMutation = useMutation({
    mutationFn: async (payload: { scope: string }) => {
      const res = await apiRequest("POST", "/api/committee/reset-data", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/committee/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/committee/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/committee/comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/committee/media"] });
      setMilestones([]);
      setActiveOutput(null);
      setIsResetDataModalOpen(false);
      toast({
        title: "Workspace Cleaned",
        description: data.message || "All demo data removed. System ready for live input.",
      });
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Could not clean workspace data.",
        variant: "destructive",
      });
    },
  });

  // Load Active Member from localStorage on mount
  useEffect(() => {
    const savedIdentity = localStorage.getItem(ACTIVE_MEMBER_STORAGE_KEY);
    if (savedIdentity) {
      try {
        const parsed = JSON.parse(savedIdentity);
        setActiveMember(parsed);
      } catch (e) {}
    }
  }, []);

  const handleSaveActiveMemberIdentity = (name: string, hub: string, role: string) => {
    const memberObj = { name: name.trim(), hub, role };
    setActiveMember(memberObj);
    localStorage.setItem(ACTIVE_MEMBER_STORAGE_KEY, JSON.stringify(memberObj));
    setFormData((prev) => ({ ...prev, author: `${memberObj.name} (${memberObj.hub})` }));
    setIsMemberIdentityModalOpen(false);
    toast({
      title: "Identity Confirmed",
      description: `Active as ${memberObj.name} • ${memberObj.hub}`,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/committee/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMediaFormData((prev) => ({
          ...prev,
          url: data.url,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        }));
        setPreviewMediaUrl(data.url);
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully.`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: data.error || "Could not upload file.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message || "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLoadExampleTemplate = () => {
    setFormData({
      title: "Oasis: The AC Marriott Welcome Pool Party",
      category: "event",
      author: activeMember ? `${activeMember.name} (${activeMember.hub})` : "NJ/NY Committee",
      targetDate: "May 21, 2027 (Guyana Independence Weekend)",
      venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
      concept: "Luxury daytime pool fete bridging international arrivals with local VIPs. High-energy soca, cabana bottle service, and Amazonian botanical atmosphere.",
      talentWishlist: "DJ Private Ryan, Dr. Esan, DJ Kevin, Savage Soundsystem",
      capacity: 450,
      earlyBirdPrice: 45,
      tier1Price: 65,
      vipCabanaPrice: 1250,
      merchTitle: "Amazonian Botanical AOP Basketball Jersey & Beach Shorts",
      merchPrice: 68,
      estimatedProductionCost: 14500,
      coverImageUrl: "",
    });
    toast({
      title: "Sample Template Loaded",
      description: "Sample event parameters populated into form.",
    });
  };

  // Helper: Cycle milestone status
  const handleCycleMilestoneStatus = (id: string) => {
    const updated = milestones.map((m) => {
      if (m.id === id) {
        const nextStatus: "planned" | "in_progress" | "completed" =
          m.status === "planned"
            ? "in_progress"
            : m.status === "in_progress"
            ? "completed"
            : "planned";
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setMilestones(updated);
    setHasUnsavedTimeline(true);
    toast({
      title: "Status Updated",
      description: "Remember to click 'Save Timeline to Cloud' to lock in changes.",
    });
  };

  // Helper: Toggle checklist item check state
  const handleToggleChecklistItem = (milestoneId: string, itemIdx: number) => {
    const updated = milestones.map((m) => {
      if (m.id === milestoneId) {
        const newChecklist = [...(m.checklist || [])];
        if (newChecklist[itemIdx].startsWith("[x] ")) {
          newChecklist[itemIdx] = newChecklist[itemIdx].replace("[x] ", "");
        } else {
          newChecklist[itemIdx] = `[x] ${newChecklist[itemIdx]}`;
        }
        return { ...m, checklist: newChecklist };
      }
      return m;
    });
    setMilestones(updated);
    setHasUnsavedTimeline(true);
  };

  // Helper: Delete milestone
  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    setHasUnsavedTimeline(true);
    toast({
      title: "Milestone Removed",
      description: "Item removed from roadmap. Click 'Save Timeline to Cloud' to persist.",
    });
  };

  // Helper: Open add milestone dialog
  const handleOpenAddMilestone = () => {
    setEditingMilestoneId(null);
    setMilestoneFormData({
      phase: "Phase 4: Carnival Week Execution (May 19–26, 2027)",
      title: "",
      date: "May 21, 2027",
      hub: "All Committee",
      venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
      status: "planned",
      description: "",
      checklist: [],
    });
    setRawChecklistInput("");
    setIsMilestoneModalOpen(true);
  };

  // Helper: Open edit milestone dialog
  const handleOpenEditMilestone = (item: TimelineMilestone) => {
    setEditingMilestoneId(item.id);
    setMilestoneFormData({ ...item });
    setRawChecklistInput((item.checklist || []).join("\n"));
    setIsMilestoneModalOpen(true);
  };

  // Helper: Save milestone from modal
  const handleSaveMilestoneModal = () => {
    if (!milestoneFormData.title?.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for this milestone or event.",
        variant: "destructive",
      });
      return;
    }

    const parsedChecklist = rawChecklistInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingMilestoneId) {
      const updated = milestones.map((m) => {
        if (m.id === editingMilestoneId) {
          return {
            ...m,
            ...milestoneFormData,
            checklist: parsedChecklist,
          } as TimelineMilestone;
        }
        return m;
      });
      setMilestones(updated);
    } else {
      const newItem: TimelineMilestone = {
        id: `m-${Date.now()}`,
        phase: milestoneFormData.phase || "Phase 2: Tri-State Buildup & Teaser Launch",
        title: milestoneFormData.title.trim(),
        date: milestoneFormData.date || "May 2027",
        hub: (milestoneFormData.hub as any) || "All Committee",
        venue: milestoneFormData.venue || "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
        status: (milestoneFormData.status as any) || "planned",
        description: milestoneFormData.description || "",
        checklist: parsedChecklist,
      };
      setMilestones([...milestones, newItem]);
    }

    setHasUnsavedTimeline(true);
    setIsMilestoneModalOpen(false);
    toast({
      title: editingMilestoneId ? "Milestone Updated" : "Milestone Added",
      description: "Click 'Save Timeline to Cloud' to persist changes.",
    });
  };

  // Helper: Reset to default roadmap
  const handleResetTimelineToDefault = () => {
    if (serverTimeline && serverTimeline.length > 0) {
      setMilestones(serverTimeline);
      setHasUnsavedTimeline(false);
      toast({
        title: "Roadmap Reset",
        description: "Reset to last cloud-synchronized state.",
      });
    }
  };

  // Clean handleCreateNew for live input
  const handleCreateNew = () => {
    setCurrentEditingId(null);
    setFormData({
      title: "",
      category: "event",
      author: activeMember ? `${activeMember.name} (${activeMember.hub})` : "NJ/NY Committee",
      targetDate: "",
      venue: "",
      concept: "",
      talentWishlist: "",
      capacity: 450,
      earlyBirdPrice: 45,
      tier1Price: 65,
      vipCabanaPrice: 1250,
      merchTitle: "",
      merchPrice: 68,
      estimatedProductionCost: 14000,
      coverImageUrl: "",
    });
    setActiveOutput(null);
    setActiveTab("generator");
  };

  // Derived Timeline Metrics
  const filteredMilestones = milestones.filter((m) => {
    const hubMatches = selectedHubFilter === "all" || m.hub === selectedHubFilter;
    const statusMatches = selectedStatusFilter === "all" || m.status === selectedStatusFilter;
    return hubMatches && statusMatches;
  });

  const totalMilestonesCount = milestones.length;
  const completedMilestonesCount = milestones.filter((m) => m.status === "completed").length;
  const inProgressMilestonesCount = milestones.filter((m) => m.status === "in_progress").length;
  const plannedMilestonesCount = milestones.filter((m) => m.status === "planned").length;
  const completionPercentage =
    totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : 0;

  // Days to Carnival / Oasis Pool Party (May 21, 2027)
  const targetCarnivalDate = new Date("2027-05-21T14:00:00Z");
  const daysUntilPoolParty = Math.max(
    0,
    Math.ceil((targetCarnivalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  // Distinct phases represented in the filtered milestones
  const distinctPhases = Array.from(new Set(filteredMilestones.map((m) => m.phase)));

  // -------------------------------------------------------------
  // 1. LOCK SCREEN (CODE ACCESS ONLY)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col items-center justify-center p-4 selection:bg-[#E5A93C] selection:text-black relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-[#D91B82]/15 via-[#FF2A85]/10 to-[#E5A93C]/15 blur-3xl rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Official 3D Brand Logo Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-3">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#D91B82]/30 via-[#FF2A85]/20 to-[#E5A93C]/30 blur-2xl rounded-full" />
              <img
                src="/images/euphoria-mas-logo.png"
                alt="Euphoria Mas"
                className="relative w-52 sm:w-60 h-auto object-contain drop-shadow-[0_0_35px_rgba(217,27,130,0.45)]"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Guyana Carnival 2027
            </h1>
            <p className="text-sm font-semibold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#D91B82] via-[#FF5CA8] to-[#E5A93C] uppercase mt-1">
              Executive Committee Portal
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Private workspace for event generation, live microsite staging, and operations.
            </p>
          </div>

          <Card className="bg-[#0D111A]/90 backdrop-blur-md border-[#1C2638] border-t-2 border-t-[#D91B82] shadow-[0_10px_45px_rgba(217,27,130,0.12)] text-white">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E5A93C] uppercase tracking-wider">
                <Key className="w-4 h-4 text-[#E5A93C]" />
                Security Verification
              </div>
              <CardTitle className="text-lg text-white">Enter Access Key</CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Authorized committee members only. Enter your executive passcode below.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerifyPasscode}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Enter committee code..."
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="bg-[#080B11] border-[#1E293B] text-white placeholder:text-gray-500 pr-10 focus:border-[#D91B82] focus:ring-[#D91B82]/25 text-center tracking-widest text-lg font-mono"
                      autoFocus
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-md bg-red-950/50 border border-red-800 text-xs text-red-300 text-center">
                      {authError}
                    </div>
                  )}
                </div>

                <div className="bg-[#090D15] p-3 rounded-lg border border-[#162030] text-[11px] text-gray-400 space-y-1">
                  <div className="flex items-center justify-between text-gray-300 font-medium">
                    <span>Committee Hubs</span>
                    <span className="text-[#E5A93C]">NJ / NY • Guyana • UK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confirmed Venue</span>
                    <span className="text-gray-300">AC Hotel Marriott (Ogle Pool)</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isVerifying || !passcode.trim()}
                  className="w-full bg-gradient-to-r from-[#D91B82] via-[#A81566] to-[#E5A93C] hover:opacity-95 text-white font-semibold shadow-lg shadow-[#D91B82]/30 h-11 transition-all"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock Committee Portal
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="text-center mt-6 text-[11px] text-gray-400">
            Confidential Executive Tool • 2027 Independence Weekend
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN COMMITTEE PORTAL WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-[#E5A93C] selection:text-black">
      {/* Top Executive Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#D91B82]/20 px-4 lg:px-8 py-3.5 shadow-[0_4px_25px_rgba(217,27,130,0.06)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1b0816] to-[#2b0e22] flex items-center justify-center border border-[#D91B82]/50 shadow-[0_0_15px_rgba(217,27,130,0.3)] overflow-hidden shrink-0">
              <img
                src="/images/euphoria-mas-emblem.png"
                alt="Euphoria Mas Emblem"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold tracking-tight text-white uppercase">
                  Guyana Carnival 2027 Executive Committee Portal
                </h1>
                <Badge className="bg-[#D91B82]/20 text-[#FF5CA8] border-[#D91B82]/40 text-[10px] uppercase tracking-wider px-2 py-0.5">
                  Private Access
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Hub: <strong className="text-gray-300">NJ/NY Tri-State</strong></span>
                <span>•</span>
                <span>Venue: <strong className="text-gray-300">AC Hotel Marriott Ogle Pool</strong></span>
                <span>•</span>
                <span>Checkout: <strong className="text-[#E5A93C]">carnival-planner.com</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Main Committee Navigation Tabs */}
            <div className="bg-[#080C14] p-1 rounded-lg border border-[#1C2739] flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("generator")}
                className={`text-xs h-8 px-2.5 rounded-md transition-all ${
                  activeTab === "generator"
                    ? "bg-[#D91B82]/25 text-[#FF5CA8] border border-[#D91B82]/40 font-semibold shadow-[0_0_10px_rgba(217,27,130,0.2)]"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#FF5CA8]" />
                Auto-Site Studio
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("timeline")}
                className={`text-xs h-8 px-2.5 rounded-md relative transition-all ${
                  activeTab === "timeline"
                    ? "bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/40 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#E5A93C]" />
                Roadmap
                {hasUnsavedTimeline && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black animate-pulse">
                    Unsaved
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("media")}
                className={`text-xs h-8 px-2.5 rounded-md transition-all ${
                  activeTab === "media"
                    ? "bg-[#D91B82]/20 text-[#FF5CA8] border border-[#D91B82]/40 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-[#FF5CA8]" />
                Media Vault ({mediaAssets.length})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("roster")}
                className={`text-xs h-8 px-2.5 rounded-md transition-all ${
                  activeTab === "roster"
                    ? "bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/40 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#E5A93C]" />
                Directory ({committeeMembers.length})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("comments")}
                className={`text-xs h-8 px-2.5 rounded-md transition-all ${
                  activeTab === "comments"
                    ? "bg-blue-500/20 text-blue-300 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Activity ({committeeComments.length})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("records")}
                className={`text-xs h-8 px-2.5 rounded-md transition-all ${
                  activeTab === "records"
                    ? "bg-purple-500/20 text-purple-300 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-[#131B2A]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-300" />
                Records ({savedProposals.length})
              </Button>
            </div>

            {/* Active Member Identity Badge / Switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMemberIdentityModalOpen(true)}
              className={`text-xs h-8 px-2.5 border transition-all ${
                activeMember
                  ? "border-[#D91B82]/50 bg-[#D91B82]/15 text-white hover:bg-[#D91B82]/25 shadow-[0_0_10px_rgba(217,27,130,0.15)]"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Click to view or switch active committee identity"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-[#E5A93C]" />
              <span className="truncate max-w-[130px]">
                {activeMember ? `${activeMember.name} • ${activeMember.hub.split(" ")[0]}` : "Set Identity"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDataModalOpen(true)}
              className="border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-300 text-xs h-8 px-2"
              title="Reset Demo Data for Live Input"
            >
              <RotateCcw className="w-3 h-3 mr-1 text-red-400" />
              Clean Slate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
              className="border-[#223147] bg-[#0E1522] hover:bg-[#141D2E] text-gray-200 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#00D2B4]" />
              New Proposal
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLockPortal}
              className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 text-xs h-8"
              title="Lock Committee Portal"
            >
              <Lock className="w-3.5 h-3.5 mr-1" />
              Lock
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {activeTab === "timeline" ? (
          /* ------------------------------------------------------------- */
          /* VISUAL MASTER ROADMAP & TIMELINE (INTERACTIVE & EDITABLE)     */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            {/* Top Toolbar & Summary Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0E17] border border-[#1A2639] p-4 lg:p-5 rounded-xl shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#0B4F37] text-[#00D2B4] border-0 text-[10px] font-mono uppercase tracking-wider">
                    Executive Master Roadmap
                  </Badge>
                  {hasUnsavedTimeline && (
                    <Badge className="bg-amber-500 text-black text-[10px] font-bold animate-pulse">
                      Pending Cloud Sync
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#E5A93C]" />
                  Guyana Carnival 2027 Master Timeline & Roadmap
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                  Strategic roadmap from 2026 concept & apparel sampling, through 2027 diaspora buildup in NJ/NY,
                  airport arrivals, and execution of Carnival Week May 19–26, 2027 at the AC Hotel Marriott Ogle Pool.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {hasUnsavedTimeline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetTimelineToDefault}
                    className="border-[#2C3B52] bg-[#0E1522] text-xs text-gray-300 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    Reset
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleOpenAddMilestone}
                  className="bg-[#122030] hover:bg-[#1A2B42] text-white border border-[#24354C] text-xs h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-[#00D2B4]" />
                  Add Milestone
                </Button>

                <Button
                  size="sm"
                  onClick={() => saveTimelineMutation.mutate(milestones)}
                  disabled={saveTimelineMutation.isPending}
                  className={`text-xs h-9 font-semibold text-white transition-all shadow-md ${
                    hasUnsavedTimeline
                      ? "bg-gradient-to-r from-[#0B4F37] via-[#008F6B] to-[#E5A93C] animate-pulse"
                      : "bg-[#0B4F37] hover:bg-[#0F6546]"
                  }`}
                >
                  {saveTimelineMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {hasUnsavedTimeline ? "Save Timeline to Cloud *" : "Timeline Saved"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Infographic KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Countdown */}
              <Card className="bg-[#0D121C] border-[#182334] p-4 relative overflow-hidden">
                <div className="absolute right-2 top-2 opacity-10">
                  <Clock className="w-20 h-20 text-[#00D2B4]" />
                </div>
                <div className="text-[11px] font-semibold text-[#00D2B4] uppercase tracking-wider mb-1">
                  Countdown to Oasis Pool Party
                </div>
                <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {daysUntilPoolParty} <span className="text-sm font-normal text-gray-400">Days</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#E5A93C]" />
                  <span>Friday, May 21, 2027 • Ogle, Guyana</span>
                </div>
              </Card>

              {/* Stat 2: Progress Tracker */}
              <Card className="bg-[#0D121C] border-[#182334] p-4 relative overflow-hidden">
                <div className="text-[11px] font-semibold text-[#E5A93C] uppercase tracking-wider mb-1">
                  Executive Progress
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{completionPercentage}%</span>
                  <span className="text-xs text-gray-400">({completedMilestonesCount}/{totalMilestonesCount} complete)</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-[#1A2332] h-2 rounded-full overflow-hidden mt-3 flex">
                  <div
                    style={{ width: `${(completedMilestonesCount / (totalMilestonesCount || 1)) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Completed: ${completedMilestonesCount}`}
                  />
                  <div
                    style={{ width: `${(inProgressMilestonesCount / (totalMilestonesCount || 1)) * 100}%` }}
                    className="bg-amber-400 h-full transition-all"
                    title={`In Progress: ${inProgressMilestonesCount}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                  <span className="text-emerald-400">● {completedMilestonesCount} Done</span>
                  <span className="text-amber-400">● {inProgressMilestonesCount} Active</span>
                  <span className="text-gray-400">● {plannedMilestonesCount} Planned</span>
                </div>
              </Card>

              {/* Stat 3: Confirmed Venue */}
              <Card className="bg-[#0D121C] border-[#182334] p-4">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Confirmed Primary Venue
                </div>
                <div className="text-sm font-bold text-white line-clamp-1">
                  AC Hotel by Marriott
                </div>
                <div className="text-xs text-[#00D2B4] font-medium mt-0.5">
                  Outdoor Pool & Event Deck (Ogle)
                </div>
                <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Venue Paid & Locked • 2 mins to OGL</span>
                </div>
              </Card>

              {/* Stat 4: Ticketing Engine */}
              <Card className="bg-[#0D121C] border-[#182334] p-4">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Masquerader & Ticket Engine
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>carnival-planner.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#00D2B4]" />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Direct Checkout & Registration
                </div>
                <div className="text-[11px] text-[#E5A93C] mt-2 font-medium">
                  Early Bird $45 • Cabanas $1,250
                </div>
              </Card>
            </div>

            {/* Filter & View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080B12] p-3 rounded-lg border border-[#162132]">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#00D2B4]" /> Hub:
                </span>
                {[
                  { id: "all", label: "All Hubs" },
                  { id: "NJ/NY Committee", label: "NJ / NY" },
                  { id: "Guyana Operations", label: "Guyana Ops" },
                  { id: "UK Logistics", label: "UK Logistics" },
                  { id: "All Committee", label: "All Board" },
                ].map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => setSelectedHubFilter(hub.id)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      selectedHubFilter === hub.id
                        ? "bg-[#0B4F37] text-white font-medium shadow"
                        : "text-gray-400 hover:text-white bg-[#0E1522] border border-[#1B273A]"
                    }`}
                  >
                    {hub.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-gray-400 font-medium">Status:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "planned", label: "Planned" },
                  { id: "in_progress", label: "In Progress" },
                  { id: "completed", label: "Completed" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      selectedStatusFilter === st.id
                        ? "bg-[#E5A93C] text-black font-semibold shadow"
                        : "text-gray-400 hover:text-white bg-[#0E1522] border border-[#1B273A]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Instruction Banner */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#00D2B4]/5 border border-[#00D2B4]/20 text-xs text-gray-300">
              <Sparkles className="w-4 h-4 text-[#00D2B4] shrink-0" />
              <span>
                <strong>Committee Live Interaction:</strong> Click the status pill on any milestone card to cycle between <em>Planned → In Progress → Completed</em>. Toggle action checklist items to mark deliverables done. Click <strong>"Save Timeline to Cloud"</strong> when done to sync with all hubs.
              </span>
            </div>

            {/* Roadmap Phases & Cards */}
            {isLoadingTimeline ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00D2B4] mx-auto mb-3" />
                <p className="text-xs text-gray-400">Loading master committee roadmap...</p>
              </div>
            ) : filteredMilestones.length === 0 ? (
              <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-200">No Milestones Match Filter</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                  Adjust your hub or status filters, or add a new milestone to this phase.
                </p>
                <Button
                  onClick={() => {
                    setSelectedHubFilter("all");
                    setSelectedStatusFilter("all");
                  }}
                  className="bg-[#0B4F37] text-white text-xs"
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {distinctPhases.map((phase) => {
                  const phaseMilestones = filteredMilestones.filter((m) => m.phase === phase);
                  const phaseCompleted = phaseMilestones.filter((m) => m.status === "completed").length;

                  return (
                    <div key={phase} className="space-y-3">
                      {/* Phase Header */}
                      <div className="flex items-center justify-between border-b border-[#1A273C] pb-2">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-[#E5A93C]" />
                          <h3 className="text-sm md:text-base font-bold text-white tracking-wide">
                            {phase}
                          </h3>
                        </div>
                        <Badge variant="outline" className="text-[11px] border-[#25364E] text-gray-300">
                          {phaseCompleted}/{phaseMilestones.length} Done
                        </Badge>
                      </div>

                      {/* Milestone Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phaseMilestones.map((m) => {
                          const getHubBadge = (hub: string) => {
                            switch (hub) {
                              case "NJ/NY Committee":
                                return "bg-purple-950/60 text-purple-300 border-purple-500/30";
                              case "Guyana Operations":
                                return "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
                              case "UK Logistics":
                                return "bg-sky-950/60 text-sky-300 border-sky-500/30";
                              default:
                                return "bg-amber-950/60 text-amber-300 border-amber-500/30";
                            }
                          };

                          return (
                            <Card
                              key={m.id}
                              className={`transition-all duration-200 flex flex-col justify-between ${
                                m.status === "completed"
                                  ? "bg-[#0A1412]/95 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                                  : m.status === "in_progress"
                                  ? "bg-[#14120B]/95 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]"
                                  : "bg-[#0D121B]/95 border-[#1A2638] hover:border-[#263750]"
                              }`}
                            >
                              <CardHeader className="pb-3">
                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge className={`text-[10px] font-mono border ${getHubBadge(m.hub)}`}>
                                      {m.hub}
                                    </Badge>
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                                      <Clock className="w-3 h-3 text-[#00D2B4]" />
                                      {m.date}
                                    </span>
                                  </div>

                                  {/* 1-Click Status Cycling Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleCycleMilestoneStatus(m.id)}
                                    title="Click to cycle status (Planned -> In Progress -> Completed)"
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                                      m.status === "completed"
                                        ? "bg-emerald-950 text-emerald-300 border-emerald-600 hover:bg-emerald-900"
                                        : m.status === "in_progress"
                                        ? "bg-amber-950 text-amber-300 border-amber-600 hover:bg-amber-900"
                                        : "bg-[#162030] text-gray-300 border-[#283850] hover:bg-[#202E42]"
                                    }`}
                                  >
                                    {m.status === "completed" ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        Completed
                                      </>
                                    ) : m.status === "in_progress" ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                                        In Progress
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        Planned
                                      </>
                                    )}
                                  </button>
                                </div>

                                <CardTitle className="text-sm md:text-base font-bold text-white leading-snug">
                                  {m.title}
                                </CardTitle>

                                {m.venue && (
                                  <CardDescription className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                                    <MapPin className="w-3 h-3 text-[#E5A93C] shrink-0" />
                                    <span className="truncate">{m.venue}</span>
                                  </CardDescription>
                                )}
                              </CardHeader>

                              <CardContent className="space-y-3 pb-3 text-xs">
                                <p className="text-gray-300 leading-relaxed">
                                  {m.description}
                                </p>

                                {/* Action Checklist Items */}
                                {m.checklist && m.checklist.length > 0 && (
                                  <div className="bg-[#070A10] p-2.5 rounded-lg border border-[#162130] space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                                      <span className="flex items-center gap-1">
                                        <ListChecks className="w-3 h-3 text-[#00D2B4]" /> Checklist
                                      </span>
                                      <span>
                                        {m.checklist.filter((c) => c.startsWith("[x] ")).length}/{m.checklist.length} Done
                                      </span>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                      {m.checklist.map((item, idx) => {
                                        const isChecked = item.startsWith("[x] ");
                                        const cleanText = isChecked ? item.replace("[x] ", "") : item;

                                        return (
                                          <div
                                            key={idx}
                                            onClick={() => handleToggleChecklistItem(m.id, idx)}
                                            className="flex items-start gap-2 cursor-pointer group hover:bg-[#0E1522] p-1 rounded transition-colors"
                                          >
                                            {isChecked ? (
                                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                            ) : (
                                              <Square className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 mt-0.5 shrink-0" />
                                            )}
                                            <span
                                              className={`text-[11px] leading-tight ${
                                                isChecked ? "line-through text-gray-500" : "text-gray-300"
                                              }`}
                                            >
                                              {cleanText}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </CardContent>

                              {/* Card Footer Actions */}
                              <CardFooter className="pt-2 border-t border-[#182334] flex items-center justify-between">
                                <div className="text-[10px] text-gray-400">
                                  ID: <span className="font-mono text-gray-300">{m.id}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setExpandedDiscussionMilestoneId(
                                        expandedDiscussionMilestoneId === m.id ? null : m.id
                                      )
                                    }
                                    className={`h-7 px-2 text-[11px] transition-colors ${
                                      expandedDiscussionMilestoneId === m.id
                                        ? "bg-[#00D2B4]/20 text-[#00D2B4]"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                                    title="View milestone feedback & comments"
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {
                                      committeeComments.filter(
                                        (c) =>
                                          c.targetTitle === m.title ||
                                          (c.targetType === "milestone" && c.targetTitle.includes(m.title.slice(0, 15)))
                                      ).length
                                    }
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenEditMilestone(m)}
                                    className="border-[#223147] bg-[#0A0E17] hover:bg-[#141E30] text-[11px] text-gray-200 h-7 px-2"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1 text-[#00D2B4]" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteMilestone(m.id)}
                                    className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 h-7 px-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardFooter>

                              {/* Inline Milestone Comments Section */}
                              {expandedDiscussionMilestoneId === m.id && (
                                <div className="p-3 bg-[#080B12] border-t border-[#182334] text-xs space-y-2.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                                    <span className="flex items-center gap-1.5 text-[#00D2B4]">
                                      <MessageSquare className="w-3 h-3" />
                                      Committee Notes on this Milestone
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {activeMember ? activeMember.name : "NJ/NY Committee"}
                                    </span>
                                  </div>

                                  {/* Milestone Comments Feed */}
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {committeeComments
                                      .filter(
                                        (c) =>
                                          c.targetTitle === m.title ||
                                          (c.targetType === "milestone" && c.targetTitle.includes(m.title.slice(0, 15)))
                                      ).length === 0 ? (
                                      <div className="text-[10px] text-gray-400 py-1 italic">
                                        No notes logged yet for this milestone.
                                      </div>
                                    ) : (
                                      committeeComments
                                        .filter(
                                          (c) =>
                                            c.targetTitle === m.title ||
                                            (c.targetType === "milestone" &&
                                              c.targetTitle.includes(m.title.slice(0, 15)))
                                        )
                                        .map((c) => (
                                          <div
                                            key={c.id}
                                            className="p-2 rounded bg-[#0D121B] border border-[#1B273A] text-[11px] space-y-0.5"
                                          >
                                            <div className="flex items-center justify-between text-[10px]">
                                              <span className="font-semibold text-white">
                                                {c.author} ({c.authorHub.replace("Committee", "").trim()})
                                              </span>
                                              <span className="text-gray-400">
                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active"}
                                              </span>
                                            </div>
                                            <p className="text-gray-300">{c.text}</p>
                                          </div>
                                        ))
                                    )}
                                  </div>

                                  {/* Quick Comment Input */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <Input
                                      placeholder="Leave note on this milestone..."
                                      className="bg-[#05070C] border-[#182334] text-white text-[11px] h-7"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.target as any).value.trim()) {
                                          postCommentMutation.mutate({
                                            author: activeMember ? activeMember.name : "Committee Member",
                                            authorHub: activeMember ? activeMember.hub : "NJ/NY Committee",
                                            authorRole: activeMember ? activeMember.role : "Member",
                                            text: (e.target as any).value.trim(),
                                            targetType: "milestone",
                                            targetTitle: m.title,
                                          });
                                          (e.target as any).value = "";
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      className="bg-[#0B4F37] hover:bg-[#0E6346] text-white text-[10px] h-7 px-2"
                                      onClick={(e) => {
                                        const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (inputEl && inputEl.value.trim()) {
                                          postCommentMutation.mutate({
                                            author: activeMember ? activeMember.name : "Committee Member",
                                            authorHub: activeMember ? activeMember.hub : "NJ/NY Committee",
                                            authorRole: activeMember ? activeMember.role : "Member",
                                            text: inputEl.value.trim(),
                                            targetType: "milestone",
                                            targetTitle: m.title,
                                          });
                                          inputEl.value = "";
                                        }
                                      }}
                                    >
                                      Send
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "records" ? (
          /* ------------------------------------------------------------- */
          /* SAVED COMMITTEE RECORDS VIEW (CRUD)                           */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#E5A93C]" />
                  Saved Committee Proposals & Site Builds
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Manage concepts, status reviews, and auto-generated microsites created by the committee.
                </p>
              </div>

              <Button
                onClick={() => setActiveTab("generator")}
                className="bg-[#0B4F37] hover:bg-[#0E6346] text-white text-xs"
              >
                Back to Generator Studio
              </Button>
            </div>

            {isLoadingProposals ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00D2B4] mx-auto mb-3" />
                <p className="text-xs text-gray-400">Loading committee database records...</p>
              </div>
            ) : savedProposals.length === 0 ? (
              <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-200">No Saved Proposals Yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-6">
                  Use the Auto-Site Generator to input event details or merchandise specs, then hit "Save to Committee Records".
                </p>
                <Button
                  onClick={() => setActiveTab("generator")}
                  className="bg-gradient-to-r from-[#0B4F37] to-[#E5A93C] text-white text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Create First Proposal
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedProposals.map((prop) => (
                  <Card key={prop.id || prop.title} className="bg-[#0D121B] border-[#1C2638] hover:border-[#00D2B4]/40 transition-colors flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge className="bg-[#0B4F37]/80 text-[#00D2B4] border-0 text-[10px] uppercase font-mono">
                          {prop.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${
                            prop.status === "approved"
                              ? "border-green-500 text-green-400 bg-green-950/20"
                              : "border-yellow-500 text-yellow-400 bg-yellow-950/20"
                          }`}
                        >
                          {prop.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-white font-bold line-clamp-2">
                        {prop.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-400">
                        {prop.venue || "AC Hotel by Marriott Ogle Pool"} • {prop.targetDate || "May 2027"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3 text-xs text-gray-400 space-y-2">
                      <div className="flex justify-between border-t border-[#182334] pt-2">
                        <span>Submitted By:</span>
                        <span className="text-gray-200 font-medium">{prop.author || "Committee"}</span>
                      </div>
                      {prop.generatedOutput?.financialModel && (
                        <div className="flex justify-between">
                          <span>Est. Revenue:</span>
                          <span className="text-[#E5A93C] font-semibold">
                            ${prop.generatedOutput.financialModel.projectedGrossRevenue?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-3 border-t border-[#182334] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadProposal(prop)}
                          className="border-[#223147] bg-[#0A0E17] hover:bg-[#141E30] text-xs text-gray-200 h-8 px-2.5"
                        >
                          <Edit3 className="w-3 h-3 mr-1 text-[#00D2B4]" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProposalForModal(prop)}
                          className="border-[#223147] bg-[#0A0E17] hover:bg-[#141E30] text-xs text-gray-200 h-8 px-2.5"
                        >
                          <Eye className="w-3 h-3 mr-1 text-[#E5A93C]" />
                          Preview
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProposalToDelete(prop)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 h-8 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "media" ? (
          /* ------------------------------------------------------------- */
          /* VISUAL MEDIA & EVENT ASSET VAULT                              */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0E17] border border-[#1A2639] p-4 lg:p-5 rounded-xl shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#0B4F37] text-[#00D2B4] border-0 text-[10px] font-mono uppercase tracking-wider">
                    Executive Asset Vault
                  </Badge>
                  <span className="text-[11px] text-gray-400">
                    {mediaAssets.length} Visual Assets Stored
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#00D2B4]" />
                  Executive Visual Media & Event Asset Vault
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                  Upload and review promotional flyers, 3D pool deck stage plots, merchandise mockups, and venue layouts.
                  Assets can be previewed in high resolution and attached directly to live microsite proposals.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsUploadMediaModalOpen(true)}
                  className="bg-gradient-to-r from-[#0B4F37] via-[#008F6B] to-[#E5A93C] text-white text-xs h-9 font-semibold shadow-md"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Upload Visual Asset
                </Button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: `All Assets (${mediaAssets.length})` },
                { id: "flyer", label: `Flyers & Posters (${mediaAssets.filter((m) => m.category === "flyer").length})` },
                { id: "stage_plot", label: `Venue & Stage Plots (${mediaAssets.filter((m) => m.category === "stage_plot").length})` },
                { id: "apparel", label: `Apparel & Merch (${mediaAssets.filter((m) => m.category === "apparel").length})` },
                { id: "moodboard", label: `Moodboards (${mediaAssets.filter((m) => m.category === "moodboard").length})` },
                { id: "photo", label: `Event Photos (${mediaAssets.filter((m) => m.category === "photo").length})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedMediaCategory(pill.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
                    selectedMediaCategory === pill.id
                      ? "border-[#00D2B4] bg-[#00D2B4]/20 text-[#00D2B4] font-semibold"
                      : "border-[#1B273A] bg-[#0A0E17] text-gray-400 hover:text-white hover:border-[#2C3E5B]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Assets Grid */}
            {isLoadingMedia ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00D2B4] mx-auto mb-3" />
                <p className="text-xs text-gray-400">Loading visual asset vault...</p>
              </div>
            ) : mediaAssets.filter((m) => selectedMediaCategory === "all" || m.category === selectedMediaCategory).length === 0 ? (
              <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-200">No Visual Assets In This View</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-6">
                  Upload event flyers, pool venue diagrams, or apparel mockups for the committee to review and attach to deliverables.
                </p>
                <Button
                  onClick={() => setIsUploadMediaModalOpen(true)}
                  className="bg-gradient-to-r from-[#0B4F37] to-[#E5A93C] text-white text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Upload First Asset
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaAssets
                  .filter((m) => selectedMediaCategory === "all" || m.category === selectedMediaCategory)
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="bg-[#0D121B] border-[#1C2638] hover:border-[#00D2B4]/50 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                    >
                      {/* Image Thumbnail with Lightbox click */}
                      <div
                        onClick={() => setSelectedImageForLightbox(item)}
                        className="relative h-44 w-full bg-[#06080E] cursor-pointer overflow-hidden border-b border-[#182334]"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as any).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-2 rounded-full bg-black/70 text-white border border-white/20">
                            <ZoomIn className="w-4 h-4 text-[#00D2B4]" />
                          </span>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-black/70 text-[#00D2B4] border border-[#00D2B4]/30 text-[10px] uppercase backdrop-blur-sm">
                          {item.category.replace("_", " ")}
                        </Badge>
                      </div>

                      <CardHeader className="p-3.5 pb-2">
                        <CardTitle className="text-sm font-bold text-white line-clamp-1">
                          {item.title}
                        </CardTitle>
                        {item.description && (
                          <CardDescription className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                            {item.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                          <span>{item.targetEvent || "Oasis Pool Party"}</span>
                          <span>{item.uploadedBy || "Committee"}</span>
                        </div>
                      </CardHeader>

                      <CardFooter className="p-3 pt-2 border-t border-[#182334] flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, coverImageUrl: item.url }));
                            setActiveTab("generator");
                            toast({
                              title: "Asset Attached",
                              description: `Set "${item.title}" as active proposal cover image.`,
                            });
                          }}
                          className="border-[#213045] bg-[#090D15] hover:bg-[#121B2A] text-[11px] h-7 px-2 text-[#00D2B4]"
                        >
                          Use in Proposal
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(item.url, `media-${item.id}`)}
                            className="h-7 px-2 text-gray-400 hover:text-white"
                            title="Copy Direct Link"
                          >
                            {copiedKey === `media-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMediaMutation.mutate(item.id)}
                            className="h-7 px-2 text-gray-400 hover:text-red-400"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        ) : activeTab === "roster" ? (
          /* ------------------------------------------------------------- */
          /* COMMITTEE DIRECTORY & MEMBER ROSTER                           */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            {/* Active Session Identity Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#D91B82]/15 via-[#0A0E17] to-[#E5A93C]/15 border border-[#D91B82]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(217,27,130,0.08)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1b0816] to-[#2b0e22] border border-[#D91B82]/50 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(217,27,130,0.25)] shrink-0">
                  <img
                    src="/images/euphoria-mas-emblem.png"
                    alt="Euphoria Mas"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Current Portal Operator:</span>
                    <Badge className="bg-[#D91B82]/20 text-[#FF5CA8] border border-[#D91B82]/40 text-[10px]">
                      {activeMember ? activeMember.hub : "NJ/NY Committee"}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {activeMember ? activeMember.name : "Not Identified (Operating as Guest)"}
                    {activeMember?.role && (
                      <span className="text-xs font-normal text-[#E5A93C] ml-2">
                        • {activeMember.role}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    All proposals generated, comments posted, and roadmap changes will be signed with this identity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsMemberIdentityModalOpen(true)}
                  className="bg-[#121B2A] hover:bg-[#1A263B] text-white border border-[#24354D] text-xs h-9"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[#E5A93C]" />
                  Switch Active Identity
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMemberId(null);
                    setMemberFormData({
                      name: "",
                      role: "Operations Lead",
                      hub: "NJ/NY Committee",
                      whatsapp: "",
                      email: "",
                      phone: "",
                      bio: "",
                      status: "active",
                    });
                    setIsAddMemberModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-[#D91B82] via-[#A81566] to-[#E5A93C] text-white text-xs h-9 font-semibold shadow-md shadow-[#D91B82]/20 hover:opacity-95 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Register Member
                </Button>
              </div>
            </div>

            {/* Hub Filters & Summary */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#E5A93C]" />
                  Executive Committee Directory ({committeeMembers.length})
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Leadership, hub coordinators, and operational leads driving Guyana Carnival 2027.
                </p>
              </div>
            </div>

            {/* Member Cards Grid */}
            {isLoadingMembers ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#D91B82] mx-auto mb-3" />
                <p className="text-xs text-gray-400">Loading committee roster...</p>
              </div>
            ) : committeeMembers.length === 0 ? (
              <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-200">No Committee Members Registered</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-6">
                  Add committee members to assign roles, track feedback, and streamline inter-hub coordination.
                </p>
                <Button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="bg-gradient-to-r from-[#D91B82] to-[#E5A93C] text-white text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add First Member
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committeeMembers.map((member) => {
                  const isCurrentActive = activeMember?.name.toLowerCase() === member.name.toLowerCase();
                  return (
                    <Card
                      key={member.id}
                      className={`bg-[#0D121B] border transition-all flex flex-col justify-between ${
                        isCurrentActive
                          ? "border-[#D91B82] shadow-[0_0_20px_rgba(217,27,130,0.2)]"
                          : "border-[#1C2638] hover:border-[#D91B82]/40"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#160B14] to-[#250F22] border border-[#D91B82]/40 flex items-center justify-center font-bold text-white text-sm overflow-hidden relative shadow-[0_0_10px_rgba(217,27,130,0.15)] shrink-0">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center relative">
                                  <img src="/images/euphoria-mas-emblem.png" alt="" className="w-7 h-7 object-contain opacity-80" />
                                  <span className="absolute bottom-0.5 right-1 text-[8px] font-black text-[#E5A93C] font-mono leading-none">
                                    {member.name.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                                {member.name}
                                {isCurrentActive && (
                                  <Badge className="bg-[#D91B82]/20 text-[#FF5CA8] border-[#D91B82]/40 text-[9px] px-1.5 py-0">
                                    You
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs text-[#E5A93C] font-medium">
                                {member.role}
                              </CardDescription>
                            </div>
                          </div>

                          <Badge
                            className={`text-[10px] uppercase font-mono border-0 ${
                              member.hub.includes("NJ/NY")
                                ? "bg-emerald-950/60 text-emerald-400"
                                : member.hub.includes("Guyana")
                                ? "bg-amber-950/60 text-amber-400"
                                : "bg-blue-950/60 text-blue-400"
                            }`}
                          >
                            {member.hub.replace("Committee", "").replace("Operations", "").trim()}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pb-3 text-xs">
                        {member.bio && (
                          <p className="text-gray-400 text-[11px] leading-relaxed">
                            {member.bio}
                          </p>
                        )}

                        <div className="pt-2 border-t border-[#182334] text-[11px]">
                          {member.whatsapp || member.phone ? (
                            <a
                              href={`https://wa.me/${(member.whatsapp || member.phone || "").replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all font-medium text-xs w-full group shadow-sm"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]/20 text-[#25D366] group-hover:scale-110 transition-transform" />
                              <span className="truncate">WhatsApp: {member.whatsapp || member.phone}</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMemberId(member.id);
                                setMemberFormData({
                                  ...member,
                                  whatsapp: member.whatsapp || member.phone || "",
                                });
                                setIsAddMemberModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#24354D] text-gray-400 hover:text-white hover:border-[#D91B82]/60 text-xs w-full transition-colors bg-[#080B11]/50"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>+ Add WhatsApp Number</span>
                            </button>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2 border-t border-[#182334] flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveActiveMemberIdentity(member.name, member.hub, member.role)}
                          disabled={isCurrentActive}
                          className={`text-xs h-7 px-2.5 ${
                            isCurrentActive
                              ? "border-[#D91B82]/50 bg-[#D91B82]/15 text-[#FF5CA8]"
                              : "border-[#223147] bg-[#0A0E17] hover:bg-[#131C2B] text-gray-300"
                          }`}
                        >
                          {isCurrentActive ? "Active Session" : "Operate as this Member"}
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setMemberFormData({ ...member });
                              setIsAddMemberModalOpen(true);
                            }}
                            className="h-7 px-2 text-gray-400 hover:text-white"
                            title="Edit Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMemberMutation.mutate(member.id)}
                            className="h-7 px-2 text-gray-400 hover:text-red-400"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "comments" ? (
          /* ------------------------------------------------------------- */
          /* COMMITTEE ACTIVITY & FEEDBACK STREAM                          */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0E17] border border-[#1A2639] p-4 lg:p-5 rounded-xl shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#0B4F37] text-[#00D2B4] border-0 text-[10px] font-mono uppercase tracking-wider">
                    Executive Audit Trail
                  </Badge>
                  <span className="text-[11px] text-gray-400">
                    {committeeComments.length} Total Feedback Records
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Committee Activity & Feedback Stream
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                  Centralized log of feedback, operational questions, venue approvals, and milestone updates.
                  Every note captures author name, hub affiliation, and timestamp.
                </p>
              </div>
            </div>

            {/* Post New Comment Box */}
            <Card className="bg-[#0C1018] border-[#1C2638] text-white shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-[#00D2B4]" />
                    Post Operational Note or Feedback
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Posting as: <strong className="text-[#00D2B4]">{activeMember ? activeMember.name : "NJ/NY Committee"}</strong>
                    {activeMember && <span className="text-gray-400"> ({activeMember.hub})</span>}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400">Target Type</label>
                    <select
                      value={commentTargetType}
                      onChange={(e) => setCommentTargetType(e.target.value as any)}
                      className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-1.5 text-white text-xs"
                    >
                      <option value="general">General Committee Discussion</option>
                      <option value="proposal">Specific Proposal / Event Build</option>
                      <option value="milestone">Roadmap Milestone / Logistics</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400">Topic / Target Reference</label>
                    <Input
                      value={commentTargetTitle}
                      onChange={(e) => setCommentTargetTitle(e.target.value)}
                      placeholder="e.g. AC Marriott Pool Deck Sound Setup or Oasis Tickets"
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs h-8"
                    />
                  </div>
                </div>

                <Textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type your question, suggestion, or approval note for the committee..."
                  rows={3}
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">
                    Notes are visible to all verified committee members with the access key.
                  </span>
                  <Button
                    size="sm"
                    disabled={postCommentMutation.isPending || !newCommentText.trim()}
                    onClick={() =>
                      postCommentMutation.mutate({
                        author: activeMember ? activeMember.name : "Committee Member",
                        authorHub: activeMember ? activeMember.hub : "NJ/NY Committee",
                        authorRole: activeMember ? activeMember.role : "Member",
                        text: newCommentText.trim(),
                        targetType: commentTargetType,
                        targetTitle: commentTargetTitle.trim() || (commentTargetType === "general" ? "General Committee Note" : "Event Discussion"),
                      })
                    }
                    className="bg-gradient-to-r from-[#0B4F37] to-[#008F6B] text-white text-xs h-8 px-4"
                  >
                    {postCommentMutation.isPending ? "Posting..." : "Post Note"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A0E17] p-3 rounded-xl border border-[#1A2639]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  value={commentSearchTerm}
                  onChange={(e) => setCommentSearchTerm(e.target.value)}
                  placeholder="Search comments or author..."
                  className="bg-[#07090F] border-[#1C2739] text-white text-xs h-8 w-full sm:w-60"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={commentFilterHub}
                  onChange={(e) => setCommentFilterHub(e.target.value)}
                  className="bg-[#07090F] border border-[#1C2739] rounded-md px-2.5 py-1 text-xs text-gray-300 h-8"
                >
                  <option value="all">All Hubs</option>
                  <option value="NJ/NY">NJ/NY Committee</option>
                  <option value="Guyana">Guyana Operations</option>
                  <option value="UK">UK Logistics</option>
                </select>

                <select
                  value={commentFilterTarget}
                  onChange={(e) => setCommentFilterTarget(e.target.value)}
                  className="bg-[#07090F] border border-[#1C2739] rounded-md px-2.5 py-1 text-xs text-gray-300 h-8"
                >
                  <option value="all">All Targets</option>
                  <option value="general">General Notes</option>
                  <option value="proposal">Proposals</option>
                  <option value="milestone">Milestones</option>
                </select>
              </div>
            </div>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
                <p className="text-xs text-gray-400">Loading activity feed...</p>
              </div>
            ) : committeeComments.length === 0 ? (
              <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-200">No Committee Comments Yet</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                  All demo data has been cleared. Use the input box above to post your first operational note or question.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {committeeComments
                  .filter((c) => {
                    const hubMatches = commentFilterHub === "all" || c.authorHub.includes(commentFilterHub);
                    const targetMatches = commentFilterTarget === "all" || c.targetType === commentFilterTarget;
                    const searchMatches =
                      !commentSearchTerm.trim() ||
                      c.text.toLowerCase().includes(commentSearchTerm.toLowerCase()) ||
                      c.author.toLowerCase().includes(commentSearchTerm.toLowerCase()) ||
                      (c.targetTitle && c.targetTitle.toLowerCase().includes(commentSearchTerm.toLowerCase()));
                    return hubMatches && targetMatches && searchMatches;
                  })
                  .map((comment) => (
                    <Card key={comment.id} className="bg-[#0D121B] border-[#1C2638] text-white">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#121A28] to-[#1E2C42] border border-[#23354E] flex items-center justify-center font-bold text-white text-xs">
                              {comment.author.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{comment.author}</span>
                                <Badge
                                  className={`text-[9px] uppercase font-mono border-0 ${
                                    comment.authorHub.includes("NJ/NY")
                                      ? "bg-emerald-950/60 text-emerald-400"
                                      : comment.authorHub.includes("Guyana")
                                      ? "bg-amber-950/60 text-amber-400"
                                      : "bg-blue-950/60 text-blue-400"
                                  }`}
                                >
                                  {comment.authorHub.replace("Committee", "").replace("Operations", "").trim()}
                                </Badge>
                                {comment.authorRole && (
                                  <span className="text-[10px] text-gray-400">({comment.authorRole})</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Recently"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {comment.targetTitle && (
                              <Badge variant="outline" className="border-[#23354E] text-gray-300 text-[10px]">
                                {comment.targetTitle}
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-200 leading-relaxed pl-10 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* GENERATOR STUDIO & LIVE OUTPUT WORKSPACE                      */
          /* ------------------------------------------------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Intake Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-[#0C1018] border-[#192436] shadow-xl text-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00D2B4] animate-pulse" />
                      <span className="text-[11px] font-semibold text-[#00D2B4] uppercase tracking-wider">
                        Auto-Site & Strategy Intake
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleLoadExampleTemplate}
                        className="text-[11px] text-[#00D2B4] hover:bg-[#00D2B4]/10 h-6 px-2"
                        title="Fill sample parameters"
                      >
                        Sample Template
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleCreateNew}
                        className="text-[11px] text-gray-400 hover:text-white h-6 px-2"
                        title="Clear all fields"
                      >
                        Clear
                      </Button>
                      {currentEditingId && (
                        <Badge variant="outline" className="text-[10px] border-[#E5A93C] text-[#E5A93C]">
                          #{currentEditingId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white">Committee Form</CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Input live concepts, dates, or vendor logistics. Generates live sites & deliverables instantly.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {/* Proposal Category */}
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Category / Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "event", label: "Pool / Fete Concept" },
                        { id: "merch", label: "Merch / Jersey Drop" },
                        { id: "campaign", label: "Promo Campaign" },
                        { id: "budget", label: "Vendor / Production" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            formData.category === cat.id
                              ? "border-[#00D2B4] bg-[#00D2B4]/10 text-white font-semibold"
                              : "border-[#1A2537] bg-[#080B11] text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Proposal / Event Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Oasis: The AC Marriott Welcome Pool Party"
                      className="bg-[#080B11] border-[#1C2739] text-white focus:border-[#00D2B4]"
                    />
                  </div>

                  {/* Submitting Hub */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-gray-300 font-medium">Submitting Committee</label>
                      <select
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs focus:border-[#00D2B4]"
                      >
                        <option value="NJ/NY Committee">NJ / NY Committee</option>
                        <option value="Guyana Host Operations">Guyana Host Operations</option>
                        <option value="UK Logistics Team">UK Logistics Team</option>
                        <option value="All Committee">Executive Board</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-300 font-medium">Timeline / Date</label>
                      <Input
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        placeholder="May 21, 2027 (Guyana Independence)"
                        className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Venue & Location */}
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Venue & Location</label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge"
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>

                  {/* Concept / Notes */}
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Concept & Vibe Brief</label>
                    <Textarea
                      rows={3}
                      value={formData.concept}
                      onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                      placeholder="Describe the daytime pool vibe, musical tempo, cabana hospitality, or teaser rollout..."
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>

                  {/* Talent / DJ Lineup */}
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Talent & DJ Lineup Wishlist</label>
                    <Input
                      value={formData.talentWishlist}
                      onChange={(e) => setFormData({ ...formData, talentWishlist: e.target.value })}
                      placeholder="DJ Private Ryan, Dr. Esan, DJ Kevin..."
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>

                  {/* Visual / Cover Image Attachment */}
                  <div className="p-3 rounded-lg bg-[#090D15] border border-[#172132] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#00D2B4]">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Cover / Visual Asset
                      </span>
                      <span className="text-gray-400 font-normal">Optional</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={formData.coverImageUrl}
                        onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                        placeholder="Image URL or pick from vault..."
                        className="bg-[#06090E] border-[#1A2537] text-white text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsUploadMediaModalOpen(true)}
                        className="border-[#213045] bg-[#0A0E17] hover:bg-[#121B2A] text-xs h-9 px-2 text-gray-300 shrink-0"
                        title="Upload file from device"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("media")}
                        className="border-[#213045] bg-[#0A0E17] hover:bg-[#121B2A] text-xs h-9 px-2 text-[#00D2B4] shrink-0"
                        title="Browse Media Vault"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {formData.coverImageUrl && (
                      <div className="relative mt-2 rounded-lg overflow-hidden border border-[#213047] h-28 w-full group">
                        <img
                          src={formData.coverImageUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as any).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, coverImageUrl: "" })}
                          className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded p-1 text-[10px]"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ticket Pricing & Capacity */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px]">Capacity</label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px]">Early Bird ($)</label>
                      <Input
                        type="number"
                        value={formData.earlyBirdPrice}
                        onChange={(e) => setFormData({ ...formData, earlyBirdPrice: Number(e.target.value) })}
                        className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px]">VIP Cabana ($)</label>
                      <Input
                        type="number"
                        value={formData.vipCabanaPrice}
                        onChange={(e) => setFormData({ ...formData, vipCabanaPrice: Number(e.target.value) })}
                        className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Merch Specs */}
                  <div className="p-3 rounded-lg bg-[#090D15] border border-[#172132] space-y-2">
                    <div className="text-[11px] font-semibold text-[#E5A93C] flex items-center justify-between">
                      <span>Apparel / Merch Integration</span>
                      <span className="text-gray-400 font-normal">Printify Ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={formData.merchTitle}
                        onChange={(e) => setFormData({ ...formData, merchTitle: e.target.value })}
                        placeholder="Merch Title"
                        className="bg-[#06090E] border-[#1A2537] text-white text-xs"
                      />
                      <Input
                        type="number"
                        value={formData.merchPrice}
                        onChange={(e) => setFormData({ ...formData, merchPrice: Number(e.target.value) })}
                        placeholder="Price ($)"
                        className="bg-[#06090E] border-[#1A2537] text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Production Budget */}
                  <div className="space-y-1">
                    <label className="text-gray-400 text-[10px]">Est. Production & Staging Cost ($)</label>
                    <Input
                      type="number"
                      value={formData.estimatedProductionCost}
                      onChange={(e) => setFormData({ ...formData, estimatedProductionCost: Number(e.target.value) })}
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={() => generateMutation.mutate(formData)}
                    disabled={generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#0B4F37] via-[#008F6B] to-[#E5A93C] text-white font-semibold h-10 shadow-lg shadow-[#0B4F37]/30"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Synthesizing Deliverables...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Live Site & Deliverables
                      </>
                    )}
                  </Button>

                  {activeOutput && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        saveProposalMutation.mutate({
                          title: formData.title,
                          category: formData.category,
                          author: formData.author,
                          status: "under_review",
                          venue: formData.venue,
                          targetDate: formData.targetDate,
                          inputData: formData,
                          generatedOutput: activeOutput,
                        })
                      }
                      disabled={saveProposalMutation.isPending}
                      className="w-full border-[#00D2B4]/40 bg-[#00D2B4]/10 hover:bg-[#00D2B4]/20 text-[#00D2B4] text-xs h-9"
                    >
                      {saveProposalMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Save to Committee Records
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* RIGHT COLUMN: Output Canvas & Live Microsite Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {activeOutput ? (
                <div className="space-y-4">
                  {/* Output Selector Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0C1018] p-2 rounded-xl border border-[#192436]">
                    <Tabs value={outputSubTab} onValueChange={setOutputSubTab} className="w-auto">
                      <TabsList className="bg-[#07090F] border border-[#192436] h-9">
                        <TabsTrigger value="microsite" className="text-xs data-[state=active]:bg-[#0B4F37] data-[state=active]:text-white">
                          <Layout className="w-3.5 h-3.5 mr-1.5" />
                          Live Microsite
                        </TabsTrigger>
                        <TabsTrigger value="runofshow" className="text-xs data-[state=active]:bg-[#0B4F37] data-[state=active]:text-white">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Run-of-Show
                        </TabsTrigger>
                        <TabsTrigger value="promokit" className="text-xs data-[state=active]:bg-[#0B4F37] data-[state=active]:text-white">
                          <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                          Promo Copy Kit
                        </TabsTrigger>
                        <TabsTrigger value="finance" className="text-xs data-[state=active]:bg-[#0B4F37] data-[state=active]:text-white">
                          <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                          Financial Model
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {outputSubTab === "microsite" && (
                      <div className="flex items-center gap-1 bg-[#07090F] p-1 rounded-lg border border-[#192436]">
                        <button
                          onClick={() => setPreviewDevice("desktop")}
                          className={`p-1.5 rounded text-xs ${previewDevice === "desktop" ? "bg-[#182334] text-[#00D2B4]" : "text-gray-400"}`}
                          title="Desktop View"
                        >
                          <Laptop className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPreviewDevice("mobile")}
                          className={`p-1.5 rounded text-xs ${previewDevice === "mobile" ? "bg-[#182334] text-[#00D2B4]" : "text-gray-400"}`}
                          title="Mobile View"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TAB CONTENT 1: LIVE MICROSITE */}
                  {outputSubTab === "microsite" && (
                    <div
                      className={`transition-all mx-auto duration-300 ${
                        previewDevice === "mobile" ? "max-w-[390px] border-4 border-[#1E293B] rounded-3xl overflow-hidden shadow-2xl" : "w-full"
                      }`}
                    >
                      <Card className="bg-[#090D14] border-[#1E293B] overflow-hidden text-white shadow-2xl">
                        {/* Browser simulated top chrome */}
                        <div className="bg-[#0E1522] px-4 py-2 border-b border-[#1A2538] flex items-center justify-between text-[11px] text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            <span className="ml-2 font-mono text-[10px] text-gray-400">
                              guyana-carnival-2027.live/oasis-pool
                            </span>
                          </div>
                          <Badge className="bg-[#0B4F37] text-[#00D2B4] text-[9px]">
                            Auto-Site Live Preview
                          </Badge>
                        </div>

                        {/* Microsite Hero */}
                        <div className="relative p-6 md:p-8 bg-gradient-to-b from-[#0B4F37]/30 via-[#070A0F] to-[#070A0F] border-b border-[#182334] text-center space-y-4">
                          {(activeOutput.coverImageUrl || formData.coverImageUrl) && (
                            <div className="relative w-full h-44 md:h-56 rounded-xl overflow-hidden mb-4 border border-[#1E293B] shadow-lg">
                              <img
                                src={activeOutput.coverImageUrl || formData.coverImageUrl}
                                alt="Event Visual"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as any).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-black/20 to-transparent" />
                            </div>
                          )}

                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D2B4]/10 border border-[#00D2B4]/30 text-[#00D2B4] text-xs font-semibold uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5" />
                            {activeOutput.microsite.dateBadge}
                          </div>

                          <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white font-sans">
                            {activeOutput.microsite.headline}
                          </h2>

                          <p className="text-xs md:text-sm text-gray-300 max-w-lg mx-auto">
                            {activeOutput.microsite.subheadline}
                          </p>

                          {/* Countdown Component */}
                          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto py-3">
                            {[
                              { label: "DAYS", val: "426" },
                              { label: "HOURS", val: "14" },
                              { label: "MINS", val: "22" },
                              { label: "SECS", val: "05" },
                            ].map((unit) => (
                              <div key={unit.label} className="bg-[#0C121D] border border-[#1C2739] rounded-lg p-2 text-center">
                                <div className="text-lg font-bold font-mono text-[#E5A93C]">{unit.val}</div>
                                <div className="text-[9px] text-gray-400 uppercase font-semibold">{unit.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Verified Checkout Button Hooked to Carnival-Planner */}
                          <div className="pt-2">
                            <a
                              href="https://www.carnival-planner.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#E5A93C] via-[#00D2B4] to-[#0B4F37] hover:opacity-95 text-black font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#00D2B4]/20 transition-transform active:scale-95"
                            >
                              <span>Reserve Passes on Carnival-Planner.com</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <p className="text-[10px] text-gray-400 mt-2">
                              Direct API checkout • Verified committee ticketing engine
                            </p>
                          </div>
                        </div>

                        {/* Venue & Highlights */}
                        <div className="p-6 space-y-6">
                          {/* Venue Card */}
                          <div className="p-4 rounded-xl bg-[#0D131F] border border-[#1C273A] space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#00D2B4] uppercase tracking-wider">
                              <MapPin className="w-4 h-4 text-[#E5A93C]" />
                              Confirmed Pool Venue
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              {activeOutput.microsite.venueBadge}
                            </h4>
                            <p className="text-xs text-gray-400">
                              Located 2 minutes from Eugene F. Correia International Airport (Ogle). Full poolside cabanas, open-air bar, daybeds, and sun deck.
                            </p>
                          </div>

                          {/* Lineup Highlights */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                              Headline Sounds & DJs
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {activeOutput.microsite.lineup.map((dj) => (
                                <Badge key={dj} className="bg-[#101827] border border-[#213149] text-gray-200 text-xs py-1 px-2.5">
                                  🎧 {dj}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Ticket Tiers */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                              Passes & Cabana Packages
                            </h4>
                            <div className="space-y-2.5">
                              {activeOutput.microsite.ticketTiers.map((tier) => (
                                <div
                                  key={tier.name}
                                  className="p-3.5 rounded-xl bg-[#0C121E] border border-[#1B273A] flex flex-col md:flex-row md:items-center justify-between gap-3"
                                >
                                  <div>
                                    <div className="font-semibold text-white text-sm">{tier.name}</div>
                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                      {tier.perks.join(" • ")}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between md:justify-end gap-3">
                                    <div className="text-lg font-bold text-[#E5A93C] font-mono">
                                      ${tier.price}
                                    </div>
                                    <a
                                      href="https://www.carnival-planner.com"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-lg bg-[#00D2B4]/20 border border-[#00D2B4]/50 text-[#00D2B4] hover:bg-[#00D2B4] hover:text-black font-semibold text-xs transition-colors"
                                    >
                                      Select Pass
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Merch Integration Card */}
                          {activeOutput.microsite.merchIntegration?.active && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-[#0B4F37]/20 via-[#0C121E] to-[#E5A93C]/10 border border-[#1F2E45] flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <Badge className="bg-[#E5A93C]/20 text-[#E5A93C] border-0 text-[10px]">
                                  Official Apparel Drop
                                </Badge>
                                <div className="text-xs font-bold text-white">
                                  {activeOutput.microsite.merchIntegration.title}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  Printify All-Over-Print 300 DPI Canvas • Ships to USA & Caribbean
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-[#E5A93C] font-mono">
                                  ${activeOutput.microsite.merchIntegration.price}
                                </div>
                                <a
                                  href="https://www.carnival-planner.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#00D2B4] underline font-medium block mt-1"
                                >
                                  Pre-Order →
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* TAB CONTENT 2: RUN OF SHOW */}
                  {outputSubTab === "runofshow" && (
                    <Card className="bg-[#0C1018] border-[#1A2538] text-white">
                      <CardHeader className="pb-4 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-white">Hourly Run-of-Show & Technical Staging</CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            {activeOutput.runOfShow.date} • {activeOutput.runOfShow.venue}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(activeOutput.runOfShow, null, 2),
                              "runofshow"
                            )
                          }
                          className="border-[#212E42] text-xs h-8 text-gray-300"
                        >
                          {copiedKey === "runofshow" ? <Check className="w-3.5 h-3.5 mr-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                          Copy Schedule
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
                            Poolside Schedule
                          </h4>
                          <div className="space-y-2">
                            {activeOutput.runOfShow.schedule.map((slot) => (
                              <div key={slot.time} className="p-3 rounded-lg bg-[#070A0F] border border-[#172233] flex items-start justify-between gap-4">
                                <span className="font-mono text-[#E5A93C] font-semibold shrink-0">
                                  {slot.time}
                                </span>
                                <span className="text-gray-300 text-right">
                                  {slot.activity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#182335] space-y-2">
                          <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
                            Technical & Safety Checklist
                          </h4>
                          <ul className="space-y-1.5">
                            {activeOutput.runOfShow.technicalChecklist.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D2B4] shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB CONTENT 3: PROMO & COPY KIT */}
                  {outputSubTab === "promokit" && (
                    <Card className="bg-[#0C1018] border-[#1A2538] text-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base text-white">Promotional Launch & Copy Kit</CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Ready-to-use captions, video scripts, and email blasts for social promotion.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs">
                        {/* Instagram Caption */}
                        <div className="p-4 rounded-xl bg-[#070A0F] border border-[#192437] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#00D2B4] text-[11px] uppercase">
                              Instagram & Facebook Post Copy
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(activeOutput.promoKit.instagramCaption, "ig")}
                              className="h-7 text-xs text-gray-300 hover:text-white"
                            >
                              {copiedKey === "ig" ? <Check className="w-3 h-3 text-green-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                              Copy
                            </Button>
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-gray-300 text-xs bg-[#0B0E16] p-3 rounded border border-[#141E2F]">
                            {activeOutput.promoKit.instagramCaption}
                          </pre>
                        </div>

                        {/* Teaser Hook Script */}
                        <div className="p-4 rounded-xl bg-[#070A0F] border border-[#192437] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#E5A93C] text-[11px] uppercase">
                              Video Teaser Reel Script (TikTok / IG Reels)
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(activeOutput.promoKit.teaserHookScript, "reel")}
                              className="h-7 text-xs text-gray-300 hover:text-white"
                            >
                              {copiedKey === "reel" ? <Check className="w-3 h-3 text-green-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                              Copy
                            </Button>
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-gray-300 text-xs bg-[#0B0E16] p-3 rounded border border-[#141E2F]">
                            {activeOutput.promoKit.teaserHookScript}
                          </pre>
                        </div>

                        {/* Email Blast */}
                        <div className="p-4 rounded-xl bg-[#070A0F] border border-[#192437] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-400 text-[11px] uppercase">
                              Email Marketing Blast
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCopy(
                                  `Subject: ${activeOutput.promoKit.emailBlastSubject}\n\n${activeOutput.promoKit.emailBlastBody}`,
                                  "email"
                                )
                              }
                              className="h-7 text-xs text-gray-300 hover:text-white"
                            >
                              {copiedKey === "email" ? <Check className="w-3 h-3 text-green-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                              Copy
                            </Button>
                          </div>
                          <div className="text-[11px] text-gray-400 font-semibold">
                            Subject: {activeOutput.promoKit.emailBlastSubject}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-gray-300 text-xs bg-[#0B0E16] p-3 rounded border border-[#141E2F]">
                            {activeOutput.promoKit.emailBlastBody}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB CONTENT 4: FINANCIAL MODEL */}
                  {outputSubTab === "finance" && (
                    <Card className="bg-[#0C1018] border-[#1A2538] text-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base text-white">Projected Ticket & Production Economics</CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Based on capacity and tiered ticket allocations for the AC Marriott Pool Deck.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3.5 rounded-xl bg-[#070A0F] border border-[#192437]">
                            <div className="text-gray-400 text-[10px] uppercase font-semibold">Capacity</div>
                            <div className="text-xl font-bold font-mono text-white mt-1">
                              {activeOutput.financialModel.capacity}
                            </div>
                            <div className="text-[10px] text-gray-400">Max pool attendance</div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#070A0F] border border-[#192437]">
                            <div className="text-gray-400 text-[10px] uppercase font-semibold">Gross Projected Revenue</div>
                            <div className="text-xl font-bold font-mono text-[#00D2B4] mt-1">
                              ${activeOutput.financialModel.projectedGrossRevenue.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">Tickets + 8 Cabanas</div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#070A0F] border border-[#192437]">
                            <div className="text-gray-400 text-[10px] uppercase font-semibold">Est. Production Cost</div>
                            <div className="text-xl font-bold font-mono text-red-400 mt-1">
                              ${activeOutput.financialModel.estimatedProductionCost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">Sound, trussing, DJ fees</div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#070A0F] border border-[#192437]">
                            <div className="text-gray-400 text-[10px] uppercase font-semibold">Est. Net Margin</div>
                            <div className="text-xl font-bold font-mono text-[#E5A93C] mt-1">
                              ${activeOutput.financialModel.projectedNetProfit.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">Net committee profit</div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#080C14] border border-[#172336] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Break-Even Ticket Count:</span>
                            <span className="font-mono font-bold text-white">
                              {activeOutput.financialModel.breakEvenTickets} tickets
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">VIP Cabana Allocation:</span>
                            <span className="font-mono font-bold text-[#E5A93C]">
                              {activeOutput.financialModel.cabanaPackages} VIP Cabanas @ ${formData.vipCabanaPrice}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-[#0C1018] border-[#182334] p-12 text-center text-gray-400">
                  <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-200">No Active Output Generated</h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-6">
                    Fill in the form on the left with your event or merchandise concept and click "Generate Live Site & Deliverables".
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PREVIEW SAVED PROPOSAL */}
      {selectedProposalForModal && (
        <Dialog open={Boolean(selectedProposalForModal)} onOpenChange={() => setSelectedProposalForModal(null)}>
          <DialogContent className="max-w-3xl bg-[#0B0F17] border-[#1E293B] text-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#0B4F37] text-[#00D2B4] text-[10px]">{selectedProposalForModal.category}</Badge>
                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-300">{selectedProposalForModal.status}</Badge>
              </div>
              <DialogTitle className="text-lg text-white font-bold">{selectedProposalForModal.title}</DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                {selectedProposalForModal.venue} • {selectedProposalForModal.targetDate}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-[#080B12] rounded-lg border border-[#162132]">
                <div className="text-[11px] font-semibold text-[#00D2B4] mb-1">Executive Summary</div>
                <p className="text-gray-300 leading-relaxed">
                  {selectedProposalForModal.generatedOutput?.summary || selectedProposalForModal.inputData?.concept}
                </p>
              </div>

              {selectedProposalForModal.generatedOutput?.microsite && (
                <div className="p-3 bg-[#080B12] rounded-lg border border-[#162132] space-y-2">
                  <div className="text-[11px] font-semibold text-[#E5A93C]">Ticket Tiers & Checkout Integration</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {selectedProposalForModal.generatedOutput.microsite.ticketTiers.map((t) => (
                      <div key={t.name} className="p-2 rounded bg-[#0D131F] border border-[#1B273A]">
                        <div className="font-semibold text-white">{t.name}</div>
                        <div className="text-[#E5A93C] font-mono font-bold">${t.price}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1">
                    <a
                      href="https://www.carnival-planner.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00D2B4] underline font-medium inline-flex items-center gap-1"
                    >
                      Checkout URL: carnival-planner.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleLoadProposal(selectedProposalForModal);
                  setSelectedProposalForModal(null);
                }}
                className="border-[#24334A] text-xs text-gray-200"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-[#00D2B4]" />
                Load in Workspace
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedProposalForModal(null)}
                className="bg-[#182334] text-white text-xs"
              >
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {proposalToDelete && (
        <Dialog open={Boolean(proposalToDelete)} onOpenChange={() => setProposalToDelete(null)}>
          <DialogContent className="max-w-md bg-[#0D121B] border-[#223046] text-white">
            <DialogHeader>
              <DialogTitle className="text-base text-white">Delete Committee Proposal?</DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Are you sure you want to delete <strong className="text-white font-semibold">"{proposalToDelete.title}"</strong>? This will permanently remove it from committee database records.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposalToDelete(null)}
                className="border-[#24334A] text-xs text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => proposalToDelete.id && deleteProposalMutation.mutate(proposalToDelete.id)}
                disabled={deleteProposalMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {deleteProposalMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: ADD / EDIT TIMELINE MILESTONE */}
      {isMilestoneModalOpen && (
        <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
          <DialogContent className="max-w-xl bg-[#0D121B] border-[#223046] text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#0B4F37] text-[#00D2B4] border-0 text-[10px] uppercase font-mono">
                  {editingMilestoneId ? "Edit Milestone" : "Add Milestone"}
                </Badge>
              </div>
              <DialogTitle className="text-base md:text-lg text-white font-bold">
                {editingMilestoneId ? "Update Roadmap Milestone" : "Add New Committee Milestone"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Configure timeline checkpoints, event venue coordination, and action items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Phase Selection */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Roadmap Phase</label>
                <select
                  value={milestoneFormData.phase || "Phase 4: Carnival Week Execution (May 19–26, 2027)"}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, phase: e.target.value })}
                  className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs focus:border-[#00D2B4]"
                >
                  <option value="Phase 1: Concept & Production">Phase 1: Concept & Production</option>
                  <option value="Phase 2: Tri-State Buildup & Teaser Launch">Phase 2: Tri-State Buildup & Teaser Launch</option>
                  <option value="Phase 3: Logistics & Arrivals">Phase 3: Logistics & Arrivals</option>
                  <option value="Phase 4: Carnival Week Execution (May 19–26, 2027)">Phase 4: Carnival Week Execution (May 19–26, 2027)</option>
                  <option value="Post-Carnival Wrap & Financial Audit">Post-Carnival Wrap & Financial Audit</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Milestone / Event Title</label>
                <Input
                  value={milestoneFormData.title || ""}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, title: e.target.value })}
                  placeholder="e.g. OASIS: The AC Marriott Welcome Pool Party"
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs focus:border-[#00D2B4]"
                />
              </div>

              {/* Target Date & Responsible Hub */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Target Date / Window</label>
                  <Input
                    value={milestoneFormData.date || ""}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, date: e.target.value })}
                    placeholder="e.g. Friday, May 21, 2027"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs focus:border-[#00D2B4]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Responsible Hub</label>
                  <select
                    value={milestoneFormData.hub || "All Committee"}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, hub: e.target.value as any })}
                    className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs focus:border-[#00D2B4]"
                  >
                    <option value="NJ/NY Committee">NJ / NY Committee</option>
                    <option value="Guyana Operations">Guyana Operations</option>
                    <option value="UK Logistics">UK Logistics</option>
                    <option value="All Committee">All Committee</option>
                  </select>
                </div>
              </div>

              {/* Venue & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Venue / Space</label>
                  <Input
                    value={milestoneFormData.venue || ""}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, venue: e.target.value })}
                    placeholder="e.g. AC Hotel by Marriott (Ogle Pool Deck)"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs focus:border-[#00D2B4]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Execution Status</label>
                  <select
                    value={milestoneFormData.status || "planned"}
                    onChange={(e) => setMilestoneFormData({ ...milestoneFormData, status: e.target.value as any })}
                    className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs focus:border-[#00D2B4]"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Description & Scope</label>
                <Textarea
                  value={milestoneFormData.description || ""}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                  placeholder="Outline key deliverables, operational considerations, or vendor handoffs..."
                  rows={3}
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs focus:border-[#00D2B4]"
                />
              </div>

              {/* Action Checklist (One per line) */}
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Action Checklist (One item per line)</label>
                <Textarea
                  value={rawChecklistInput}
                  onChange={(e) => setRawChecklistInput(e.target.value)}
                  placeholder="Review venue sound permits&#10;Coordinate carnival-planner tickets&#10;Lock in talent flights"
                  rows={3}
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs font-mono focus:border-[#00D2B4]"
                />
                <p className="text-[10px] text-gray-400">
                  Tip: Prefix completed items with "[x] " or toggle them later directly in the roadmap.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="border-[#24334A] text-xs text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMilestoneModal}
                className="bg-[#0B4F37] hover:bg-[#0E6346] text-white text-xs"
              >
                {editingMilestoneId ? "Update Milestone" : "Add to Roadmap"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: SELECT ACTIVE COMMITTEE IDENTITY */}
      {isMemberIdentityModalOpen && (
        <Dialog open={isMemberIdentityModalOpen} onOpenChange={setIsMemberIdentityModalOpen}>
          <DialogContent className="max-w-lg bg-[#0D121B] border-[#223046] text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D91B82]/20 text-[#FF5CA8] border border-[#D91B82]/30 text-[10px] uppercase font-mono">
                  Committee Identity Session
                </Badge>
              </div>
              <DialogTitle className="text-base md:text-lg text-white font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#E5A93C]" />
                Select Your Active Committee Identity
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Choose your profile so your feedback, proposals, and roadmap updates are attributed to you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Quick Select from Registered Roster */}
              {committeeMembers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-gray-300 font-semibold uppercase tracking-wider text-[11px]">
                    Quick Select from Committee Roster
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {committeeMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSaveActiveMemberIdentity(m.name, m.hub, m.role)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                          activeMember?.name.toLowerCase() === m.name.toLowerCase()
                            ? "border-[#D91B82] bg-[#D91B82]/15 text-white shadow-[0_0_10px_rgba(217,27,130,0.2)]"
                            : "border-[#1E293B] bg-[#080B11] text-gray-300 hover:border-gray-500 hover:bg-[#121927]"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-semibold text-white truncate">{m.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{m.role} • {m.hub.replace("Committee", "").trim()}</div>
                        </div>
                        {activeMember?.name.toLowerCase() === m.name.toLowerCase() && (
                          <CheckCircle2 className="w-4 h-4 text-[#E5A93C] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Or Manual Identity Entry */}
              <div className="space-y-3 pt-3 border-t border-[#1C2739]">
                <label className="text-gray-300 font-semibold uppercase tracking-wider text-[11px]">
                  Or Enter Custom Identity
                </label>
                <div className="space-y-1.5">
                  <label className="text-gray-400">Your Full Name</label>
                  <Input
                    value={identityInputName}
                    onChange={(e) => setIdentityInputName(e.target.value)}
                    placeholder="e.g. Marcus Alleyne"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-gray-400">Hub</label>
                    <select
                      value={identityInputHub}
                      onChange={(e) => setIdentityInputHub(e.target.value)}
                      className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs"
                    >
                      <option value="NJ/NY Committee">NJ/NY Committee</option>
                      <option value="Guyana Operations">Guyana Operations</option>
                      <option value="UK Logistics">UK Logistics</option>
                      <option value="Executive Board">Executive Board</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-400">Role / Title</label>
                    <Input
                      value={identityInputRole}
                      onChange={(e) => setIdentityInputRole(e.target.value)}
                      placeholder="e.g. Talent Director"
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMemberIdentityModalOpen(false)}
                className="border-[#24334A] text-xs text-gray-300"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (identityInputName.trim()) {
                    handleSaveActiveMemberIdentity(identityInputName, identityInputHub, identityInputRole);
                  } else {
                    setIsMemberIdentityModalOpen(false);
                  }
                }}
                className="bg-gradient-to-r from-[#D91B82] via-[#A81566] to-[#E5A93C] hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-[#D91B82]/20"
              >
                Set Custom Identity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: REGISTER / EDIT COMMITTEE MEMBER */}
      {isAddMemberModalOpen && (
        <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
          <DialogContent className="max-w-lg bg-[#0D121B] border-[#223046] text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#D91B82]/20 text-[#FF5CA8] border border-[#D91B82]/30 text-[10px] uppercase font-mono">
                  {editingMemberId ? "Update Member" : "Directory Registration"}
                </Badge>
              </div>
              <DialogTitle className="text-base md:text-lg text-white font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E5A93C]" />
                {editingMemberId ? "Edit Committee Profile" : "Register Committee Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Maintain directory accreditation, operational contacts, and hub assignments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Full Name</label>
                <Input
                  value={memberFormData.name || ""}
                  onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                  placeholder="e.g. Kevin Williams"
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Operational Role</label>
                  <Input
                    value={memberFormData.role || ""}
                    onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                    placeholder="e.g. Venue & Staging Lead"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Committee Hub</label>
                  <select
                    value={memberFormData.hub || "NJ/NY Committee"}
                    onChange={(e) => setMemberFormData({ ...memberFormData, hub: e.target.value as any })}
                    className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs"
                  >
                    <option value="NJ/NY Committee">NJ / NY Committee</option>
                    <option value="Guyana Operations">Guyana Operations</option>
                    <option value="UK Logistics">UK Logistics</option>
                    <option value="Executive Board">Executive Board</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Direct Number</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Direct committee messaging (include country code)</span>
                </label>
                <Input
                  value={memberFormData.whatsapp ?? memberFormData.phone ?? ""}
                  onChange={(e) =>
                    setMemberFormData({
                      ...memberFormData,
                      whatsapp: e.target.value,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+1 201 555 0199 or +592 623 0100"
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs focus:border-[#25D366]/70 focus:ring-1 focus:ring-[#25D366]/30 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-medium">Responsibilities / Bio</label>
                <Textarea
                  value={memberFormData.bio || ""}
                  onChange={(e) => setMemberFormData({ ...memberFormData, bio: e.target.value })}
                  placeholder="Key deliverables, AC Marriott liaison, ticketing support, talent coordination..."
                  rows={2}
                  className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="border-[#24334A] text-xs text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saveMemberMutation.isPending || !memberFormData.name?.trim()}
                onClick={() =>
                  saveMemberMutation.mutate({
                    ...(editingMemberId ? { id: editingMemberId } : {}),
                    ...memberFormData,
                  })
                }
                className="bg-gradient-to-r from-[#D91B82] via-[#A81566] to-[#E5A93C] text-white text-xs font-semibold shadow-md shadow-[#D91B82]/20 hover:opacity-95"
              >
                {saveMemberMutation.isPending ? "Saving..." : editingMemberId ? "Update Member" : "Add to Directory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: UPLOAD VISUAL ASSET */}
      {isUploadMediaModalOpen && (
        <Dialog open={isUploadMediaModalOpen} onOpenChange={setIsUploadMediaModalOpen}>
          <DialogContent className="max-w-lg bg-[#0D121B] border-[#223046] text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#0B4F37] text-[#00D2B4] border-0 text-[10px] uppercase font-mono">
                  Asset Ingestion
                </Badge>
              </div>
              <DialogTitle className="text-base md:text-lg text-white font-bold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#00D2B4]" />
                Upload Visual Event Asset
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Upload image flyers, 3D pool stage plots, or apparel proofs directly to committee storage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* File Upload Box */}
              <div className="border-2 border-dashed border-[#1E293B] hover:border-[#00D2B4]/50 rounded-xl p-5 text-center bg-[#07090F] transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={uploadingFile}
                />
                <div className="space-y-2 pointer-events-none">
                  {uploadingFile ? (
                    <RefreshCw className="w-8 h-8 animate-spin text-[#00D2B4] mx-auto" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-gray-500 mx-auto" />
                  )}
                  <div className="text-xs font-semibold text-gray-300">
                    {uploadingFile ? "Uploading file to server..." : "Click or drag image file here"}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Supports PNG, JPG, WEBP up to 25MB • Stored in uploads/committee/
                  </div>
                </div>
              </div>

              {/* Uploaded Image Preview */}
              {(previewMediaUrl || mediaFormData.url) && (
                <div className="relative rounded-lg overflow-hidden border border-[#223249] h-36 w-full bg-[#06080E]">
                  <img
                    src={previewMediaUrl || mediaFormData.url}
                    alt="Uploaded Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/70 text-[#00D2B4] border border-[#00D2B4]/30 text-[10px]">
                      Ready
                    </Badge>
                  </div>
                </div>
              )}

              {/* Asset Metadata Form */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Asset Title</label>
                  <Input
                    value={mediaFormData.title}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, title: e.target.value })}
                    placeholder="e.g. Oasis Pool Party Official Flyer"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Category</label>
                    <select
                      value={mediaFormData.category}
                      onChange={(e) => setMediaFormData({ ...mediaFormData, category: e.target.value as any })}
                      className="w-full bg-[#080B11] border border-[#1C2739] rounded-md px-3 py-2 text-white text-xs"
                    >
                      <option value="flyer">Flyer / Poster</option>
                      <option value="stage_plot">Stage & Venue Plot</option>
                      <option value="apparel">Apparel / Merch Proof</option>
                      <option value="moodboard">Moodboard</option>
                      <option value="photo">Venue Photo</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-medium">Target Event / Venue</label>
                    <Input
                      value={mediaFormData.targetEvent}
                      onChange={(e) => setMediaFormData({ ...mediaFormData, targetEvent: e.target.value })}
                      placeholder="e.g. AC Marriott Pool"
                      className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Direct Image URL (or uploaded link)</label>
                  <Input
                    value={mediaFormData.url}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, url: e.target.value })}
                    placeholder="https://... or uploaded file path"
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-300 font-medium">Description & Notes (Optional)</label>
                  <Input
                    value={mediaFormData.description}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, description: e.target.value })}
                    placeholder="Notes on resolution, design revisions, print specifications..."
                    className="bg-[#080B11] border-[#1C2739] text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadMediaModalOpen(false)}
                className="border-[#24334A] text-xs text-gray-300"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saveMediaMutation.isPending || !mediaFormData.url.trim() || !mediaFormData.title.trim()}
                onClick={() =>
                  saveMediaMutation.mutate({
                    ...mediaFormData,
                    uploadedBy: activeMember ? `${activeMember.name} (${activeMember.hub.split(" ")[0]})` : "Committee Member",
                  })
                }
                className="bg-[#0B4F37] hover:bg-[#0E6346] text-white text-xs"
              >
                {saveMediaMutation.isPending ? "Saving..." : "Save to Vault"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: FULLSCREEN LIGHTBOX IMAGE VIEWER */}
      {selectedImageForLightbox && (
        <Dialog open={Boolean(selectedImageForLightbox)} onOpenChange={() => setSelectedImageForLightbox(null)}>
          <DialogContent className="max-w-4xl bg-[#090D15] border-[#223147] text-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#182334]">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0B4F37] text-[#00D2B4] text-[10px] uppercase">
                    {selectedImageForLightbox.category.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    Target: {selectedImageForLightbox.targetEvent || "Oasis Pool Party"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedImageForLightbox.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, coverImageUrl: selectedImageForLightbox.url }));
                    setSelectedImageForLightbox(null);
                    setActiveTab("generator");
                    toast({
                      title: "Cover Image Set",
                      description: `Attached "${selectedImageForLightbox.title}" to proposal form.`,
                    });
                  }}
                  className="border-[#00D2B4]/40 bg-[#00D2B4]/10 hover:bg-[#00D2B4]/20 text-[#00D2B4] text-xs h-8"
                >
                  Use in Proposal
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(selectedImageForLightbox.url, "lightbox-url")}
                  className="text-gray-300 hover:text-white text-xs h-8"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="relative w-full max-h-[70vh] flex items-center justify-center my-2 overflow-hidden rounded-lg bg-[#05070B] border border-[#162132]">
              <img
                src={selectedImageForLightbox.url}
                alt={selectedImageForLightbox.title}
                className="max-h-[68vh] w-auto max-w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as any).src = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>

            {selectedImageForLightbox.description && (
              <p className="text-xs text-gray-400 pt-1">
                {selectedImageForLightbox.description}
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: RESET / CLEAN SLATE CONFIRMATION */}
      {isResetDataModalOpen && (
        <Dialog open={isResetDataModalOpen} onOpenChange={setIsResetDataModalOpen}>
          <DialogContent className="max-w-md bg-[#0D121B] border-red-900/40 text-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-red-950/60 text-red-400 border border-red-800/40 text-[10px] uppercase font-mono">
                  Administrative Tool
                </Badge>
              </div>
              <DialogTitle className="text-base text-white font-bold flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-400" />
                Reset Workspace for Live Input
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 leading-relaxed">
                Clear out demonstration records to ensure the executive portal is 100% clean and ready for real committee data input.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 text-[11px] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Live Readiness Action
                </div>
                <p>
                  You can reset all demo data at once or target specific modules. This clears sample proposals, comments, or media.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => resetDataMutation.mutate({ scope: "all" })}
                  disabled={resetDataMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-9 font-semibold justify-start px-3"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2" />
                  Full Clean Slate: Reset All Demo Data (Live Mode)
                </Button>

                <Button
                  variant="outline"
                  onClick={() => resetDataMutation.mutate({ scope: "proposals" })}
                  disabled={resetDataMutation.isPending}
                  className="w-full border-[#223046] bg-[#090D15] hover:bg-[#121B2A] text-gray-300 text-xs h-8 justify-start px-3"
                >
                  <FileText className="w-3.5 h-3.5 mr-2 text-[#00D2B4]" />
                  Clear Saved Proposals Only
                </Button>

                <Button
                  variant="outline"
                  onClick={() => resetDataMutation.mutate({ scope: "comments" })}
                  disabled={resetDataMutation.isPending}
                  className="w-full border-[#223046] bg-[#090D15] hover:bg-[#121B2A] text-gray-300 text-xs h-8 justify-start px-3"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  Clear Feedback & Comments Only
                </Button>

                <Button
                  variant="outline"
                  onClick={() => resetDataMutation.mutate({ scope: "timeline" })}
                  disabled={resetDataMutation.isPending}
                  className="w-full border-[#223046] bg-[#090D15] hover:bg-[#121B2A] text-gray-300 text-xs h-8 justify-start px-3"
                >
                  <Calendar className="w-3.5 h-3.5 mr-2 text-[#E5A93C]" />
                  Reset Timeline to Fresh Milestones
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResetDataModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
