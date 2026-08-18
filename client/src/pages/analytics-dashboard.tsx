import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import {
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { BarChartIcon, CalendarIcon, LineChartIcon, PieChartIcon, TrendingUpIcon, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const COLORS = ['#E5A93C', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#D97706'];

type TabType = "overview" | "events" | "products" | "users";

interface AnalyticsData {
  totalPageViews: number;
  totalEventViews: number;
  totalProductViews: number;
  totalTicketSales: number;
  totalProductClicks: number;
  totalRevenue: string;
  totalNewUsers: number;
  totalActiveUsers: number;
  last7Days: {
    pageViews: number;
    eventViews: number;
    productViews: number;
    ticketSales: number;
    productClicks: number;
    revenue: string;
    newUsers: number;
    activeUsers: number;
  };
  dailyData: Array<{
    date: string;
    pageViews: number;
    eventViews: number;
    productViews: number;
    ticketSales: number;
    productClicks: number;
    revenue: number;
    newUsers: number;
    activeUsers: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics", "dashboard", dateRange],
    queryFn: async () => {
      const startDateStr = dateRange.start.toISOString().split('T')[0];
      const endDateStr = dateRange.end.toISOString().split('T')[0];
      
      const response = await fetch(`/api/analytics/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !data) {
    toast({
      title: "Error fetching analytics data",
      description: (error as Error)?.message || "An unknown error occurred",
      variant: "destructive",
    });
    
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const pieData = [
    { name: "Event Views", value: data.totalEventViews },
    { name: "Product Views", value: data.totalProductViews },
    { name: "Ticket Sales", value: data.totalTicketSales },
    { name: "Product Clicks", value: data.totalProductClicks },
  ];

  const formattedDailyData = data.dailyData.map(day => ({
    ...day,
    date: format(new Date(day.date), "MMM dd"),
  }));

  return (
    <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      <SEOHead 
        title="Analytics & Telemetry - Savage Gentlemen Executive Control" 
        description="Comprehensive real-time telemetry, ticket conversion, and audience analytics." 
      />

      {/* ── LUXURY HERO ── */}
      <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              EXECUTIVE TELEMETRY & CONVERSION
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time telemetry on page views, ticket sales, viral ad CTRs, and member engagement.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 inline-flex items-center rounded-xl font-mono text-xs">
                  <CalendarIcon className="mr-2 h-4 w-4 text-gold-400" />
                  {format(dateRange.start, "MMM dd, yyyy")} - {format(dateRange.end, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-obsidian-card border border-gold-500/30 text-white rounded-2xl shadow-2xl">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.start}
                  selected={{
                    from: dateRange.start,
                    to: dateRange.end,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ start: range.from, end: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="flex flex-wrap w-full md:w-auto bg-white/5 border border-white/10 p-1.5 gap-1.5 rounded-2xl backdrop-blur-md mb-6">
          <TabsTrigger 
            value="overview"
            className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="events"
            className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
          >
            Events
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
          >
            Products
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="rounded-xl px-5 py-2 text-xs font-mono font-bold tracking-wider text-gray-300 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-500 data-[state=active]:to-amber-400 data-[state=active]:text-obsidian data-[state=active]:shadow-lg data-[state=active]:shadow-gold-500/20"
          >
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalPageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.pageViews.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">
                    {data.last7Days.pageViews > 0 ? `+${((data.last7Days.pageViews / data.totalPageViews) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${parseFloat(data.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: ${parseFloat(data.last7Days.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">
                    {parseFloat(data.totalRevenue) > 0 ? `+${((parseFloat(data.last7Days.revenue) / parseFloat(data.totalRevenue)) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalTicketSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.ticketSales.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">
                    {data.totalTicketSales > 0 ? `+${((data.last7Days.ticketSales / data.totalTicketSales) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalActiveUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  New users (7d): {data.last7Days.newUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">
                    {data.totalActiveUsers > 0 ? `+${((data.last7Days.newUsers / data.totalActiveUsers) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Page Views Over Time</CardTitle>
                <CardDescription>Daily page view trends over the selected time period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="pageViews" 
                        name="Page Views"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Distribution</CardTitle>
                <CardDescription>View distribution across features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        nameKey="name"
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and User Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#00C49F" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>New vs active users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="newUsers" name="New Users" fill="#8884D8" />
                      <Bar dataKey="activeUsers" name="Active Users" fill="#82CA9D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Event Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalEventViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.eventViews.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalTicketSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.ticketSales.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalEventViews > 0
                    ? ((data.totalTicketSales / data.totalEventViews) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Event views to ticket sales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Event Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Views Trend</CardTitle>
                <CardDescription>Daily event views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="eventViews" 
                        name="Event Views"
                        stroke="#8884d8" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Sales Trend</CardTitle>
                <CardDescription>Daily ticket sales over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="ticketSales" 
                        name="Ticket Sales" 
                        fill="#00C49F" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Product Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalProductViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.productViews.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Product Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalProductClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.productClicks.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Click-through Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalProductViews > 0
                    ? ((data.totalProductClicks / data.totalProductViews) * 100).toFixed(2) + "%"
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Product views to clicks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Views Trend</CardTitle>
                <CardDescription>Daily product views over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="productViews" 
                        name="Product Views"
                        stroke="#FFBB28" 
                        fill="#FFBB28" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Clicks Trend</CardTitle>
                <CardDescription>Daily product clicks over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="productClicks" 
                        name="Product Clicks"
                        stroke="#FF8042" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalNewUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All registered users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalActiveUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-guest users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalNewUsers > 0
                    ? ((data.totalActiveUsers / data.totalNewUsers) * 100).toFixed(1) + "%"
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active user percentage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>New Users Trend</CardTitle>
                <CardDescription>Daily new user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="newUsers" 
                        name="New Users" 
                        fill="#8884D8" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Overview</CardTitle>
                <CardDescription>Active vs new users comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="newUsers" 
                        name="New Users"
                        stackId="1"
                        stroke="#8884D8" 
                        fill="#8884D8" 
                        fillOpacity={0.6} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="activeUsers" 
                        name="Active Users"
                        stackId="1"
                        stroke="#82CA9D" 
                        fill="#82CA9D" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;