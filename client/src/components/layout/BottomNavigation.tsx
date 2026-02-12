import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Home, CalendarDays, ShoppingBag, Blocks, Images, Video, LayoutDashboard, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";
import { useUser } from "@/context/UserContext";

interface BottomNavigationProps {
  user?: User | null;
}

const BottomNavigation = ({ user: propUser }: BottomNavigationProps) => {
  // Get user from context if not provided as prop
  const { user: contextUser } = useUser();
  // Use prop user if available, otherwise use context user
  const user = propUser || contextUser;
  const [location] = useLocation();

  // Default navigation items
  const standardNavItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/apps", label: "Apps", icon: Blocks },
    { path: "/media", label: "Media", icon: Images },
    { path: "/live", label: "Live", icon: Video, hasNotification: true },
  ];

  // Add My Tickets if user is authenticated
  const authenticatedItems = user && !user.isGuest
    ? [...standardNavItems, { path: "/my-tickets", label: "My Tickets", icon: Ticket }]
    : standardNavItems;

  // Add admin item if user is admin
  const navItems = user?.role === "admin"
    ? [...authenticatedItems, { path: "/admin", label: "Admin", icon: LayoutDashboard }]
    : authenticatedItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-40">
      <div className="w-full flex justify-between items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "bottom-nav-item flex-1 py-3 flex flex-col items-center text-xs",
              location === item.path
                ? "text-white border-t-2 border-primary"
                : "text-white/50"
            )}
          >
            <div className="relative">
              <item.icon className={cn(
                "w-5 h-5 mb-1",
                location === item.path ? "text-primary" : "text-white/50"
              )} />
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-none animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-widest uppercase">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
