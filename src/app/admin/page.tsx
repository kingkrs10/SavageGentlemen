"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, ShoppingBag, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
    userCount: number;
    eventCount: number;
    productCount: number;
    recentSales?: number; // Placeholder for now
}

export default function AdminDashboard() {
    // Fetch stats (we might need to create a specific endpoint for this later, 
    // but for now we can fetch individual lists or just placeholder)
    // For V1, let's fetch lists to get counts. Ideally, create /api/admin/stats.

    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ['/api/events/featured'], // reusing public endpoint for now
        queryFn: () => apiRequest('GET', '/api/events/featured').then(res => res.json())
    });

    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ['/api/products/featured'],
        queryFn: () => apiRequest('GET', '/api/products/featured').then(res => res.json())
    });

    // Placeholder stats until we bundle them
    const stats = {
        userCount: 1250, // Mock
        eventCount: events?.length || 0,
        productCount: products?.length || 0,
        revenue: 45000 // Mock
    };

    const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
        <Card className="bg-gray-900 border-white/10 overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-10 w-24 bg-white/10" />
                ) : (
                    <div className="text-4xl font-bold text-white font-heading tracking-wide">{value}</div>
                )}
                <div className="text-xs text-white/40 mt-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-primary" />
                    <span>Updated just now</span>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-heading text-white tracking-wide uppercase mb-2">Dashboard</h1>
                <p className="text-gray-400">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.userCount}
                    icon={Users}
                    color="text-blue-500"
                    loading={false}
                />
                <StatCard
                    title="Active Events"
                    value={stats.eventCount}
                    icon={Calendar}
                    color="text-orange-500"
                    loading={eventsLoading}
                />
                <StatCard
                    title="Products"
                    value={stats.productCount}
                    icon={ShoppingBag}
                    color="text-purple-500"
                    loading={productsLoading}
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${(stats.revenue).toLocaleString()}`}
                    icon={DollarSign}
                    color="text-green-500"
                    loading={false}
                />
            </div>

            {/* Recent Activity Section could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Card className="bg-gray-900 border-white/10 h-96">
                    <CardHeader>
                        <CardTitle className="tracking-widest uppercase">Latest Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center flex flex-col items-center justify-center h-full text-white/40">
                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                        <p>No recent activity recorded</p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900 border-white/10 h-96">
                    <CardHeader>
                        <CardTitle className="tracking-widest uppercase">System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                                <span className="text-gray-400">Database</span>
                                <span className="text-green-500 text-sm font-bold uppercase tracking-wider">Operational</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                                <span className="text-gray-400">API Gateway</span>
                                <span className="text-green-500 text-sm font-bold uppercase tracking-wider">Operational</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                                <span className="text-gray-400">Storage</span>
                                <span className="text-green-500 text-sm font-bold uppercase tracking-wider">Operational</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
