import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, CheckCircle, XCircle, Trophy, Users, Stamp, Gift } from "lucide-react";

interface PassportProfile {
  id: number;
  userId: number;
  handle: string;
  totalPoints: number;
  currentTier: string;
  stampsCollected: number;
  username: string;
  email: string;
}

interface PassportDetails {
  profile: PassportProfile;
  stamps: any[];
  rewards: any[];
  membership: any | null;
  user: {
    username: string;
    email: string;
    avatar: string | null;
  };
}

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalStamps: number;
  totalRewards: number;
  pendingRewards: number;
  tierDistribution: Record<string, number>;
  recentActivity: Array<{ date: string; stampsIssued: number }>;
}

interface Promoter {
  id: number;
  name: string;
  email: string;
  organization?: string;
  locationCity?: string;
  locationCountry?: string;
  status: string;
  createdAt: Date;
  username?: string;
}

export default function PassportManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<PassportDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    totalPoints: 0,
    currentTier: "",
    stampsCollected: 0,
  });

  // Fetch passport profiles
  const buildProfilesUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (tierFilter) params.append('tierFilter', tierFilter);
    params.append('limit', '50');
    params.append('offset', '0');
    return `/api/admin/passport/profiles?${params.toString()}`;
  };

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: [buildProfilesUrl(), searchTerm, tierFilter],
    enabled: activeTab === "users",
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/passport/analytics"],
    enabled: activeTab === "analytics",
  });

  // Fetch promoters
  const { data: promotersData, isLoading: promotersLoading } = useQuery({
    queryKey: ["/api/admin/promoters"],
    enabled: activeTab === "promoters",
  });

  // Fetch profile details
  const fetchProfileDetails = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("GET", `/api/admin/passport/profiles/${userId}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedProfile(data);
      setEditFormData({
        totalPoints: data.profile.totalPoints,
        currentTier: data.profile.currentTier,
        stampsCollected: data.profile.stampsCollected,
      });
    },
  });

  // Update passport profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/passport/profiles/${userId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Passport profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/passport/profiles"] });
      setEditDialogOpen(false);
      setSelectedProfile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update passport profile.",
        variant: "destructive",
      });
    },
  });

  // Update promoter status
  const updatePromoterMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/promoters/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Promoter Updated",
        description: "Promoter status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promoters"] });
    },
  });

  const handleViewDetails = (profile: PassportProfile) => {
    fetchProfileDetails.mutate(profile.userId);
  };

  const handleEditSubmit = () => {
    if (!selectedProfile) return;
    updateProfileMutation.mutate({
      userId: selectedProfile.profile.userId,
      data: editFormData,
    });
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: "bg-orange-500",
      SILVER: "bg-gray-400",
      GOLD: "bg-yellow-500",
      ELITE: "bg-purple-500",
    };
    return colors[tier] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500",
      APPROVED: "bg-green-500",
      REJECTED: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" data-testid="tab-passport-users">
            <Users className="h-4 w-4 mr-2" />
            Passport Users
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-passport-analytics">
            <Trophy className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="promoters" data-testid="tab-promoters">
            <CheckCircle className="h-4 w-4 mr-2" />
            Promoters
          </TabsTrigger>
        </TabsList>

        {/* Passport Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Passport Users</CardTitle>
              <CardDescription>Manage user passports, points, and tiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username, handle, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-passport"
                  />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tiers</SelectItem>
                    <SelectItem value="BRONZE">Bronze</SelectItem>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="ELITE">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profilesLoading ? (
                <div className="text-center py-8">Loading passport users...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Stamps</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profilesData?.profiles?.map((profile: PassportProfile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.username}</TableCell>
                          <TableCell>@{profile.handle}</TableCell>
                          <TableCell>
                            <Badge className={getTierColor(profile.currentTier)}>
                              {profile.currentTier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{profile.totalPoints}</TableCell>
                          <TableCell className="text-right">{profile.stampsCollected}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(profile)}
                              data-testid={`button-view-passport-${profile.userId}`}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              View & Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!profilesData?.profiles?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No passport users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.activeUsers || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stamps</CardTitle>
                <Stamp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalStamps || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalRewards || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.pendingRewards || 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Elite Users</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.tierDistribution?.ELITE || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics?.tierDistribution || {}).map(([tier, count]) => (
                  <div key={tier} className="flex items-center gap-4">
                    <Badge className={getTierColor(tier)}>{tier}</Badge>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getTierColor(tier)}`}
                          style={{
                            width: `${((count as number) / (analytics?.totalUsers || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promoters Tab */}
        <TabsContent value="promoters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promoter Applications</CardTitle>
              <CardDescription>Review and manage promoter applications</CardDescription>
            </CardHeader>
            <CardContent>
              {promotersLoading ? (
                <div className="text-center py-8">Loading promoters...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotersData?.promoters?.map((promoter: Promoter) => (
                        <TableRow key={promoter.id}>
                          <TableCell className="font-medium">{promoter.name}</TableCell>
                          <TableCell>{promoter.email}</TableCell>
                          <TableCell>{promoter.organization || "-"}</TableCell>
                          <TableCell>
                            {promoter.locationCity && promoter.locationCountry
                              ? `${promoter.locationCity}, ${promoter.locationCountry}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(promoter.status)}>
                              {promoter.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {promoter.status === "PENDING" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updatePromoterMutation.mutate({
                                      id: promoter.id,
                                      status: "APPROVED",
                                    })
                                  }
                                  data-testid={`button-approve-promoter-${promoter.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updatePromoterMutation.mutate({
                                      id: promoter.id,
                                      status: "REJECTED",
                                    })
                                  }
                                  data-testid={`button-reject-promoter-${promoter.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!promotersData?.promoters?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No promoter applications found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen || !!selectedProfile} onOpenChange={(open) => {
        if (!open) {
          setEditDialogOpen(false);
          setSelectedProfile(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Passport Profile Details</DialogTitle>
            <DialogDescription>
              View and edit passport profile for {selectedProfile?.user.username}
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-sm text-muted-foreground">{selectedProfile.user.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedProfile.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Handle</Label>
                  <p className="text-sm text-muted-foreground">@{selectedProfile.profile.handle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Membership</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProfile.membership?.tier || "FREE"}
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Edit Passport Data</h4>
                
                <div>
                  <Label htmlFor="totalPoints">Total Points</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    value={editFormData.totalPoints}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, totalPoints: parseInt(e.target.value) || 0 })
                    }
                    data-testid="input-edit-points"
                  />
                </div>

                <div>
                  <Label htmlFor="currentTier">Current Tier</Label>
                  <Select
                    value={editFormData.currentTier}
                    onValueChange={(value) => setEditFormData({ ...editFormData, currentTier: value })}
                  >
                    <SelectTrigger data-testid="select-edit-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="ELITE">Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stampsCollected">Stamps Collected</Label>
                  <Input
                    id="stampsCollected"
                    type="number"
                    value={editFormData.stampsCollected}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, stampsCollected: parseInt(e.target.value) || 0 })
                    }
                    data-testid="input-edit-stamps"
                  />
                </div>
              </div>

              {/* Stamps History */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Stamp History ({selectedProfile.stamps.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedProfile.stamps.map((stamp: any) => (
                    <div key={stamp.id} className="text-sm flex justify-between">
                      <span>Event ID: {stamp.eventId}</span>
                      <span className="text-muted-foreground">
                        {new Date(stamp.awardedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Rewards ({selectedProfile.rewards.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedProfile.rewards.map((reward: any) => (
                    <div key={reward.id} className="text-sm flex justify-between">
                      <span>{reward.title}</span>
                      <Badge className={reward.status === "REDEEMED" ? "bg-green-500" : ""}>
                        {reward.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setSelectedProfile(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-passport-changes"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
