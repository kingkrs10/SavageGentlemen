import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RefreshCw, Database, HardDrive, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatBytes, formatDuration } from '@/lib/utils';

interface CacheStats {
  totalSize: number;
  usedSize: number;
  hitRate: number;
  missRate: number;
  entries: number;
  oldestEntry: Date;
  newestEntry: Date;
}

interface CacheEntry {
  key: string;
  size: number;
  lastAccessed: Date;
  hitCount: number;
  expiry: Date | null;
  type: 'query' | 'image' | 'api' | 'static';
}

export const CacheManager: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: cacheStats, isLoading, refetch } = useQuery<CacheStats>({
    queryKey: ['/api/cache/stats'],
    refetchInterval: 30000,
  });

  const { data: cacheEntries } = useQuery<CacheEntry[]>({
    queryKey: ['/api/cache/entries'],
    refetchInterval: 30000,
  });

  const clearAllCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      queryClient.clear();
      refetch();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const clearSelectedCache = async () => {
    try {
      await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: selectedKeys })
      });
      queryClient.removeQueries({ queryKey: selectedKeys });
      setSelectedKeys([]);
      refetch();
    } catch (error) {
      console.error('Failed to clear selected cache:', error);
    }
  };

  const optimizeCache = async () => {
    try {
      await fetch('/api/cache/optimize', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Failed to optimize cache:', error);
    }
  };

  const getCacheHealthStatus = () => {
    if (!cacheStats) return { status: 'unknown', color: 'gray' };
    
    const usagePercentage = (cacheStats.usedSize / cacheStats.totalSize) * 100;
    const hitRate = cacheStats.hitRate;
    
    if (usagePercentage > 90 || hitRate < 50) {
      return { status: 'critical', color: 'red' };
    } else if (usagePercentage > 70 || hitRate < 70) {
      return { status: 'warning', color: 'yellow' };
    } else {
      return { status: 'healthy', color: 'green' };
    }
  };

  const groupedEntries = cacheEntries?.reduce((groups, entry) => {
    if (!groups[entry.type]) {
      groups[entry.type] = [];
    }
    groups[entry.type].push(entry);
    return groups;
  }, {} as Record<string, CacheEntry[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthStatus = getCacheHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cache Manager</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={healthStatus.color === 'green' ? 'default' : 'destructive'}>
            {healthStatus.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={optimizeCache}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Optimize
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAllCache}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Health Alert */}
      {healthStatus.status === 'critical' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cache usage is critically high or hit rate is low. Consider clearing old entries or optimizing cache settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Usage</p>
                <p className="text-lg font-semibold">
                  {formatBytes(cacheStats?.usedSize || 0)} / {formatBytes(cacheStats?.totalSize || 0)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={cacheStats ? (cacheStats.usedSize / cacheStats.totalSize) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hit Rate</p>
                <p className="text-lg font-semibold">{cacheStats?.hitRate?.toFixed(1) || 0}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {cacheStats?.missRate?.toFixed(1) || 0}% misses
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-lg font-semibold">{cacheStats?.entries || 0}</p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(groupedEntries || {}).length} categories
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oldest Entry</p>
                <p className="text-lg font-semibold">
                  {cacheStats?.oldestEntry ? formatDuration(Date.now() - new Date(cacheStats.oldestEntry).getTime()) : 'N/A'}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ago
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Entries */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="query">Query Cache</TabsTrigger>
          <TabsTrigger value="image">Image Cache</TabsTrigger>
          <TabsTrigger value="api">API Cache</TabsTrigger>
          <TabsTrigger value="static">Static Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(groupedEntries || {}).map(([type, entries]) => {
                  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
                  const percentage = cacheStats ? (totalSize / cacheStats.usedSize) * 100 : 0;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-medium">{type}</span>
                        <div className="text-right">
                          <span className="font-semibold">{formatBytes(totalSize)}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({entries.length} entries)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total cache
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(groupedEntries || {}).map(([type, entries]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize">{type} Cache Entries</CardTitle>
                {selectedKeys.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearSelectedCache}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Selected ({selectedKeys.length})
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div 
                      key={entry.key}
                      className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        selectedKeys.includes(entry.key) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedKeys(prev => 
                          prev.includes(entry.key) 
                            ? prev.filter(k => k !== entry.key)
                            : [...prev, entry.key]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{entry.key}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>Size: {formatBytes(entry.size)}</span>
                            <span>Hits: {entry.hitCount}</span>
                            <span>
                              Last accessed: {formatDuration(Date.now() - new Date(entry.lastAccessed).getTime())} ago
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {entry.expiry && (
                            <Badge variant="outline" className="text-xs">
                              Expires: {formatDuration(new Date(entry.expiry).getTime() - Date.now())}
                            </Badge>
                          )}
                          <input
                            type="checkbox"
                            checked={selectedKeys.includes(entry.key)}
                            readOnly
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};