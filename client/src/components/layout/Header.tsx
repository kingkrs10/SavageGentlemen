import { Search, User, LogOut, LayoutDashboard, Ticket, Settings, MoreVertical } from "lucide-react";
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
import LogoImage from "@/assets/SGFLYERLOGO.png";
import { useUser } from "@/context/UserContext";

interface HeaderProps {
  user: UserType | null;
  onProfileClick: () => void;
  onLogout: () => void;
}

const Header = ({ user: propUser, onProfileClick, onLogout }: HeaderProps) => {
  // Get user from context if not provided as prop
  const { user: contextUser, logout } = useUser();
  // Use prop user if available, otherwise use context user
  const user = propUser || contextUser;
  
  // Use context logout if no handler provided
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 dark:bg-black dark:border-white/10 light:bg-white light:border-black/10">
      <div className="container mx-auto px-4 flex flex-col">
        {/* Desktop Menu Above Logo - Hidden on Mobile */}
        <div className="hidden md:flex justify-center py-4 text-sm">
          <nav className="flex space-x-8">
            <a href="/" className="uppercase dark:text-white light:text-foreground hover:text-primary font-semibold tracking-widest">Home</a>
            <a href="/events" className="uppercase dark:text-white light:text-foreground hover:text-primary font-semibold tracking-widest">Events</a>
            <a href="/shop" className="uppercase dark:text-white light:text-foreground hover:text-primary font-semibold tracking-widest">Shop</a>
            <a href="/live" className="uppercase dark:text-white light:text-foreground hover:text-primary font-semibold tracking-widest">Live</a>
            <a href="/community" className="uppercase dark:text-white light:text-foreground hover:text-primary font-semibold tracking-widest">Community</a>
          </nav>
        </div>
        
        {/* Logo and User Controls */}
        <div className="py-3 flex justify-between items-center border-t dark:border-white/10 light:border-black/10">
          <div className="flex items-center">
            <img src={LogoImage} alt="Savage Gentlemen Logo" className="h-12 w-auto" />
            <h1 className="ml-2 text-xl md:text-2xl font-heading dark:text-white light:text-foreground tracking-widest truncate max-w-[180px] sm:max-w-none">
              SAVAGE GENTLEMEN
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle variant="ghost" size="icon" />
            
            <Button
              variant="ghost"
              size="icon"
              className="dark:text-white light:text-foreground hover:text-primary transition"
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
                    <Avatar className="h-8 w-8 ring-1 dark:ring-white/20 light:ring-black/20">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.displayName || user.username || "Logged In"} />
                      ) : null}
                      <AvatarFallback>
                        {user.displayName 
                          ? user.displayName.charAt(0).toUpperCase()
                          : user.username
                            ? user.username.charAt(0).toUpperCase()
                            : "U"
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-black dark:border-white/10 light:bg-white light:border-black/10">
                  <DropdownMenuLabel className="uppercase text-xs tracking-widest">
                    {user.displayName || user.username || "Logged In"} {user.isGuest && "(Guest)"}
                    {user.role === "admin" && " (Admin)"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-white/10 light:bg-black/10" />
                  <DropdownMenuItem 
                      className="dark:hover:bg-white/5 dark:focus:bg-white/5 light:hover:bg-black/5 light:focus:bg-black/5"
                      asChild
                    >
                      <a href="/my-tickets">
                        <Ticket className="mr-2 h-4 w-4" />
                        <span className="uppercase text-xs tracking-widest">My Tickets</span>
                      </a>
                    </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-white/10 light:bg-black/10" />
                  
                  {/* Always show admin link for testing */}
                  <DropdownMenuItem 
                    className="dark:hover:bg-white/5 dark:focus:bg-white/5 light:hover:bg-black/5 light:focus:bg-black/5"
                    asChild
                  >
                    <a href="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span className="uppercase text-xs tracking-widest">Admin Dashboard</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-white/10 light:bg-black/10" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="dark:hover:bg-white/5 dark:focus:bg-white/5 light:hover:bg-black/5 light:focus:bg-black/5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="uppercase text-xs tracking-widest">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="dark:text-white light:text-foreground hover:text-primary hover:bg-transparent uppercase text-xs tracking-widest px-4 py-2"
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
