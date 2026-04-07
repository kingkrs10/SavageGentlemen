"use client";

import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar, MobileSidebar } from "@/components/admin/AdminSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    // Protect Admin Routes
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-primary font-heading tracking-widest">LOADING ADMIN PANEL...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-black relative">
                {/* Admin Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-gray-950/80 backdrop-blur-md px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <MobileSidebar />
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white">
                            Admin <span className="text-primary italic">Panel</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 p-0 overflow-hidden hover:border-primary/50 transition-colors">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatar || ""} alt={user.displayName || user.username} />
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                            {user.displayName?.charAt(0) || user.username.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-gray-900 border-white/10 text-white" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold leading-none">{user.displayName || user.username}</p>
                                        <p className="text-xs leading-none text-gray-400">{user.email || user.username}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer" onClick={() => router.push("/profile")}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer" onClick={() => router.push("/")}>
                                    Back to Site
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-red-500 hover:bg-red-500/10 cursor-pointer" onClick={() => logout()}>
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content Area */}
                <ScrollArea className="flex-1">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
                        {children}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
