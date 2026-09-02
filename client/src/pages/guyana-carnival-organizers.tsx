import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Calendar,
  Clock,
  Truck,
  Shield,
  Phone,
  ExternalLink,
  Share2,
  Printer,
  Search,
  CheckCircle2,
  Users,
  Music,
  Layers,
  Box,
  Building2,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

interface PartnerInfo {
  name: string;
  role: string;
  website: string;
  instagram: string;
  logoText: string;
  badgeColor: string;
  description: string;
  coreResponsibilities: string[];
}

const PARTNERS: PartnerInfo[] = [
  {
    name: "SavageGentlemen",
    role: "Host Tech Platform & Concierge",
    website: "https://savagegentlemen.com",
    instagram: "https://instagram.com/savagegentlemen",
    logoText: "SG",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description: "Digital coordination infrastructure, masquerader concierge, airport transfers, and digital ticket validation.",
    coreResponsibilities: [
      "Organizer command portal & run-of-show tracking",
      "Soca Passport credit rewards & community marketing",
      "VIP diaspora travel concierge & airport transport coordination",
      "Digital ticket scanning & access control"
    ]
  },
  {
    name: "Euphoria Mas",
    role: "Mas Band Producer & Road Experience",
    website: "https://www.euphoriamas.com",
    instagram: "https://instagram.com/euphoriamas",
    logoText: "EM",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description: "Premier masquerade band bringing world-class costume craftsmanship, J'ouvert, and road march production.",
    coreResponsibilities: [
      "Costume design, prototyping & offshore manufacturing",
      "Section curation (Frontline, Backline, Male & J'ouvert)",
      "Mas camp fitting, sizing adjustments & costume staging",
      "Road march trucks, section leaders & masquerader amenities"
    ]
  },
  {
    name: "Island Vibes",
    role: "Nightlife, DJ Curation & Media",
    website: "https://instagram.com/islandvibes",
    instagram: "https://instagram.com/islandvibes",
    logoText: "IV",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Caribbean culture catalysts curating the fete soundscape, international DJ bookings, and high-energy vibes.",
    coreResponsibilities: [
      "Carnival week signature fetes & day parties",
      "International & Caribbean DJ / MC lineup curation",
      "Sound truck live music programming & hype teams",
      "Diaspora influencer marketing & promotional rollouts"
    ]
  },
  {
    name: "Carnival-Planner",
    role: "Band Distribution & Mas Camp Logistics",
    website: "https://www.carnival-planner.com",
    instagram: "https://www.carnival-planner.com",
    logoText: "CP",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description: "Specialized carnival operations platform managing costume inventory, pickup scheduling, and collection desks.",
    coreResponsibilities: [
      "Masquerader costume distribution scheduling & queueing",
      "Barcode scanning for error-free package handoff",
      "Real-time inventory tracking (in-transit, ready, collected)",
      "Resolution of size swaps and missing piece escalations"
    ]
  }
];

interface MasqueraderItem {
  id: string;
  name: string;
  section: string;
  type: "Frontline" | "Backline" | "Individual" | "Male" | "J'ouvert";
  size: string;
  status: "Collected" | "Ready for Pickup" | "In Transit" | "Alteration Pending";
  pickupSlot: string;
  balancePaid: boolean;
}

const INITIAL_DISTRIBUTION: MasqueraderItem[] = [
  { id: "CP-1029", name: "Alyssa Chen", section: "Samba Gold", type: "Frontline", size: "Medium / Wire Bra 34C", status: "Ready for Pickup", pickupSlot: "Thu May 20 - 11:00 AM", balancePaid: true },
  { id: "CP-1030", name: "Marcus 'Vibes' Baptiste", section: "Punk Rock", type: "Male", size: "Large / 34W", status: "Collected", pickupSlot: "Thu May 20 - 10:30 AM", balancePaid: true },
  { id: "CP-1031", name: "Dr. K. Ramnarine", section: "Variété Française", type: "Individual", size: "Large / Feather Collar", status: "Alteration Pending", pickupSlot: "Fri May 21 - 02:00 PM", balancePaid: true },
  { id: "CP-1032", name: "Shaniqua Washington", section: "Utopia J'ouvert", type: "J'ouvert", size: "Small T-Shirt + Package", status: "Collected", pickupSlot: "Thu May 20 - 09:30 AM", balancePaid: true },
  { id: "CP-1033", name: "Devon Thorne", section: "Samba Gold", type: "Backline", size: "Small / 32B", status: "Ready for Pickup", pickupSlot: "Thu May 20 - 01:30 PM", balancePaid: true },
  { id: "CP-1034", name: "Chloe St. Clair", section: "Variété Française", type: "Frontline", size: "X-Large / Backpack Rig", status: "In Transit", pickupSlot: "Fri May 21 - 10:00 AM", balancePaid: true },
  { id: "CP-1035", name: "Tariq Mohammed", section: "Punk Rock", type: "Male", size: "Medium / 32W", status: "Ready for Pickup", pickupSlot: "Thu May 20 - 04:00 PM", balancePaid: true },
  { id: "CP-1036", name: "Janelle Gonsalves", section: "Olympus J'ouvert", type: "J'ouvert", size: "Medium Tank + Paint Kit", status: "Collected", pickupSlot: "Thu May 20 - 10:00 AM", balancePaid: true }
];

export default function GuyanaCarnivalOrganizers() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [distributionList, setDistributionList] = useState<MasqueraderItem[]>(INITIAL_DISTRIBUTION);

  // Target date for Guyana Carnival 2027 Road March (Sunday, May 23, 2027)
  const targetDate = useMemo(() => new Date("2027-05-23T07:00:00-04:00"), []);
  
  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [targetDate]);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Organizer Command Center URL copied to clipboard.",
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const toggleCollected = (id: string) => {
    setDistributionList(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === "Collected" ? "Ready for Pickup" : "Collected";
        return { ...item, status: nextStatus };
      }
      return item;
    }));
    toast({
      title: "Status Updated",
      description: `Package ${id} status updated.`,
    });
  };

  const filteredDistribution = useMemo(() => {
    return distributionList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [distributionList, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = 650;
    const collected = 342;
    const ready = 210;
    const inTransit = 84;
    const alterations = 14;
    return { total, collected, ready, inTransit, alterations };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <SEOHead
        title="Guyana Carnival 2027 | Organizer Command Center"
        description="Unified Operations & Logistics Hub for SavageGentlemen, Euphoria Mas, Island Vibes, and Carnival-Planner for Guyana Carnival 2027."
        path="/organizers/guyana2027"
      />

      {/* Top Operations Header */}
      <div className="bg-gradient-to-r from-amber-600/20 via-purple-600/20 to-cyan-600/20 border-b border-white/10 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              Live Organizer Network Active
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Georgetown, Guyana • May 19–26, 2027
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5 border-white/10 hover:bg-white/5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Run-of-Show</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleShare}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Portal</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-12">
        {/* Main Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Official Band Alliance
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Guyana Carnival 2027
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-light mb-6">
            Organizer Command Center & Multi-Band Logistics Hub connecting{" "}
            <span className="text-foreground font-medium">SavageGentlemen</span>,{" "}
            <span className="text-purple-400 font-medium">Euphoria Mas</span>,{" "}
            <span className="text-emerald-400 font-medium">Island Vibes</span>, and{" "}
            <span className="text-cyan-400 font-medium">Carnival-Planner</span>.
          </p>
        </div>

        {/* Live Countdown & Readiness Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/60 backdrop-blur border-white/10 shadow-lg md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Countdown to Road March 2027
                  </CardTitle>
                  <div className="text-3xl sm:text-4xl font-black mt-1 text-primary">
                    {daysRemaining} Days To Go
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
                  Target: Sun, May 23, 2027
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Parade of the Bands departs Georgetown starting zone at 10:00 AM with full Guyana Police Force (GPF) armed motorcade and private extraction teams.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Overall Operational Preparedness</span>
                  <span className="text-emerald-400">42% (On Schedule)</span>
                </div>
                <Progress value={42} className="h-2 bg-white/10" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-white/10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Distribution Readiness
              </CardTitle>
              <div className="text-3xl font-black mt-1 text-cyan-400">
                {stats.collected + stats.ready} / {stats.total}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Masquerader packages accounted for via <span className="text-cyan-300 font-medium">Carnival-Planner</span>.
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-muted-foreground">Mas Camp Venue:</span>
                <span className="font-semibold text-foreground">Pegasus Suites / Marriott Hub</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Ecosystem Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Partner Operational Roles
            </h2>
            <span className="text-xs text-muted-foreground">4 Partner Alliances</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARTNERS.map((partner) => (
              <Card key={partner.name} className="bg-card/40 backdrop-blur border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-foreground">
                      {partner.logoText}
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${partner.badgeColor}`}>
                      {partner.role.split("&")[0]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold">{partner.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {partner.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                      Key Deliverables
                    </span>
                    <ul className="space-y-1.5">
                      {partner.coreResponsibilities.slice(0, 3).map((resp, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Website <ArrowUpRight className="w-3 h-3" />
                    </a>
                    {partner.instagram && partner.instagram !== partner.website && (
                      <>
                        <span className="text-white/20">•</span>
                        <a
                          href={partner.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          Instagram <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Core Operations Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-white/5 border border-white/10 rounded-xl">
            <TabsTrigger value="roadmap" className="py-2 text-xs font-semibold gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="distribution" className="py-2 text-xs font-semibold gap-1.5">
              <Box className="w-3.5 h-3.5" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="runofshow" className="py-2 text-xs font-semibold gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Run-of-Show
            </TabsTrigger>
            <TabsTrigger value="organizations" className="py-2 text-xs font-semibold gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Agencies
            </TabsTrigger>
            <TabsTrigger value="raci" className="py-2 text-xs font-semibold gap-1.5">
              <Users className="w-3.5 h-3.5" />
              RACI & Staff
            </TabsTrigger>
            <TabsTrigger value="emergency" className="py-2 text-xs font-semibold gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ROADMAP */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">Guyana Carnival 2027 Master Timeline</CardTitle>
                    <CardDescription>
                      Phased milestone roadmap from kickoff in late 2026 through the May 2027 celebration.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 self-start sm:self-auto">
                    Phase 1 Currently Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-primary/30 pl-6 ml-4 space-y-8 my-4">
                  {/* Phase 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-background" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Phase 1 • Sep – Nov 2026</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[10px]">In Progress</Badge>
                    </div>
                    <h3 className="text-base font-bold mb-1">Strategic Alignment, Legal MOUs & Theme Ideation</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Lock down four-party MOU between SavageGentlemen, Euphoria Mas, Island Vibes, and Carnival-Planner. Confirm theme concepts, section prototypes, and road truck fleet reservations in Georgetown.
                    </p>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Partner Scope & Split finalized</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>GPF parade date reservation preliminary notice</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Carnival-Planner registration integration test</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Section costume design sign-off (Euphoria Mas)</span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Phase 2 • Dec 2026 – Jan 2027</span>
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Scheduled</Badge>
                    </div>
                    <h3 className="text-base font-bold mb-1">Official Band Launch & Tier-1 Registration Open</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Digital and social media showcase unveiling sections (Frontline, Backline, Individual, Male) and J'ouvert packages. Early-bird registration opens with deposit tiers.
                    </p>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Launch video & photos broadcast on @euphoriamas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Carnival-Planner masquerader portal live</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>SavageGentlemen diaspora travel bundle launch</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Hotel room block confirmations in Georgetown</span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-muted-foreground ring-4 ring-background" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phase 3 • Feb – April 2027</span>
                      <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>
                    </div>
                    <h3 className="text-base font-bold mb-1">Mass Manufacturing, Shipping & Pre-Carnival Events</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Wirework, feather backpacks, bodywear, and packaging production. Ocean freight dispatched for heavy items; air freight booked for delicate plumes. Island Vibes pre-carnival diaspora fete in NYC/London.
                    </p>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        <span>GRA Customs carnival duty exemption clearance</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        <span>Island Vibes NYC/London warm-up party</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        <span>Mas Camp venue contract (Pegasus/Marriott)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        <span>Sound system riggers & generator truck contracts</span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-background" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Phase 4 • May 19 – 26, 2027</span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">Execution</Badge>
                    </div>
                    <h3 className="text-base font-bold mb-1">Guyana Carnival Week & The Road March</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      The live week: Mas camp distribution powered by Carnival-Planner, Island Vibes day/night fetes, Utopia J'ouvert morning, and the Grand Road March on Sunday.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: DISTRIBUTION & MAS CAMP */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-card/40 border-white/10 p-4">
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Total Registered</span>
                <span className="text-2xl font-black mt-1 text-foreground">{stats.total}</span>
                <span className="text-[10px] text-muted-foreground block mt-1">Costumes & J'ouvert</span>
              </Card>
              <Card className="bg-card/40 border-white/10 p-4">
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Ready for Pickup</span>
                <span className="text-2xl font-black mt-1 text-cyan-400">{stats.ready}</span>
                <span className="text-[10px] text-cyan-400/80 block mt-1">At Georgetown Mas Camp</span>
              </Card>
              <Card className="bg-card/40 border-white/10 p-4">
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Collected by Reveler</span>
                <span className="text-2xl font-black mt-1 text-emerald-400">{stats.collected}</span>
                <span className="text-[10px] text-emerald-400/80 block mt-1">Barcode Verified (53%)</span>
              </Card>
              <Card className="bg-card/40 border-white/10 p-4">
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Fitting / Alterations</span>
                <span className="text-2xl font-black mt-1 text-amber-400">{stats.alterations}</span>
                <span className="text-[10px] text-amber-400/80 block mt-1">Seamstress Active</span>
              </Card>
            </div>

            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Box className="w-4 h-4 text-cyan-400" />
                      Carnival-Planner Live Distribution Desk
                    </CardTitle>
                    <CardDescription>
                      Real-time masquerader pickup verification for Mas Camp desk managers.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search reveler, ID, section..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs bg-white/5 border-white/10"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8 px-2 rounded-md text-xs bg-card border border-white/10 text-foreground"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="Collected">Collected</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Alteration Pending">Alteration Pending</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-white/10 bg-white/5">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Masquerader</th>
                        <th className="p-3">Section / Type</th>
                        <th className="p-3">Size Specs</th>
                        <th className="p-3">Pickup Slot</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredDistribution.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-medium text-cyan-400">{item.id}</td>
                          <td className="p-3 font-semibold text-foreground">{item.name}</td>
                          <td className="p-3">
                            <span className="font-medium text-purple-300">{item.section}</span>
                            <span className="block text-[10px] text-muted-foreground">{item.type}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{item.size}</td>
                          <td className="p-3 text-muted-foreground">{item.pickupSlot}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                item.status === "Collected"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : item.status === "Ready for Pickup"
                                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                  : item.status === "Alteration Pending"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-white/5 text-muted-foreground border-white/10"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleCollected(item.id)}
                              className="h-7 text-[11px] px-2 hover:bg-white/10"
                            >
                              {item.status === "Collected" ? "Undo" : "Mark Collected"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MASTER RUN-OF-SHOW */}
          <TabsContent value="runofshow" className="space-y-4">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Carnival Week Daily Run-of-Show (May 19–26, 2027)
                </CardTitle>
                <CardDescription>
                  Minute-by-minute operational itinerary across all participating band entities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wednesday */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                        WED
                      </span>
                      <h4 className="font-bold text-sm">May 19, 2027 • Diaspora Arrival & Welcome Mixer</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                      Lead: SavageGentlemen x Island Vibes
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">12:00 PM – ON</span>
                      <span>Airport greeting at Cheddi Jagan International (GEO) & hotel shuttle drop-offs to Marriott / Pegasus.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">08:00 PM – 02:00 AM</span>
                      <span>Welcome to El Dorado diaspora mixer & DJ showcase featuring Island Vibes resident DJs.</span>
                    </div>
                  </div>
                </div>

                {/* Thursday & Friday */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                        THU-FRI
                      </span>
                      <h4 className="font-bold text-sm">May 20–21, 2027 • Mas Camp Distribution & Signature Fetes</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                      Lead: Carnival-Planner x Euphoria Mas
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">09:00 AM – 06:00 PM</span>
                      <span>Mas Camp Distribution Desk open (Carnival-Planner scanning). Fitting booths, wire adjustment, and wristband issuance.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">02:00 PM (Fri)</span>
                      <span>Island Vibes Signature Daytime Boat Ride / River Cooler Fete.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">08:00 PM (Fri)</span>
                      <span>Final costume clearance & inventory handoff to road march staging coordinators.</span>
                    </div>
                  </div>
                </div>

                {/* Saturday */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        SAT
                      </span>
                      <h4 className="font-bold text-sm">May 22, 2027 • Utopia J'ouvert & Road Truck Rigging</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                      Lead: Euphoria Mas x Island Vibes
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">03:00 AM – 09:00 AM</span>
                      <span>Utopia / Olympus J'ouvert Morning. Paint, mud, powder & water trucks with roving security escort.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">01:00 PM – 06:00 PM</span>
                      <span>Road march sound system rigging, generator fuel top-offs, drink truck stocking, and GPF safety walk-through.</span>
                    </div>
                  </div>
                </div>

                {/* Sunday (Road Parade) */}
                <div className="border-2 border-primary/40 rounded-xl p-4 bg-primary/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center text-xs">
                        SUN
                      </span>
                      <h4 className="font-bold text-sm text-foreground">May 23, 2027 • THE GRAND ROAD MARCH (Parade of Bands)</h4>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      All Partners Active
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">07:00 AM</span>
                      <span>Masquerader hot breakfast, makeup touchups & band staging at initial assembly zone.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">09:30 AM</span>
                      <span>Security perimeter locked. Extraction teams stationed. Sound trucks live.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">10:00 AM</span>
                      <span>Parade of the Bands departs with GPF motorcycle outriders. Euphoria Mas on the road!</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">01:30 PM – 03:00 PM</span>
                      <span>Official Road Lunch Rest Stop (catered Caribbean lunch, hydration recharge, costume fixes).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">07:30 PM</span>
                      <span>Last Lap & Stage Presentation at final judging point.</span>
                    </div>
                  </div>
                </div>

                {/* Monday */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                        MON
                      </span>
                      <h4 className="font-bold text-sm">May 24–26, 2027 • Cool-down & Guyana Independence Day</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                      Lead: SavageGentlemen x Island Vibes
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-foreground font-semibold w-24 shrink-0">11:00 AM – 06:00 PM</span>
                      <span>Post-carnival recovery lime & river retreat on the Essequibo. May 26 National Independence celebrations.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: AGENCIES & ORGANIZATIONS */}
          <TabsContent value="organizations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px]">
                      Law Enforcement & Traffic
                    </Badge>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">Guyana Police Force (GPF) - 'A' Division</CardTitle>
                  <CardDescription className="text-xs">
                    Traffic control, parade route closures, sound truck motorcycle outriders, and roadblock permits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key Jurisdiction:</span>
                    <span className="font-medium">Georgetown Metro & Parade Corridor</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requirement:</span>
                    <span className="font-medium">Permit & Sound Truck Inspection</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Liaison:</span>
                    <span className="font-mono text-muted-foreground">+592-225-6411 / Traffic HQ</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">
                      Customs & Duties
                    </Badge>
                    <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Filing in Jan 2027
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">Guyana Revenue Authority (GRA)</CardTitle>
                  <CardDescription className="text-xs">
                    Customs clearance and carnival duty concession for costume materials, feather backpacks, and stage gear.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key Ports:</span>
                    <span className="font-medium">Cheddi Jagan (GEO) & Georgetown Port</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requirement:</span>
                    <span className="font-medium">Duty Exemption Request Letter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customs Broker:</span>
                    <span className="font-medium">Georgetown Freight Services</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-[10px]">
                      National Tourism
                    </Badge>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Endorsed
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">Guyana Tourism Authority (GTA)</CardTitle>
                  <CardDescription className="text-xs">
                    Official destination support, hospitality liaison with Georgetown hotels, and international diaspora marketing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initiative:</span>
                    <span className="font-medium">Destination Guyana Carnival Campaign</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support:</span>
                    <span className="font-medium">Airport Welcome Desk & Media Passes</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                      Carnival Governing Body
                    </Badge>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">Hits & Jams (HJ) / Guyana Carnival Committee</CardTitle>
                  <CardDescription className="text-xs">
                    Overall carnival coordination, band parade order sequencing, wristband sync, and route judging alignment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parade Position:</span>
                    <span className="font-medium">Section 3 (Mid-Band Peak Slot)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Judging Point:</span>
                    <span className="font-medium">Main Grandstand Presentation</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-pink-500/30 text-pink-400 bg-pink-500/10 text-[10px]">
                      Beverage & Logistics
                    </Badge>
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">Demerara Distillers Ltd (DDL) & Banks DIH</CardTitle>
                  <CardDescription className="text-xs">
                    Premium El Dorado Rum and beverage supply for mobile road bar trailers, cooler trucks, and J'ouvert hydration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beverage Fleet:</span>
                    <span className="font-medium">Two 40ft mobile bars with ice replenishment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Mix:</span>
                    <span className="font-medium">El Dorado 12/15yr, GT Beer, Water, Energy</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px]">
                      Environmental & Municipal
                    </Badge>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">EPA & Georgetown Mayor and City Council (M&CC)</CardTitle>
                  <CardDescription className="text-xs">
                    Environmental noise variance permits for generator operations and post-parade street cleanup teams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decibel Permit:</span>
                    <span className="font-medium">EPA Noise Exemption Certificate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sanitation:</span>
                    <span className="font-medium">Trailing trash collection crew contracted</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: RACI MATRIX & DIRECT CONTACTS */}
          <TabsContent value="raci" className="space-y-4">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-bold">RACI Responsibility Matrix</CardTitle>
                <CardDescription>
                  Operational boundaries (Responsible, Accountable, Consulted, Informed) between the four organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-white/10 bg-white/5">
                      <tr>
                        <th className="p-3">Workstream / Deliverable</th>
                        <th className="p-3 text-center">SavageGentlemen</th>
                        <th className="p-3 text-center">Euphoria Mas</th>
                        <th className="p-3 text-center">Island Vibes</th>
                        <th className="p-3 text-center">Carnival-Planner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Costume Design & Production</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                        <td className="p-3 text-center font-bold text-purple-400">R / A</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Distribution & Mas Camp Operations</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center font-semibold text-purple-300">A</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                        <td className="p-3 text-center font-bold text-cyan-400">R</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Nightlife Fetes, DJs & Hype Team</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center font-bold text-emerald-400">R / A</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Tech Command Portal & Ticketing</td>
                        <td className="p-3 text-center font-bold text-amber-400">R / A</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Road March Trucks & Rigging</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                        <td className="p-3 text-center font-bold text-purple-400">R / A</td>
                        <td className="p-3 text-center font-semibold text-emerald-300">R (Audio)</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold">Diaspora Concierge & Airport Transfers</td>
                        <td className="p-3 text-center font-bold text-amber-400">R / A</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                        <td className="p-3 text-center text-muted-foreground">I</td>
                        <td className="p-3 text-center text-muted-foreground">C</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-muted-foreground flex flex-wrap gap-4">
                  <span><strong className="text-foreground">R</strong> = Responsible (Does the work)</span>
                  <span><strong className="text-foreground">A</strong> = Accountable (Final approval)</span>
                  <span><strong className="text-foreground">C</strong> = Consulted (Provides input)</span>
                  <span><strong className="text-foreground">I</strong> = Informed (Kept in loop)</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Contact Directory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <Card className="bg-card/40 border-white/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                    SG
                  </div>
                  <div>
                    <h5 className="font-bold text-xs">SavageGentlemen Ops</h5>
                    <span className="text-[10px] text-muted-foreground">Tech & Concierge Lead</span>
                  </div>
                </div>
                <div className="mt-2 text-xs space-y-1">
                  <a href="mailto:ops@savagegentlemen.com" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-primary" /> Email Ops Lead
                  </a>
                  <span className="text-[10px] text-muted-foreground block">Platform & Ticket Scanner</span>
                </div>
              </Card>

              <Card className="bg-card/40 border-white/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                    EM
                  </div>
                  <div>
                    <h5 className="font-bold text-xs">Euphoria Mas Camp</h5>
                    <span className="text-[10px] text-muted-foreground">Band Director / Costume Lead</span>
                  </div>
                </div>
                <div className="mt-2 text-xs space-y-1">
                  <a href="https://instagram.com/euphoriamas" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-purple-400" /> @euphoriamas
                  </a>
                  <a href="https://www.euphoriamas.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-purple-400" /> euphoriamas.com
                  </a>
                </div>
              </Card>

              <Card className="bg-card/40 border-white/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    IV
                  </div>
                  <div>
                    <h5 className="font-bold text-xs">Island Vibes Ent</h5>
                    <span className="text-[10px] text-muted-foreground">DJ / Fete Programming</span>
                  </div>
                </div>
                <div className="mt-2 text-xs space-y-1">
                  <a href="https://instagram.com/islandvibes" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-emerald-400" /> @islandvibes
                  </a>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Music className="w-3 h-3 text-emerald-400" /> Live Lineup Sync
                  </span>
                </div>
              </Card>

              <Card className="bg-card/40 border-white/10 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                    CP
                  </div>
                  <div>
                    <h5 className="font-bold text-xs">Carnival-Planner</h5>
                    <span className="text-[10px] text-muted-foreground">Distribution Desk Lead</span>
                  </div>
                </div>
                <div className="mt-2 text-xs space-y-1">
                  <a href="https://www.carnival-planner.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3 text-cyan-400" /> carnival-planner.com
                  </a>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Box className="w-3 h-3 text-cyan-400" /> Live Scanning Desk
                  </span>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: SAFETY & EMERGENCY PROTOCOLS */}
          <TabsContent value="emergency" className="space-y-4">
            <Card className="bg-card/50 border-destructive/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="text-xs">
                    Emergency Protocols & Medical Response
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">Guyana Country Code: +592</span>
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground">
                  Parade Route Medical & Crowd Safety Guide
                </CardTitle>
                <CardDescription>
                  Standard operating procedures for injuries, dehydration, lost masqueraders, and crowd extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
                    <span className="font-bold text-destructive block mb-1">Georgetown Public Hospital (GPHC)</span>
                    <p className="text-muted-foreground mb-2">New Market St, Georgetown. Main trauma & ER center.</p>
                    <span className="font-mono text-foreground font-semibold">Emergency: +592 227-8241</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                    <span className="font-bold text-foreground block mb-1">Mobile Paramedic Unit (Band Trail)</span>
                    <p className="text-muted-foreground mb-2">Dedicated ambulance following 1 vehicle behind Drink Truck 2.</p>
                    <span className="font-mono text-cyan-400 font-semibold">Radio Channel: CH-4 (Medics)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                    <span className="font-bold text-foreground block mb-1">Guyana Police Force Ops Room</span>
                    <p className="text-muted-foreground mb-2">Traffic escort command & security motorcade lead.</p>
                    <span className="font-mono text-amber-400 font-semibold">Direct GPF: 911 / 225-6411</span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" />
                    Security & Crowd Extraction Rules
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span><strong>Rope Perimeter Enforcement:</strong> Only registered masqueraders with official Euphoria Mas wristbands are permitted inside the roped boundaries. Security guards maintain continuous perimeter tension.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span><strong>Overhead Cable Spotters:</strong> Rigging technicians must ride the cab of each 40ft sound truck with insulated lifting poles to clear Georgetown telephone and low-voltage electrical cables.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span><strong>Hydration Contingency:</strong> Drink truck 1 & 2 maintain a reserve of 2,000 chilled bottled waters and electrolytes exclusively for heat relief.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Navigation */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              SavageGentlemen Home
            </Link>
            <span>•</span>
            <Link href="/events" className="hover:text-foreground transition-colors">
              All Events
            </Link>
            <span>•</span>
            <Link href="/apps" className="hover:text-foreground transition-colors">
              Concierge Apps
            </Link>
          </div>
          <div>
            Official Partner Coordination • Guyana Carnival 2027
          </div>
        </div>
      </div>
    </div>
  );
}
