"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
    id: number;
    username: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
    avatar: string;
}

export default function AdminUsersPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users", searchTerm],
        queryFn: () => {
            const url = searchTerm ? `/api/admin/users?q=${encodeURIComponent(searchTerm)}` : "/api/admin/users";
            return apiRequest("GET", url).then(res => res.json());
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number, role: string }) => {
            await apiRequest("PUT", `/api/admin/users/${id}`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Role Updated", description: "User permission level changed successfully." });
        },
        onError: (error) => {
            toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
        }
    });

    const handleRoleChange = (id: number, newRole: string) => {
        updateRoleMutation.mutate({ id, role: newRole });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">User Management</h1>
                    <p className="text-gray-400">View members and manage access roles.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-900 border border-white/10 rounded-lg px-4 py-2 max-w-md w-full">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                    placeholder="Search users..."
                    className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-black/40">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">User</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Email</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Joined</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Role</TableHead>
                            <TableHead className="text-right text-white/60 uppercase text-xs tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-white/40">Loading users...</TableCell>
                            </TableRow>
                        ) : users?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-white/40">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users?.map((user) => (
                                <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-primary/20 text-xs">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-white font-medium">{user.displayName || user.username}</div>
                                            <div className="text-white/40 text-xs">@{user.username}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-white/70">{user.email}</TableCell>
                                    <TableCell className="text-white/70 text-xs">
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 uppercase text-[10px] tracking-wider ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                                user.role === 'promoter' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-gray-800 text-gray-400'
                                            }`}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(val) => handleRoleChange(user.id, val)}
                                            disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.id === user.id}
                                        >
                                            <SelectTrigger className="w-[110px] h-8 text-xs bg-black/20 border-white/10 text-white ml-auto">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-white/10 text-white">
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="promoter">Promoter</SelectItem>
                                                <SelectItem value="moderator">Moderator</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
