import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, User, Edit, Send, AlertCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
}

export default function EmailManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Update user email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: number; email: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, {
        email: email
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUpdateModalOpen(false);
      setSelectedUser(null);
      setEmailAddress("");
      toast({
        title: "Email Updated",
        description: "User email address has been updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email address",
        variant: "destructive"
      });
    }
  });

  // Send password reset mutation
  const sendResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/password-reset/request", {
        email: email
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Email Sent",
        description: "Password reset email has been sent successfully"
      });
      setResetEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
    }
  });

  const handleUpdateEmail = (user: User) => {
    setSelectedUser(user);
    setEmailAddress(user.email || "");
    setIsUpdateModalOpen(true);
  };

  const handleSendReset = async () => {
    if (!resetEmail) return;
    sendResetMutation.mutate(resetEmail);
  };

  return (
    <>
      <SEOHead 
        title="Email & Password Management - Savage Gentlemen Admin" 
        description="Manage user email credentials, dispatch transactional updates, and manage resets." 
      />
      <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-6">
          {/* ── LUXURY HERO ── */}
          <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
                  <Mail className="w-3.5 h-3.5 text-gold-400" />
                  CREDENTIALS & DISPATCH
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
                  Email Management
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Manage user authentication emails, reset access codes, and test transactional dispatches.
                </p>
              </div>
            </div>
          </div>

          {/* Password Reset Testing Card */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading">
                <Send className="h-5 w-5 text-gold-400" />
                Test Password Reset Dispatch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter email address to test reset..."
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  type="email"
                  className="bg-obsidian-card/90 border-white/15 text-white placeholder:text-gray-500 rounded-xl"
                />
                <Button 
                  onClick={handleSendReset}
                  disabled={sendResetMutation.isPending || !resetEmail}
                  className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl shadow-md"
                >
                  {sendResetMutation.isPending ? "Sending..." : "Send Reset"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Test the transactional password recovery email dispatch to verify deliverability.
              </p>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold-400 font-heading">
                <User className="h-5 w-5 text-gold-400" />
                User Email Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
                  <p className="mt-3 text-xs font-mono text-gray-400">Loading user records...</p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5 border-b border-gold-500/20">
                      <TableRow>
                        <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Username</TableHead>
                        <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Display Name</TableHead>
                        <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Email</TableHead>
                        <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Role</TableHead>
                        <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <TableCell className="font-semibold text-white">{user.username}</TableCell>
                          <TableCell className="text-gray-300">{user.displayName || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.email ? (
                                <span className="text-sm font-mono text-gray-200">{user.email}</span>
                              ) : (
                                <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  No email set
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              user.role === 'admin' 
                                ? 'bg-gold-500/20 text-gold-300 border-gold-500/40' 
                                : 'bg-white/10 text-gray-300 border-white/15'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEmail(user)}
                                className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-lg text-xs"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              {user.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendResetMutation.mutate(user.email!)}
                                  disabled={sendResetMutation.isPending}
                                  className="border-white/20 text-gray-300 hover:bg-white/10 rounded-lg text-xs"
                                >
                                  <Mail className="h-3.5 w-3.5 mr-1" />
                                  Send Reset
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Email Modal */}
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent className="sm:max-w-[450px] bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl backdrop-blur-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading text-white">Update Email Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-mono text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={selectedUser?.username || ""}
                    disabled
                    className="bg-white/5 border-white/10 text-gray-400 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-mono text-gold-400 font-bold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address..."
                    className="bg-obsidian-card/90 border-white/15 text-white placeholder:text-gray-500 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="border-white/20 text-gray-300 hover:bg-white/10 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      updateEmailMutation.mutate({
                        userId: selectedUser.id,
                        email: emailAddress
                      });
                    }
                  }}
                  disabled={updateEmailMutation.isPending || !emailAddress}
                  className="bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian font-bold rounded-xl text-xs shadow-md"
                >
                  {updateEmailMutation.isPending ? "Updating..." : "Update Email"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}