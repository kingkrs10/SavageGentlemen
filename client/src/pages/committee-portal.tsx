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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Fallback default passcode (case-insensitive)
const DEFAULT_ACCESS_KEY = "EUPHORIA2027";
const AUTH_STORAGE_KEY = "sg_committee_auth_2027";

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

  // Form State
  const [formData, setFormData] = useState({
    title: "Oasis: The AC Marriott Welcome Pool Party",
    category: "event",
    author: "NJ/NY Committee",
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

  // Trigger initial generation on first auth
  useEffect(() => {
    if (isAuthenticated && !activeOutput) {
      generateMutation.mutate(formData);
    }
  }, [isAuthenticated]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: "Copied to Clipboard",
      description: "Ready to paste into WhatsApp, Slack, or email.",
    });
  };

  const handleLoadProposal = (prop: ProposalItem) => {
    setCurrentEditingId(prop.id || null);
    if (prop.inputData) {
      setFormData(prop.inputData);
    }
    if (prop.generatedOutput) {
      setActiveOutput(prop.generatedOutput);
    }
    setActiveTab("generator");
    toast({
      title: "Proposal Loaded",
      description: `Opened "${prop.title}" in workspace.`,
    });
  };

  const handleCreateNew = () => {
    setCurrentEditingId(null);
    setFormData({
      title: "New Pool & Lounge Experience",
      category: "event",
      author: "NJ/NY Committee",
      targetDate: "May 21, 2027 (Guyana Independence Weekend)",
      venue: "AC Hotel by Marriott (Ogle, Guyana) Outdoor Pool & Event Lounge",
      concept: "Exclusive daytime event concept for Guyana Carnival 2027.",
      talentWishlist: "DJ Private Ryan, Savage Soundsystem",
      capacity: 400,
      earlyBirdPrice: 40,
      tier1Price: 60,
      vipCabanaPrice: 1200,
      merchTitle: "Amazonian Botanical Jersey & Shorts",
      merchPrice: 65,
      estimatedProductionCost: 12000,
    });
    setActiveOutput(null);
    setActiveTab("generator");
  };

  // -------------------------------------------------------------
  // 1. LOCK SCREEN (CODE ACCESS ONLY)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col items-center justify-center p-4 selection:bg-[#E5A93C] selection:text-black">
        <div className="w-full max-w-md">
          {/* Header Card */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B4F37] via-[#00D2B4]/20 to-[#E5A93C]/30 border border-[#00D2B4]/40 mb-4 shadow-[0_0_35px_rgba(0,210,180,0.15)]">
              <Shield className="w-8 h-8 text-[#E5A93C]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Guyana Carnival 2027
            </h1>
            <p className="text-sm font-semibold tracking-wider text-[#00D2B4] uppercase mt-1">
              Executive Committee Portal
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Private workspace for event generation, live microsite staging, and operations.
            </p>
          </div>

          <Card className="bg-[#0D111A] border-[#1C2638] shadow-2xl text-white">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                      className="bg-[#080B11] border-[#1E293B] text-white placeholder:text-gray-500 pr-10 focus:border-[#00D2B4] focus:ring-[#00D2B4]/20 text-center tracking-widest text-lg font-mono"
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
                    <span className="text-[#00D2B4]">NJ / NY • Guyana • UK</span>
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
                  className="w-full bg-gradient-to-r from-[#0B4F37] via-[#008F6B] to-[#E5A93C] hover:opacity-95 text-white font-semibold shadow-lg shadow-[#0B4F37]/40 h-11"
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
      <header className="sticky top-0 z-50 bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#182234] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B4F37] to-[#E5A93C] flex items-center justify-center border border-[#00D2B4]/30 shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold tracking-tight text-white uppercase">
                  Guyana Carnival 2027 Executive Committee Portal
                </h1>
                <Badge className="bg-[#0B4F37] text-[#00D2B4] border-[#00D2B4]/30 text-[10px] uppercase tracking-wider px-2 py-0.5">
                  Private Access
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Hub: <strong className="text-gray-300">NJ/NY Tri-State</strong></span>
                <span>•</span>
                <span>Venue: <strong className="text-gray-300">AC Hotel Marriott Ogle Pool</strong></span>
                <span>•</span>
                <span>Checkout: <strong className="text-[#00D2B4]">carnival-planner.com</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
              className="border-[#223147] bg-[#0E1522] hover:bg-[#141D2E] text-gray-200 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-[#00D2B4]" />
              New Proposal
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("records")}
              className={`border-[#223147] text-xs h-9 ${activeTab === "records" ? "bg-[#00D2B4]/20 text-[#00D2B4] border-[#00D2B4]" : "bg-[#0E1522] hover:bg-[#141D2E] text-gray-200"}`}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[#E5A93C]" />
              Saved Records ({savedProposals.length})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLockPortal}
              className="text-gray-400 hover:text-red-400 hover:bg-red-950/20 text-xs h-9"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Lock
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {activeTab === "records" ? (
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
                    {currentEditingId && (
                      <Badge variant="outline" className="text-[10px] border-[#E5A93C] text-[#E5A93C]">
                        Editing Record #{currentEditingId}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg text-white">Committee Form</CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Input raw ideas, dates, or vendor logistics. Generates live sites & deliverables instantly.
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
    </div>
  );
}
