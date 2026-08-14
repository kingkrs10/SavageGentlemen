import { useLocation, Link } from "wouter";
import { Home, CalendarDays, QrCode, Music, Blocks, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";
import { useUser } from "@/context/UserContext";

interface BottomNavigationProps {
  user?: User | null;
}

const BottomNavigation = ({ user: propUser }: BottomNavigationProps) => {
  const { user: contextUser } = useUser();
  const user = propUser || contextUser;
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/passport", label: "Passport", icon: QrCode, isCenter: true },
    { path: "/media", label: "Mixes", icon: Music },
    { path: "/apps", label: "Void", icon: Blocks },
  ];

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none">
      <div className="w-full max-w-md mx-auto pointer-events-auto">
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));

            if (item.isCenter) {
              return (
                <Link
                  key={item.path}
                  href="/passport"
                  className="relative -top-4 flex flex-col items-center group touch-manipulation"
                >
                  <div
                    className={cn(
                      "w-13 h-13 rounded-full flex items-center justify-center p-3 transition-all duration-300 shadow-xl border-2",
                      isActive
                        ? "bg-gradient-to-tr from-gold-500 to-amber-300 border-white text-black shadow-gold-500/50 scale-105"
                        : "bg-obsidian border-gold-500 text-gold-400 shadow-black/80 hover:scale-105"
                    )}
                  >
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5 text-gold-400">
                    PASSPORT
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex-1 py-1.5 flex flex-col items-center justify-center rounded-xl transition-all duration-200 touch-manipulation",
                  isActive
                    ? "text-gold-400 font-bold bg-gold-500/10"
                    : "text-white/60 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "scale-110 text-gold-400"
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wider mt-1 transition-colors",
                    isActive ? "text-gold-300 font-bold" : "text-white/50"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
