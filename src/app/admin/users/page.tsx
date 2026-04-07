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
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Trash2, UserCog, MoreVertical, Copy } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

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
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users", searchTerm],
        queryFn: () => {
            const url = searchTerm ? `/api/admin/users?q=${encodeURIComponent(searchTerm)}` : "/api/admin/users";
            return apiRequest("GET", url).then(res => res.json());
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: number, role: string }) => {
            const res = await apiRequest("PUT", `/api/admin/users/${id}`, { role });
            if (!res.ok) throw new Error("Failed to update role");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Role Updated", description: "User permission level changed successfully." });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: number) => {
            setIsDeleting(id);
            const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to delete user");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "User Deleted", description: "All associated data has been purged." });
        },
        onError: (error: any) => {
            toast({
                title: "Deletion Failed",
                description: error.message,
                variant: "destructive"
            });
        },
        onSettled: () => setIsDeleting(null)
    });

    const handleRoleChange = (id: number, newRole: string) => {
        updateRoleMutation.mutate({ id, role: newRole });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "ID copied to clipboard." });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-heading text-white tracking-tighter uppercase mb-2">Member Directory</h1>
                    <p className="text-gray-400 font-light flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-primary" />
                        Manage cross-platform access and permissions.
                    </p>
                </div>
                
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by ID, username, or email..."
                        className="pl-10 h-11 bg-black/40 border-white/5 focus-visible:ring-primary/50 text-white placeholder:text-gray-500 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black/60 border-b border-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="text-white/40 uppercase text-[10px] font-bold tracking-widest pl-6">Profile</TableHead>
                                <TableHead className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Metadata</TableHead>
                                <TableHead className="text-white/40 uppercase text-[10px] font-bold tracking-widest">Permissions</TableHead>
                                <TableHead className="text-right text-white/40 uppercase text-[10px] font-bold tracking-widest pr-6">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4 opacity-50" />
                                            <p className="text-white/40 text-sm font-light">Decrypting user archives...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : users?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-white/40 font-light">
                                            No matches found in the shadow directory.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users?.map((user) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="group border-white/5 hover:bg-white/[0.02] transition-all"
                                        >
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 border border-white/10 group-hover:border-primary/50 transition-colors">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-white font-semibold text-base flex items-center gap-2">
                                                            {user.displayName || user.username}
                                                            {user.role === 'admin' && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                                                        </div>
                                                        <div className="text-white/30 text-xs font-mono">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-white/70 text-sm">{user.email}</div>
                                                    <div className="text-white/30 text-[10px] uppercase tracking-tighter">Joined {format(new Date(user.createdAt), "MMMM d, yyyy")}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`border-0 h-6 px-3 uppercase text-[9px] font-bold tracking-[0.1em] rounded-full ${
                                                    user.role === 'admin' ? 'bg-primary/20 text-primary ring-1 ring-primary/30' :
                                                    user.role === 'promoter' ? 'bg-accent/20 text-accent ring-1 ring-accent/30' :
                                                    'bg-white/5 text-white/50 ring-1 ring-white/10'
                                                }`}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Select
                                                        defaultValue={user.role}
                                                        onValueChange={(val) => handleRoleChange(user.id, val)}
                                                        disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.id === user.id}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-9 text-[11px] bg-black/40 border-white/5 text-white hover:border-primary/30 transition-all rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                                                            <SelectItem value="user">USER</SelectItem>
                                                            <SelectItem value="promoter">PROMOTER</SelectItem>
                                                            <SelectItem value="moderator">MODERATOR</SelectItem>
                                                            <SelectItem value="admin">ADMIN</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/20 hover:text-white rounded-lg hover:bg-white/5">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
                                                            <DropdownMenuLabel className="text-[10px] text-white/40 uppercase tracking-widest">Controls</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => copyToClipboard(user.id.toString())} className="text-xs hover:bg-white/5 cursor-pointer flex justify-between">
                                                                Copy Secret ID
                                                                <Copy className="w-3 h-3 opacity-40" />
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-white/5" />
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer flex justify-between">
                                                                        Purge User
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-[#111] border-white/10 text-white max-w-md">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-xl font-heading text-destructive uppercase tracking-widest">Initiate Purge?</AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-white/60 font-light">
                                                                            This action will permanently delete <span className="text-white font-bold">@{user.username}</span> and all associated commerce data, social posts, and tickets. This cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="gap-2">
                                                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-6 h-11">Abort</AlertDialogCancel>
                                                                        <AlertDialogAction 
                                                                            onClick={() => deleteUserMutation.mutate(user.id)}
                                                                            disabled={isDeleting === user.id}
                                                                            className="bg-destructive hover:bg-destructive/90 text-white rounded-xl px-6 h-11 uppercase font-bold tracking-widest"
                                                                        >
                                                                            {isDeleting === user.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                                            Execute
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <div className="flex justify-between items-center px-2">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Directory Last Synced: {new Date().toLocaleTimeString()}</p>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] text-green-500 uppercase font-bold tracking-widest">Secure Link Active</span>
                </div>
            </div>
        </div>
    );
}
