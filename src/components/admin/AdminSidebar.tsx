"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingBag, 
  Ticket, 
  Users, 
  Music, 
  Search, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Video,
  Radio,
  Image as ImageIcon,
  Scan,
  CreditCard,
  Target,
  FileText,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import LogoImg from "@/assets/SGFLYERLOGO.png";
import { useUser } from "@/context/UserContext";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: any;
  href: string;
  tab?: string; // For compatibility if needed
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin", tab: "overview" },
    ]
  },
  {
    label: "Content",
    items: [
      { label: "Events", icon: Calendar, href: "/admin/events", tab: "events" },
      { label: "Tickets", icon: Ticket, href: "/admin/tickets", tab: "tickets" },
      { label: "Products", icon: ShoppingBag, href: "/admin/products", tab: "products" },
    ]
  },
  {
    label: "Media",
    items: [
      { label: "Livestreams", icon: Video, href: "/admin/livestreams", tab: "livestreams" },
      { label: "Music Mixes", icon: Music, href: "/admin/music", tab: "music" },
      { label: "Media Library", icon: ImageIcon, href: "/admin/media", tab: "media" },
      { label: "Advertisements", icon: Target, href: "/admin/ads", tab: "ads" },
    ]
  },
  {
    label: "People",
    items: [
      { label: "Users", icon: Users, href: "/admin/users", tab: "users" },
      { label: "Passport", icon: ShieldCheck, href: "/admin/passport", tab: "passport" },
      { label: "Scanner", icon: Scan, href: "/admin/scanner", tab: "scanner" },
    ]
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", icon: CreditCard, href: "/admin/orders", tab: "orders" },
      { label: "Affiliates", icon: DollarSign, href: "/admin/affiliates", tab: "affiliates" },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useUser();

  // Load collapse state from local storage
  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", newState.toString());
  };

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-gray-950 border-r border-white/5">
      <div className={cn(
        "p-6 flex items-center transition-all duration-300",
        isCollapsed && !mobile ? "justify-center px-2" : "gap-3"
      )}>
        <Image src={LogoImg} alt="Savage Gentlemen" width={40} height={40} className="object-contain" />
        {(!isCollapsed || mobile) && (
          <div className="flex flex-col">
            <span className="font-heading text-xl tracking-widest uppercase text-white leading-none">Savage</span>
            <span className="font-heading text-xs tracking-widest uppercase text-primary leading-none mt-1">Gentlemen</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              {(!isCollapsed || mobile) && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                  {group.label}
                </h4>
              )}
              {isCollapsed && !mobile && (
                <div className="h-px bg-white/5 mx-2 my-4" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : ""}
                    >
                      <span className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative",
                        isActive 
                          ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/20" 
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}>
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:text-primary transition-colors")} />
                        {(!isCollapsed || mobile) && (
                          <span className="truncate tracking-wide">{item.label}</span>
                        )}
                        {isActive && !isCollapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_white]" />
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className={cn("p-4 border-t border-white/5 mt-auto bg-black/40", isCollapsed && !mobile ? "flex flex-col items-center px-2" : "")}>
        <Button
          variant="ghost"
          onClick={() => logout()}
          className={cn(
            "w-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 justify-start h-11",
            isCollapsed && !mobile ? "justify-center p-0" : ""
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || mobile) && <span className="ml-3 uppercase tracking-widest text-[11px] font-bold">Logout</span>}
        </Button>
        
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="w-full mt-2 text-gray-500 hover:text-white h-8 opacity-40 hover:opacity-100 hidden md:flex"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Small Toggle for Mobile Header Integration handled in Layout */}
      <aside className={cn(
        "hidden md:block h-screen transition-all duration-300 ease-in-out sticky top-0 shrink-0 overflow-y-auto custom-scrollbar bg-gray-950",
        isCollapsed ? "w-[68px]" : "w-[240px]"
      )}>
        <NavContent />
      </aside>
    </>
  );
}

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const NavContent = ({ mobile = true }) => (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-6 flex items-center gap-3">
        <Image src={LogoImg} alt="Savage Gentlemen" width={40} height={40} className="object-contain" />
        <div className="flex flex-col">
          <span className="font-heading text-xl tracking-widest uppercase text-white leading-none">Savage</span>
          <span className="font-heading text-xs tracking-widest uppercase text-primary leading-none mt-1">Gentlemen</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative",
                        isActive 
                          ? "bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/20" 
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}>
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:text-primary transition-colors")} />
                        <span className="truncate tracking-wide">{item.label}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {/* Logout button here if needed for mobile, but usually in avatar menu or sidebar bottom */}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white mr-2">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r border-white/5 w-[280px] bg-gray-950">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <NavContent mobile />
      </SheetContent>
    </Sheet>
  );
}
