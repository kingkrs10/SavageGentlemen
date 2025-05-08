import { Search, User, LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <img src={LogoSvg} alt="Savage Gentlemen Logo" className="h-10 w-10" />
          <h1 className="ml-2 text-2xl font-heading text-white">
            SAVAGE GENTLEMEN
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary rounded-full transition"
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user.displayName} {user.isGuest && "(Guest)"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary rounded-full transition"
              onClick={onProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
