import { useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Bell, Shield, CreditCard, AlertTriangle, Camera, Upload, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { user, updateUser, logout } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    eventReminders: true,
    marketingEmails: false,
  });

  const [paymentData, setPaymentData] = useState({
    stripeCustomerId: user?.stripeCustomerId || "",
    paypalCustomerId: user?.paypalCustomerId || "",
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user?.twoFactorEnabled || false,
    isPrivate: user?.isPrivate || false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/profile`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const profilePictureUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: {
          'user-id': user?.id?.toString() || '',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update the user context and local profile data
      updateUser({ ...user, avatar: data.avatar });
      setProfileData(prev => ({ ...prev, avatar: data.avatar }));
      
      // Invalidate queries to refresh profile data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/profile`] });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
      
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      
      setIsUploading(false);
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/payment`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment information updated",
        description: "Your payment information has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/security`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update security settings");
      }
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data.data);
      toast({
        title: "Security settings updated",
        description: "Your security settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update security settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/users/profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted. We're sorry to see you go.",
      });
      
      // Clear user data and redirect to home
      logout();
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentMutation.mutate(paymentData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Profile picture must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      profilePictureUploadMutation.mutate(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Not signed in</h3>
              <p className="mt-1 text-sm text-gray-500">Please sign in to access settings</p>
              <Button className="mt-4" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-4xl mx-auto space-y-8">
      {/* ── LUXURY HERO ── */}
      <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Button variant="outline" size="sm" asChild className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono">
                <Link href="/profile">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back to Profile
                </Link>
              </Button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest">
                ACCOUNT & PREFERENCES
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
              Account Settings
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Personalize your member credentials, security preferences, and VIP notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Picture Section */}
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gold-400 font-heading text-lg">
              <Camera className="h-5 w-5 text-gold-400" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 cursor-pointer ring-2 ring-gold-500/50" onClick={handleAvatarClick}>
                    <AvatarImage src={user?.avatar || profileData.avatar} alt={user?.displayName || user?.username} />
                    <AvatarFallback className="text-lg">
                      {(user?.displayName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {user?.avatar && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => updateProfileMutation.mutate({ ...profileData, avatar: null })}
                        disabled={updateProfileMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload a profile picture. Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          {/* Profile Settings */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading text-lg">
                <User className="h-5 w-5 text-gold-400" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName" className="text-xs font-mono text-gray-300">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your display name"
                      className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-xs font-mono text-gray-300">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Your username"
                      className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-mono text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="bio" className="text-xs font-mono text-gray-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                    rows={3}
                    className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="text-xs font-mono text-gray-300">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Your location"
                      className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-xs font-mono text-gray-300">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="bg-obsidian-card/90 border-white/15 text-white rounded-xl"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs shadow-md"
                >
                  {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading text-lg">
                <CreditCard className="h-5 w-5 text-gold-400" />
                Payment Gateways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stripeCustomerId" className="text-xs font-mono text-gray-300">Stripe Customer ID</Label>
                    <Input
                      id="stripeCustomerId"
                      value={paymentData.stripeCustomerId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, stripeCustomerId: e.target.value }))}
                      placeholder="cus_xxxxxxxxxxxxx"
                      disabled
                      className="bg-obsidian-card/90 border-white/15 text-gray-400 rounded-xl font-mono text-xs"
                    />
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      Automatically generated when you make your first purchase
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="paypalCustomerId" className="text-xs font-mono text-gray-300">PayPal Customer ID</Label>
                    <Input
                      id="paypalCustomerId"
                      value={paymentData.paypalCustomerId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, paypalCustomerId: e.target.value }))}
                      placeholder="paypal_xxxxxxxxxxxxx"
                      disabled
                      className="bg-obsidian-card/90 border-white/15 text-gray-400 rounded-xl font-mono text-xs"
                    />
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      Automatically generated when you use PayPal
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 border border-gold-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-heading font-bold text-white">Bank-Grade Payment Processing</span>
                  </div>
                  <p className="text-xs font-mono text-gray-300">
                    Payment tokens are securely vaulted through Stripe and PayPal. 
                    Savage Gentlemen does not store sensitive cardholder details.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={updatePaymentMutation.isPending}
                  className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs shadow-md"
                >
                  {updatePaymentMutation.isPending ? "Updating..." : "Update Payment Info"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading text-lg">
                <Bell className="h-5 w-5 text-gold-400" />
                Notifications & Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-sm font-semibold text-white">Email Notifications</Label>
                  <p className="text-xs font-mono text-gray-400">Receive email notifications for important updates</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <Separator className="bg-white/10" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="event-reminders" className="text-sm font-semibold text-white">Event Reminders</Label>
                  <p className="text-xs font-mono text-gray-400">Get notified about upcoming carnival drops and events</p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={notifications.eventReminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, eventReminders: checked }))
                  }
                />
              </div>
              
              <Separator className="bg-white/10" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails" className="text-sm font-semibold text-white">VIP Priority Drops</Label>
                  <p className="text-xs font-mono text-gray-400">Receive exclusive promoter codes and private offers</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading text-lg">
                <Shield className="h-5 w-5 text-gold-400" />
                Privacy & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono">
                    <Shield className="h-4 w-4 text-gold-400" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl backdrop-blur-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-heading text-white">Change Password</DialogTitle>
                    <DialogDescription className="text-xs font-mono text-gray-400">
                      Enter your current password and a new password below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-xs font-mono text-gray-300">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs font-mono text-gray-300">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs font-mono text-gray-300">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-white/5 border-white/15 text-white rounded-xl text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="border-white/20 text-gray-300 rounded-xl text-xs">Cancel</Button>
                    <Button 
                      onClick={() => {
                        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
                          return;
                        }
                        changePasswordMutation.mutate({
                          currentPassword: passwordForm.currentPassword,
                          newPassword: passwordForm.newPassword
                        });
                      }}
                      disabled={changePasswordMutation.isPending}
                      className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs"
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="2fa" className="text-sm font-semibold text-white">Two-Factor Authentication</Label>
                  <p className="text-xs font-mono text-gray-400">Add an extra layer of biometric/SMS security to your account</p>
                </div>
                <Switch
                  id="2fa"
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }));
                    updateSecurityMutation.mutate({ twoFactorEnabled: checked });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="private-profile" className="text-sm font-semibold text-white">Private Profile</Label>
                  <p className="text-xs font-mono text-gray-400">Only allow verified members you follow to view your passport stamps</p>
                </div>
                <Switch
                  id="private-profile"
                  checked={securitySettings.isPrivate}
                  onCheckedChange={(checked) => {
                    setSecuritySettings(prev => ({ ...prev, isPrivate: checked }));
                    updateSecurityMutation.mutate({ isPrivate: checked });
                  }}
                />
              </div>

              <Separator className="bg-white/10" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-mono"
                    disabled={deleteAccountMutation.isPending}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-obsidian-card border border-red-500/40 text-white rounded-2xl shadow-2xl backdrop-blur-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl font-heading text-red-400">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left text-xs font-mono text-gray-300">
                      <strong className="text-red-400">This action cannot be undone.</strong>
                      <br /><br />
                      Deleting your account will permanently remove:
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                        <li>Your profile and personal credentials</li>
                        <li>All Soca Passport points, badges, and stamps</li>
                        <li>Your carnival ticket history and QR passes</li>
                      </ul>
                      <br />
                      Are you absolutely sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="border-white/20 text-gray-300 rounded-xl text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                    >
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default SettingsPage;