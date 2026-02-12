import { Link, useLocation } from "wouter";
import { Home, Calendar, ShoppingBag, Blocks, Ticket, Video, Users } from "lucide-react";
import { useIsMobile, useDeviceType } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/events", icon: Calendar, label: "Events" },
  { path: "/my-tickets", icon: Ticket, label: "Tickets" },
  { path: "/shop", icon: ShoppingBag, label: "Shop" },
  { path: "/apps", icon: Blocks, label: "Apps" },
  { path: "/live", icon: Video, label: "Live" },
  { path: "/community", icon: Users, label: "Community" }
];

export function MobileNavigation() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const deviceType = useDeviceType();

  if (!isMobile && deviceType !== 'tablet') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center px-4">
        {navigationItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path ||
            (path !== "/" && location.startsWith(path));

          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center py-2 px-3 transition-colors duration-200 touch-optimized",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}