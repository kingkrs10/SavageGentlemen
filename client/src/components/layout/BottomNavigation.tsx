import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Home, CalendarDays, ShoppingBag, Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/live", label: "Live", icon: Video, hasNotification: true },
    { path: "/community", label: "Community", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-95 backdrop-blur-sm shadow-lg z-40">
      <div className="container mx-auto flex justify-between items-center">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={cn(
              "bottom-nav-item flex-1 py-4 flex flex-col items-center text-xs",
              location === item.path
                ? "active text-primary"
                : "text-gray-500"
            )}
          >
            <div className="relative">
              <item.icon className="w-5 h-5 mb-1" />
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
