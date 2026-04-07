import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  PackageOpen,
  Radio,
  Music,
  Image as ImageIcon,
  Megaphone,
  Users,
  Stamp,
  ScanLine,
  ShoppingCart,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "events", label: "Events", icon: Calendar },
      { id: "tickets", label: "Tickets", icon: Ticket },
      { id: "products", label: "Products", icon: PackageOpen },
    ],
  },
  {
    label: "Media",
    items: [
      { id: "livestreams", label: "Livestreams", icon: Radio },
      { id: "musicmixes", label: "Music Mixes", icon: Music },
      { id: "media", label: "Media Library", icon: ImageIcon },
      { id: "ads", label: "Advertisements", icon: Megaphone },
    ],
  },
  {
    label: "People",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "passport", label: "Passport", icon: Stamp },
      { id: "scanner", label: "Scanner", icon: ScanLine },
    ],
  },
  {
    label: "Commerce",
    items: [
      { id: "orders", label: "Orders", icon: ShoppingCart },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  stats?: {
    totalUsers: number;
    totalEvents: number;
    totalOrders: number;
    totalProducts: number;
  };
}

// Desktop sidebar nav item
const SidebarNavItem = ({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        "hover:bg-white/10",
        isActive
          ? "bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border-l-2 border-orange-500 shadow-sm"
          : "text-slate-400 hover:text-white border-l-2 border-transparent",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-orange-400" : "text-slate-500")} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
};

// Desktop sidebar
const DesktopSidebar = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) => (
  <aside
    className={cn(
      "hidden lg:flex flex-col bg-[#0d1321] border-r border-slate-800 h-[calc(100vh-80px)] sticky top-20 transition-all duration-300",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}
  >
    {/* Collapse toggle */}
    <div className="flex items-center justify-end p-2 border-b border-slate-800/50">
      <button
        onClick={onToggleCollapse}
        className="p-1.5 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>

    <ScrollArea className="flex-1 py-3">
      <nav className="px-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
            )}
            {collapsed && group.label !== "Overview" && (
              <div className="mx-auto w-6 h-px bg-slate-800 mb-3" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  collapsed={!!collapsed}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </ScrollArea>
  </aside>
);

// Mobile sidebar (sheet)
const MobileSidebar = ({
  activeTab,
  onTabChange,
}: Pick<AdminSidebarProps, "activeTab" | "onTabChange">) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  // Find current active item label
  const activeItem = navGroups
    .flatMap((g) => g.items)
    .find((i) => i.id === activeTab);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-slate-700 bg-[#0d1321] text-white hover:bg-white/10">
            <Menu className="h-4 w-4" />
            <span>{activeItem?.label || "Menu"}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] bg-[#0d1321] border-r border-slate-800 p-0">
          <SheetHeader className="p-4 border-b border-slate-800">
            <SheetTitle className="text-white text-lg">Admin Navigation</SheetTitle>
            <SheetDescription className="text-slate-400 text-sm">
              Manage your platform
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)]">
            <nav className="p-3 space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <SidebarNavItem
                        key={item.id}
                        item={item}
                        isActive={activeTab === item.id}
                        collapsed={false}
                        onClick={() => handleSelect(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export { DesktopSidebar, MobileSidebar, navGroups };
export type { AdminSidebarProps };
