import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Zap, Database, Globe, Server, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface PerformanceMetrics {
  pageLoadTimes: Array<{ page: string; avgTime: number; p95: number; p99: number }>;
  apiResponseTimes: Array<{ endpoint: string; avgTime: number; p95: number; p99: number }>;
  errorRates: Array<{ endpoint: string; errorRate: number; errorCount: number; totalRequests: number }>;
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  databasePerformance: {
    avgQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
    cacheHitRate: number;
  };
  realTimeMetrics: Array<{ timestamp: string; responseTime: number; errorRate: number; throughput: number }>;
}

export const PerformanceMonitor: React.FC = () => {
  const [isRealTime, setIsRealTime] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  const { data: metrics, isLoading, error } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/analytics/performance', selectedTimeRange],
    refetchInterval: isRealTime ? 5000 : 30000,
  });

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'critical', color: 'text-red-600', icon: XCircle };
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load performance metrics. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Monitor</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={isRealTime ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            <Activity className="h-4 w-4 mr-1" />
            Real-time
          </Button>
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-semibold">{formatUptime(metrics?.systemHealth.uptime || 0)}</p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
            <Badge variant="secondary" className="mt-2">
              {((metrics?.systemHealth.uptime || 0) / 86400 * 100).toFixed(1)}% this month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-lg font-semibold">{metrics?.systemHealth.memoryUsage || 0}%</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={metrics?.systemHealth.memoryUsage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-lg font-semibold">{metrics?.systemHealth.cpuUsage || 0}%</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={metrics?.systemHealth.cpuUsage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Connections</p>
                <p className="text-lg font-semibold">{metrics?.systemHealth.activeConnections || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
            <Badge variant="outline" className="mt-2">
              Normal load
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Tabs */}
      <Tabs defaultValue="response-times" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="response-times">Response Times</TabsTrigger>
          <TabsTrigger value="error-rates">Error Rates</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="real-time">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="response-times" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Load Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.pageLoadTimes?.map((page, index) => {
                    const health = getHealthStatus(page.avgTime, { good: 1000, warning: 3000 });
                    const HealthIcon = health.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <HealthIcon className={`h-4 w-4 ${health.color}`} />
                          <span className="font-medium">{page.page}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatDuration(page.avgTime)}</p>
                          <p className="text-xs text-muted-foreground">
                            P95: {formatDuration(page.p95)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.apiResponseTimes?.map((api, index) => {
                    const health = getHealthStatus(api.avgTime, { good: 200, warning: 1000 });
                    const HealthIcon = health.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <HealthIcon className={`h-4 w-4 ${health.color}`} />
                          <span className="font-medium text-sm">{api.endpoint}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatDuration(api.avgTime)}</p>
                          <p className="text-xs text-muted-foreground">
                            P95: {formatDuration(api.p95)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="error-rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rates by Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.errorRates?.map((endpoint, index) => {
                  const health = getHealthStatus(endpoint.errorRate, { good: 1, warning: 5 });
                  const HealthIcon = health.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <HealthIcon className={`h-4 w-4 ${health.color}`} />
                        <span className="font-medium">{endpoint.endpoint}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{endpoint.errorRate.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {endpoint.errorCount} / {endpoint.totalRequests} requests
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Average Query Time</span>
                  <span className="font-semibold">
                    {formatDuration(metrics?.databasePerformance.avgQueryTime || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Slow Queries</span>
                  <Badge variant={metrics?.databasePerformance.slowQueries ? 'destructive' : 'secondary'}>
                    {metrics?.databasePerformance.slowQueries || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cache Hit Rate</span>
                  <span className="font-semibold">
                    {metrics?.databasePerformance.cacheHitRate || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Pool Usage</span>
                    <span>{metrics?.databasePerformance.connectionPoolUsage || 0}%</span>
                  </div>
                  <Progress value={metrics?.databasePerformance.connectionPoolUsage || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics?.realTimeMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="responseTime" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="throughput" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};