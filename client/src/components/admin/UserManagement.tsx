import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Trash2, Search, Filter, Users, UserCheck, Shield, Eye, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  email: string | null;
  createdAt: string;
  isGuest: boolean;
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch all users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Mutation for updating user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      setUpdating(userId);
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "User role updated successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setUpdating(null);
    }
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "User deleted successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });
  
  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number, username: string) => {
    const isConfirmed = window.confirm(
      `⚠️ DELETE USER CONFIRMATION\n\n` +
      `User: ${username}\n` +
      `ID: ${userId}\n\n` +
      `This will permanently delete:\n` +
      `• User account and profile\n` +
      `• All purchased tickets\n` +
      `• Order history\n` +
      `• User reviews and posts\n` +
      `• Associated data\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Type "DELETE" to confirm removal of ${username}:`
    );
    
    if (isConfirmed) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = searchQuery === '' || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'guest' && user.isGuest) ||
        (statusFilter === 'registered' && !user.isGuest);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const userStats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, moderators: 0, registered: 0, guests: 0 };
    
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      moderators: users.filter(u => u.role === 'moderator').length,
      registered: users.filter(u => !u.isGuest).length,
      guests: users.filter(u => u.isGuest).length
    };
  }, [users]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/20 p-4 rounded-md text-destructive">
        <h2 className="font-semibold">Error loading users</h2>
        <p>{(error as Error).message}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Users className="h-3.5 w-3.5 mr-2 text-gold-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-extrabold text-white">{userStats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Shield className="h-3.5 w-3.5 mr-2 text-gold-400" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-extrabold text-gold-400">{userStats.admins}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Eye className="h-3.5 w-3.5 mr-2 text-amber-400" />
              Moderators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-extrabold text-amber-400">{userStats.moderators}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" />
              Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-extrabold text-emerald-400">{userStats.registered}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
              Guests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-extrabold text-gray-400">{userStats.guests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-obsidian-card/90 border-white/15 text-white placeholder:text-gray-500 rounded-xl"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px] bg-obsidian-card/90 border-white/15 text-white rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-gold-400" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-xl shadow-2xl">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-obsidian-card/90 border-white/15 text-white rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-gold-400" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-xl shadow-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs font-mono text-gray-400">
        Showing {filteredUsers.length} of {userStats.total} members
      </div>
      
      <div className="bg-obsidian-card border border-gold-500/20 rounded-2xl shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5 border-b border-gold-500/20">
            <TableRow>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">ID</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Username</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Display Name</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Email</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Joined</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Role</TableHead>
              <TableHead className="text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-gray-500" />
                    <p className="text-gray-400 text-xs font-mono">
                      {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                        ? 'No members match your current filters' 
                        : 'No users found'}
                    </p>
                    {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        }}
                        className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs mt-2"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors text-xs">
                <TableCell className="font-mono text-gray-400">{user.id}</TableCell>
                <TableCell className="font-semibold text-white">{user.username}</TableCell>
                <TableCell className="text-gray-300">{user.displayName || user.username}</TableCell>
                <TableCell className="font-mono text-gray-300">{user.email || '—'}</TableCell>
                <TableCell className="font-mono text-gray-400">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  {user.isGuest ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-gray-300 border border-white/15">Guest</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Registered</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    user.role === 'admin' 
                      ? 'bg-gold-500/20 text-gold-300 border-gold-500/40' 
                      : user.role === 'moderator'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/10 text-gray-300 border-white/15'
                  }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {updating === user.id ? (
                      <Button size="sm" variant="outline" disabled className="border-gold-500/30 text-gold-300 rounded-lg text-xs">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-gold-400" />
                        Updating
                      </Button>
                    ) : (
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={user.id === 1}
                      >
                        <SelectTrigger className="w-[110px] h-8 bg-obsidian-card border-white/15 text-white rounded-lg text-xs">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-obsidian-card border border-gold-500/30 text-white rounded-xl shadow-2xl">
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Delete button - protected for main admin */}
                    {user.id !== 1 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={deleteUserMutation.isPending}
                        title={`Delete user ${user.username}`}
                      >
                        {deleteUserMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Additional Info */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p className="font-medium mb-2">User Management Guidelines:</p>
        <ul className="space-y-1 ml-4">
          <li>• Main admin account (ID: 1) is protected from deletion and role changes</li>
          <li>• Deleting a user removes all associated data including tickets, orders, and reviews</li>
          <li>• Role changes take effect immediately and affect user permissions</li>
          <li>• Guest users are temporary accounts created during free ticket claims</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;