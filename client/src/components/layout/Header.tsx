import React from "react";
import { Search, User, LogOut, LayoutDashboard, Ticket, Settings, Compass, Sparkles, Zap, Shield } from "lucide-react";
import { User as UserType } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LogoImage from "@/assets/SGFLYERLOGO.png";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user?: UserType | null;
  onProfileClick?: () => void;
  onLogout?: () => void;
  transparent?: boolean;
}

const Header = ({ user: propUser, onProfileClick, onLogout, transparent }: HeaderProps) => {
  const { user: contextUser, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const user = propUser || contextUser;

  const isVoidMode = location.startsWith("/apps");

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleRealityShift = () => {
    if (isVoidMode) {
      navigate("/");
    } else {
      navigate("/apps");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl border-b",
        isVoidMode
          ? "bg-obsidian-dark/90 border-cyan-500/20 shadow-[0_4px_30px_rgba(0,242,254,0.08)]"
          : "bg-obsidian-dark/85 border-gold-500/15 shadow-[0_4px_30px_rgba(229,169,60,0.06)]"
      )}
    >
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <img
              src={LogoImage}
              alt="Savage Gentlemen"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(229,169,60,0.4)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg md:text-xl font-bold tracking-widest gold-gradient-text uppercase leading-none">
              Savage Gentlemen
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/50 font-mono mt-0.5">
              Caribbean Nocturne
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
          {[
            { href: "/", label: "Home" },
            { href: "/magazine", label: "Magazine", isSpecial: true },
            { href: "/shop", label: "Shop" },
            { href: "/media", label: "Media & Mixes" },
            { href: "/events", label: "Events" },
            { href: "/passport", label: "Soca Passport" },
            { href: "/guyana2027", label: "🇬🇾 Guyana '27", isSpecial: true },
            { href: "/apps", label: "Apps & AI" },
            { href: "/live", label: "Live Stream" },
          ].map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs uppercase font-semibold tracking-wider transition-all duration-200",
                  isActive
                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/40 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/5",
                  link.isSpecial && !isActive && "text-gold-400/90 hover:text-gold-300"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Reality Shift Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* REALITY SHIFT TOGGLE BUTTON */}
          <button
            onClick={handleRealityShift}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all duration-300 shadow-md",
              isVoidMode
                ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:bg-cyan-500/25"
                : "bg-gold-500/10 border-gold-500/40 text-gold-300 shadow-[0_0_15px_rgba(229,169,60,0.2)] hover:bg-gold-500/20"
            )}
            title="Toggle between Main Stage and The Void // Apps Matrix"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              isVoidMode ? "bg-cyan-400 animate-pulse" : "bg-gold-400 animate-ping"
            )} />
            <span className="hidden sm:inline font-mono text-[11px]">
              {isVoidMode ? "⚡ RETURN TO STAGE" : "⚡ THE VOID // APPS"}
            </span>
            <span className="sm:hidden font-mono text-[10px]">
              {isVoidMode ? "STAGE" : "APPS"}
            </span>
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full ring-1 ring-gold-500/30 hover:ring-gold-400 p-0.5 hover:bg-transparent"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.displayName || user.username || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-gold-600 text-black font-bold text-xs">
                      {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 glass-obsidian-strong border border-gold-500/30 text-white rounded-xl shadow-2xl p-1.5"
              >
                <DropdownMenuLabel className="p-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gold-300 truncate">
                      {user.displayName || user.username || "Member"}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono mt-0.5">
                      {user.role === "admin" ? "🛡️ SYSTEM ADMIN" : "🎫 SOCA PASSPORT HOLDER"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="focus:bg-gold-500/15 focus:text-gold-300 rounded-lg cursor-pointer text-xs" asChild>
                  <Link href="/my-tickets" className="flex items-center gap-2 w-full p-2">
                    <Ticket className="w-4 h-4 text-gold-400" />
                    <span>My Ticket Vault</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gold-500/15 focus:text-gold-300 rounded-lg cursor-pointer text-xs" asChild>
                  <Link href="/passport" className="flex items-center gap-2 w-full p-2">
                    <Compass className="w-4 h-4 text-gold-400" />
                    <span>Soca Passport & Stamps</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gold-500/15 focus:text-gold-300 rounded-lg cursor-pointer text-xs" asChild>
                  <Link href="/profile" className="flex items-center gap-2 w-full p-2">
                    <User className="w-4 h-4 text-gold-400" />
                    <span>Account Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-amber-500/15 focus:text-amber-300 rounded-lg cursor-pointer text-xs" asChild>
                  <Link href="/guyana2027" className="flex items-center gap-2 w-full p-2">
                    <span className="text-xs">🇬🇾</span>
                    <span>Guyana Carnival '27 Hub</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="focus:bg-purple-500/15 focus:text-purple-300 rounded-lg cursor-pointer text-xs" asChild>
                      <Link href="/admin" className="flex items-center gap-2 w-full p-2">
                        <LayoutDashboard className="w-4 h-4 text-purple-400" />
                        <span>Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="focus:bg-red-500/15 focus:text-red-300 rounded-lg cursor-pointer text-xs p-2 text-red-400 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={onProfileClick}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-full shadow-md shadow-gold-500/20"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
