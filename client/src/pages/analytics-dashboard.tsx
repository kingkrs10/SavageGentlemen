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
import { BarChartIcon, CalendarIcon, LineChartIcon, PieChartIcon, TrendingUpIcon } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#00A876', '#FF6347', '#4B0082'];

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
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Analytics Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.start, "MMM dd, yyyy")} - {format(dateRange.end, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid w-full grid-cols-4 md:w-[400px] mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalNewUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.newUsers.toLocaleString()}
                </p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Product Views</CardTitle>
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
                  Views to clicks ratio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Metrics Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Views and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedDailyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="productViews" 
                      name="Product Views"
                      stroke="#8884d8" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productClicks" 
                      name="Product Clicks"
                      stroke="#00C49F" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalNewUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {data.last7Days.newUsers.toLocaleString()}
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
                  Last 7 days: {data.last7Days.activeUsers.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue per User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.totalActiveUsers > 0
                    ? (parseFloat(data.totalRevenue) / data.totalActiveUsers).toFixed(2)
                    : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average revenue per active user
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trend</CardTitle>
              <CardDescription>New and active users over time</CardDescription>
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
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3} 
                      stackId="1"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      name="Active Users"
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      fillOpacity={0.3} 
                      stackId="2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;