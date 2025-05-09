import { Search, User, LogOut, LayoutDashboard, Ticket } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
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
import LogoSvg from "@/assets/logo.svg";

interface HeaderProps {
  user: UserType | null;
  onProfileClick: () => void;
  onLogout: () => void;
}

const Header = ({ user, onProfileClick, onLogout }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="container mx-auto px-4 flex flex-col">
        {/* Desktop Menu Above Logo - Hidden on Mobile */}
        <div className="hidden md:flex justify-center py-4 text-sm">
          <nav className="flex space-x-8">
            <a href="/" className="uppercase text-white hover:text-primary font-semibold tracking-widest">Home</a>
            <a href="/events" className="uppercase text-white hover:text-primary font-semibold tracking-widest">Events</a>
            <a href="/shop" className="uppercase text-white hover:text-primary font-semibold tracking-widest">Shop</a>
            <a href="/live" className="uppercase text-white hover:text-primary font-semibold tracking-widest">Live</a>
            <a href="/community" className="uppercase text-white hover:text-primary font-semibold tracking-widest">Community</a>
          </nav>
        </div>
        
        {/* Logo and User Controls */}
        <div className="py-3 flex justify-between items-center border-t border-white/10">
          <div className="flex items-center">
            <img src={LogoSvg} alt="Savage Gentlemen Logo" className="h-10 w-10" />
            <h1 className="ml-2 text-xl md:text-2xl font-heading text-white tracking-widest truncate max-w-[180px] sm:max-w-none">
              SAVAGE GENTLEMEN
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-primary transition"
            >
              <Search className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-none hover:bg-transparent hover:text-primary"
                  >
                    <Avatar className="h-8 w-8 ring-1 ring-white/20">
                      <AvatarImage src={user.avatar} alt={user.displayName} />
                      <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black border border-white/10">
                  <DropdownMenuLabel className="uppercase text-xs tracking-widest">
                    {user.displayName} {user.isGuest && "(Guest)"}
                    {user.role === "admin" && " (Admin)"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                      className="hover:bg-white/5 focus:bg-white/5"
                      asChild
                    >
                      <a href="/my-tickets">
                        <Ticket className="mr-2 h-4 w-4" />
                        <span className="uppercase text-xs tracking-widest">My Tickets</span>
                      </a>
                    </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {user.role === "admin" && (
                    <DropdownMenuItem 
                      className="hover:bg-white/5 focus:bg-white/5"
                      asChild
                    >
                      <a href="/admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span className="uppercase text-xs tracking-widest">Admin Dashboard</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && <DropdownMenuSeparator className="bg-white/10" />}
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="hover:bg-white/5 focus:bg-white/5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="uppercase text-xs tracking-widest">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="text-white hover:text-primary hover:bg-transparent uppercase text-xs tracking-widest px-4 py-2"
                onClick={onProfileClick}
              >
                <User className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
