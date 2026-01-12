"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Calendar,
    ShoppingBag,
    Ticket,
    Users,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import LogoImg from "@/assets/SGFLYERLOGO.png";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Protect Admin Routes
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role !== 'admin') {
        // Show loading state while checking auth
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-white">Loading Admin Panel...</div>
            </div>
        );
    }

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: Calendar, label: "Events", href: "/admin/events" },
        { icon: ShoppingBag, label: "Products", href: "/admin/products" },
        { icon: Ticket, label: "Tickets & Scanner", href: "/admin/tickets" },
        { icon: Users, label: "Users", href: "/admin/users" },
    ];

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <div className="flex h-screen bg-black text-foreground">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`fixed md:relative z-50 w-64 h-full bg-gray-900 border-r border-white/10 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
            >
                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-10 text-white">
                        <Image src={LogoImg} alt="Logo" width={40} height={40} className="object-contain" />
                        <span className="font-heading text-xl tracking-widest uppercase">Admin</span>
                    </div>

                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <span
                                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 text-sm font-medium tracking-wide uppercase ${isActive
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    <div className="pt-6 border-t border-white/10 mt-auto">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 uppercase tracking-widest text-xs"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center p-4 border-b border-white/10 bg-gray-900/50 backdrop-blur-md">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-6 h-6 text-white" />
                    </Button>
                    <span className="ml-4 font-heading tracking-widest text-white">Admin Dashboard</span>
                </header>

                <ScrollArea className="flex-1">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}
