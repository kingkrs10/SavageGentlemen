"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  ShoppingBag, 
  Ticket, 
  CreditCard,
  Plus,
  ArrowRight,
  Activity,
  Zap,
  TrendingUp,
  Scan
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  href: string;
  color: string;
  index: number;
}

const StatCard = ({ title, value, icon: Icon, description, href, color, index }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
  >
    <Link href={href}>
      <Card className="bg-gray-900/50 border-white/5 hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-300 transition-colors">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-opacity-10 ')} text-white`}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-heading tracking-tighter text-white mb-1">{value}</div>
          <p className="text-xs text-gray-500 font-medium">{description}</p>
          <div className="mt-4 flex items-center text-[10px] text-primary font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            View Details <ArrowRight className="ml-1 w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

export function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    orders: 0,
    tiers: 0,
    products: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // In a real app, we'd have a single /api/admin/stats endpoint
        // For now, we fetch from individual endpoints and take the counts
        const [usersRes, eventsRes, ordersRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/events"),
          fetch("/api/admin/orders").catch(() => ({ json: () => [] })) // Fallback if route missing
        ]);

        const usersData = await usersRes.json();
        const eventsData = await eventsRes.json();
        const ordersData = ordersRes.ok ? await ordersRes.json() : [];

        setStats({
          users: usersData.length || 0,
          events: eventsData.length || 0,
          orders: ordersData.length || 0,
          tiers: eventsData.reduce((acc: number, event: any) => acc + (event.tickets?.length || 0), 0),
          products: 0 // Placeholder
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.users, icon: Users, description: "Registered platform users", href: "/admin/users", color: "bg-blue-500" },
    { title: "Active Events", value: stats.events, icon: Calendar, description: "Upcoming & past events", href: "/admin/events", color: "bg-orange-500" },
    { title: "Total Orders", value: stats.orders, icon: CreditCard, description: "Completed transactions", href: "/admin/orders", color: "bg-green-500" },
    { title: "Ticket Tiers", value: stats.tiers, icon: Ticket, description: "Unique tier definitions", href: "/admin/tickets", color: "bg-purple-500" },
    { title: "Soca Products", value: stats.products, icon: ShoppingBag, description: "Marketplace items", href: "/admin/products", color: "bg-pink-500" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Platform Command Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading text-white uppercase tracking-tighter">
            Dashboard <span className="text-primary italic">Overview</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            At-a-glance metrics and quick controls for your entire event ecosystem.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/events?action=new">
            <Button className="bg-primary hover:bg-orange-600 text-white font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl">
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-gray-900/40 border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          <h3 className="text-xl font-heading text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "New Product", icon: ShoppingBag, href: "/admin/products?action=new" },
              { label: "Scan Tickets", icon: Scan, href: "/admin/scanner" },
              { label: "View Orders", icon: CreditCard, href: "/admin/orders" },
              { label: "Ads Manager", icon: Target, href: "/admin/ads" },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="ghost" className="w-full flex flex-col items-center justify-center gap-3 h-32 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-gray-300 hover:text-white">
                  <action.icon className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="bg-gray-900/40 border-white/5 p-8 rounded-3xl relative overflow-hidden">
          <h3 className="text-xl font-heading text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Platform Stats
          </h3>
          <div className="space-y-6">
            {[
              { label: "User Growth", value: "+12%", status: "up" },
              { label: "Ticket Sales", value: "84%", status: "stable" },
              { label: "Active Streams", value: "3", status: "live" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-heading text-white">{stat.value}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                    stat.status === 'up' ? "bg-green-500" : stat.status === 'live' ? "bg-primary animate-pulse" : "bg-blue-500"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
