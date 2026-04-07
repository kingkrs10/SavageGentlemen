import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Eye,
  DollarSign,
  Activity,
} from "lucide-react";

interface AdminOverviewProps {
  usersCount: number;
  eventsCount: number;
  ordersCount: number;
  ticketsCount: number;
  productsCount: number;
  onNavigate: (tab: string) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, iconColor, onClick }: StatCardProps) => (
  <Card
    className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 border-slate-800 bg-[#0d1321] group`}
    onClick={onClick}
  >
    <div className={`absolute inset-0 opacity-10 ${gradient}`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
      <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-lg bg-white/5`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </CardHeader>
    <CardContent className="relative">
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

const AdminOverview: React.FC<AdminOverviewProps> = ({
  usersCount,
  eventsCount,
  ordersCount,
  ticketsCount,
  productsCount,
  onNavigate,
}) => {
  const stats: StatCardProps[] = [
    {
      title: "Total Users",
      value: usersCount,
      subtitle: "Registered accounts",
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
      iconColor: "text-blue-400",
      onClick: () => onNavigate("users"),
    },
    {
      title: "Events",
      value: eventsCount,
      subtitle: "Active events",
      icon: Calendar,
      gradient: "bg-gradient-to-br from-orange-500 to-orange-700",
      iconColor: "text-orange-400",
      onClick: () => onNavigate("events"),
    },
    {
      title: "Orders",
      value: ordersCount,
      subtitle: "Total orders placed",
      icon: ShoppingCart,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      iconColor: "text-emerald-400",
      onClick: () => onNavigate("orders"),
    },
    {
      title: "Ticket Tiers",
      value: ticketsCount,
      subtitle: "Available ticket types",
      icon: Ticket,
      gradient: "bg-gradient-to-br from-purple-500 to-purple-700",
      iconColor: "text-purple-400",
      onClick: () => onNavigate("tickets"),
    },
    {
      title: "Products",
      value: productsCount,
      subtitle: "In merchandise store",
      icon: DollarSign,
      gradient: "bg-gradient-to-br from-pink-500 to-pink-700",
      iconColor: "text-pink-400",
      onClick: () => onNavigate("products"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0d1321] via-[#141e2e] to-[#0d1321] border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Activity className="h-5 w-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          </div>
          <p className="text-slate-400 max-w-lg">
            Manage your platform from here. Click any card below to jump to that section.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-800 bg-[#0d1321]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Create Event", tab: "events", color: "text-orange-400" },
              { label: "Manage Users", tab: "users", color: "text-blue-400" },
              { label: "View Orders", tab: "orders", color: "text-emerald-400" },
              { label: "Scan Tickets", tab: "scanner", color: "text-purple-400" },
            ].map((action) => (
              <button
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
              >
                <span className={`text-sm font-medium ${action.color}`}>
                  {action.label}
                </span>
                <span className="text-slate-600 group-hover:text-slate-400 text-xs">→</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-[#0d1321]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg text-white">Platform Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Events Active", value: eventsCount, color: "bg-orange-500" },
              { label: "Users Registered", value: usersCount, color: "bg-blue-500" },
              { label: "Ticket Tiers", value: ticketsCount, color: "bg-purple-500" },
              { label: "Products Listed", value: productsCount, color: "bg-pink-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-slate-400">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
