import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  Instagram,
  Eye,
  Heart,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Zap,
  Globe,
  Radio,
  Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  author: string;
  views: number;
  likes: number;
  isPublished: boolean;
  igPosted: boolean;
  igPostId?: string;
  publishedAt: string;
}

interface AutoPosterStatus {
  enabled: boolean;
  postsPerDay: number;
  scheduledSlotsEST: string[];
  lastPostTime: string | null;
  lastPostTitle: string | null;
  lastPostChannel: string | null;
  nextScheduledPostTime: string;
  totalAutoPosted: number;
  isRunning: boolean;
}

export const MagazineAdminManager = () => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [isTriggeringAutoPost, setIsTriggeringAutoPost] = useState(false);
  const [isTogglingAutopilot, setIsTogglingAutopilot] = useState(false);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/magazine/articles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/magazine/articles?limit=50");
      return res.json();
    },
  });

  const { data: autopilotStatus, refetch: refetchAutopilot } = useQuery<AutoPosterStatus>({
    queryKey: ["/api/magazine/autopilot/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/magazine/autopilot/status");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const handleSyncFeeds = async () => {
    setIsSyncing(true);
    try {
      const res = await apiRequest("POST", "/api/magazine/admin/sync");
      const data = await res.json();
      toast({
        title: "Autonomous Sync Complete",
        description: data.message || `Processed RSS feeds successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/magazine/articles"] });
      refetchAutopilot();
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err.message || "Failed to trigger RSS sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutopilot = async () => {
    if (!autopilotStatus) return;
    setIsTogglingAutopilot(true);
    try {
      const res = await apiRequest("POST", "/api/magazine/admin/autopilot/toggle", {
        enabled: !autopilotStatus.enabled,
      });
      const data = await res.json();
      toast({
        title: !autopilotStatus.enabled ? "Autopilot Activated 🚀" : "Autopilot Paused ⏸️",
        description: data.message || "Updated schedule settings.",
      });
      refetchAutopilot();
    } catch (err: any) {
      toast({
        title: "Toggle Error",
        description: err.message || "Failed to update autopilot status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingAutopilot(false);
    }
  };

  const handleTriggerAutoPostNow = async () => {
    setIsTriggeringAutoPost(true);
    try {
      const res = await apiRequest("POST", "/api/magazine/admin/autopilot/trigger-now");
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Autonomous Social Post Dispatched!",
          description: data.message || "Next scheduled post broadcasted successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/magazine/articles"] });
        refetchAutopilot();
      } else {
        throw new Error(data.message || "Failed to trigger auto-post");
      }
    } catch (err: any) {
      toast({
        title: "Auto-Post Error",
        description: err.message || "Failed to dispatch auto-post",
        variant: "destructive",
      });
    } finally {
      setIsTriggeringAutoPost(false);
    }
  };

  const handlePublishInstagram = async (articleId: number) => {
    setPublishingId(articleId);
    try {
      const res = await apiRequest("POST", `/api/magazine/admin/publish-ig/${articleId}`);
      const data = await res.json();

      if (data.success) {
        toast({
          title: data.simulated ? "IG Preview Simulated" : "Published to Instagram!",
          description: data.simulated
            ? "Simulated post generated (Make.com webhook handles live distribution)."
            : "Successfully published across social channels.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/magazine/articles"] });
        refetchAutopilot();
      } else {
        throw new Error(data.error || "Failed to publish to Instagram");
      }
    } catch (err: any) {
      toast({
        title: "Instagram Post Error",
        description: err.message || "Failed to post to Instagram",
        variant: "destructive",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await apiRequest("DELETE", `/api/magazine/admin/articles/${articleId}`);
      toast({ title: "Article Deleted", description: "Article removed from magazine." });
      queryClient.invalidateQueries({ queryKey: ["/api/magazine/articles"] });
      refetchAutopilot();
    } catch (err: any) {
      toast({ title: "Delete Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Post-Per-Day Autonomous Social Scheduler Banner */}
      <Card className="border-gold-500/30 bg-gradient-to-br from-obsidian-card via-black to-obsidian-card text-white overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                2 Posts / Day Autopilot
              </div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                Autonomous Social Distribution Engine
              </CardTitle>
              <CardDescription className="text-white/60 text-xs">
                Automatically curates, generates, and broadcasts Caribbean culture dispatches to Instagram, Facebook, YouTube, & TikTok via Make.com.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleToggleAutopilot}
                disabled={isTogglingAutopilot}
                size="sm"
                variant={autopilotStatus?.enabled ? "outline" : "default"}
                className={autopilotStatus?.enabled 
                  ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5" 
                  : "bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs gap-1.5"}
              >
                {autopilotStatus?.enabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause Schedule
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Resume Autopilot
                  </>
                )}
              </Button>

              <Button
                onClick={handleTriggerAutoPostNow}
                disabled={isTriggeringAutoPost}
                size="sm"
                className="bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs gap-1.5 shadow-lg"
              >
                <Zap className={`w-3.5 h-3.5 ${isTriggeringAutoPost ? "animate-spin" : ""}`} />
                {isTriggeringAutoPost ? "Broadcasting..." : "Post Next Story Now"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Schedule Target</span>
            <div className="flex items-center gap-2 font-bold text-sm text-gold-400">
              <Clock className="w-4 h-4 text-gold-400" />
              2 Posts Daily (11 AM & 7 PM EST)
            </div>
            <p className="text-[11px] text-white/60">Midday peak & evening nightlife window</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Next Scheduled Post</span>
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {autopilotStatus?.nextScheduledPostTime || "Calculating..."}
            </div>
            <p className="text-[11px] text-white/60">
              {autopilotStatus?.enabled ? "Autopilot armed & active" : "Autopilot is currently paused"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">AI Reel Engine</span>
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Film className="w-4 h-4 text-pink-400" />
              {autopilotStatus?.videoEngineStatus?.online ? "MoneyPrinterTurbo" : "Local Studio Fallback"}
            </div>
            <p className="text-[11px] text-white/60">
              {autopilotStatus?.videoEngineStatus?.online 
                ? "FastAPI sidecar online (:8080)" 
                : "Standby (Make.com broadcast active)"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Lifetime Auto-Posts</span>
            <div className="flex items-center gap-2 font-bold text-sm text-gold-400">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              {autopilotStatus?.totalAutoPosted ?? 0} Published
            </div>
            <p className="text-[11px] text-white/60 truncate">
              {autopilotStatus?.lastPostTitle ? `Last: "${autopilotStatus.lastPostTitle}"` : "Ready for next trigger"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Magazine & Articles Manager */}
      <Card className="border-gold-500/20 bg-obsidian-card text-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold uppercase tracking-widest mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Editorial Articles & Feeds
            </div>
            <CardTitle className="text-2xl font-bold font-heading text-white">Magazine Articles Library</CardTitle>
            <CardDescription className="text-white/60 text-xs">
              Autonomous RSS feed ingestion and individual article management.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSyncFeeds}
              disabled={isSyncing}
              className="bg-gold-500 hover:bg-gold-400 text-obsidian font-bold text-xs uppercase tracking-wider gap-2 shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Crawling Feeds..." : "Run RSS & AI Crawl Now"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="py-12 text-center text-white/50 animate-pulse">Loading editorial dispatches...</div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
              <BookOpen className="w-12 h-12 text-gold-400/40 mx-auto" />
              <h4 className="font-bold text-white text-lg">No Articles in Database</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Click "Run RSS & AI Crawl Now" to automatically ingest trending stories from Caribbean news feeds.
              </p>
              <Button onClick={handleSyncFeeds} className="bg-gold-500 text-obsidian font-bold text-xs">
                Trigger Initial Ingestion
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 text-white/60">
                    <TableHead className="text-white">Article Title</TableHead>
                    <TableHead className="text-white">Category</TableHead>
                    <TableHead className="text-white">Views</TableHead>
                    <TableHead className="text-white">Likes</TableHead>
                    <TableHead className="text-white">Social Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map(article => (
                    <TableRow key={article.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-white line-clamp-1">{article.title}</p>
                          <p className="text-xs text-white/50 line-clamp-1">{article.summary}</p>
                          <span className="text-[10px] font-mono text-white/40 block">
                            Slug: /magazine/{article.slug}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-gold-500/20 text-gold-300 border border-gold-500/40 text-[10px] uppercase font-mono">
                          {article.category}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="flex items-center gap-1 text-xs font-mono text-white/80">
                          <Eye className="w-3.5 h-3.5 text-white/40" /> {article.views}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="flex items-center gap-1 text-xs font-mono text-gold-400">
                          <Heart className="w-3.5 h-3.5 text-gold-400" /> {article.likes}
                        </span>
                      </TableCell>

                      <TableCell>
                        {article.igPosted ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Auto-Posted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-white/40 border-white/20 text-[10px] font-mono">
                            Pending Schedule
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handlePublishInstagram(article.id)}
                            disabled={publishingId === article.id}
                            size="sm"
                            variant="outline"
                            className="border-pink-500/40 text-pink-300 hover:bg-pink-500/10 text-xs font-mono gap-1.5 h-8"
                            title="Broadcast to Socials"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                            {publishingId === article.id ? "Posting..." : "Post Now"}
                          </Button>

                          <a href={`/magazine/${article.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="text-white/60 hover:text-white h-8 w-8 p-0" title="View Article">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>

                          <Button
                            onClick={() => handleDeleteArticle(article.id)}
                            size="sm"
                            variant="ghost"
                            className="text-white/40 hover:text-red-400 h-8 w-8 p-0"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
