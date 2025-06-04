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
  const { data: users = [], isLoading } = useQuery({
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
        title="Email Management - Admin" 
        description="Manage user email addresses and password resets" 
      />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Email Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage user email addresses and send password reset emails
            </p>
          </div>

          {/* Password Reset Testing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Password Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address to test reset"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  type="email"
                />
                <Button 
                  onClick={handleSendReset}
                  disabled={sendResetMutation.isPending || !resetEmail}
                >
                  {sendResetMutation.isPending ? "Sending..." : "Send Reset"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Test the password reset functionality by sending a reset email to any address
              </p>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Email Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.displayName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.email ? (
                              <span className="text-sm">{user.email}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                No email set
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
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
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Email
                            </Button>
                            {user.email && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendResetMutation.mutate(user.email!)}
                                disabled={sendResetMutation.isPending}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Send Reset
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Update Email Modal */}
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Email Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={selectedUser?.username || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
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