import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Send,
  AlertCircle
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

export const MagazineAdminManager = () => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/magazine/articles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/magazine/articles?limit=50");
      return res.json();
    },
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

  const handlePublishInstagram = async (articleId: number) => {
    setPublishingId(articleId);
    try {
      const res = await apiRequest("POST", `/api/magazine/admin/publish-ig/${articleId}`);
      const data = await res.json();

      if (data.success) {
        toast({
          title: data.simulated ? "IG Preview Simulated" : "Published to Instagram!",
          description: data.simulated
            ? "Simulated post generated (Add INSTAGRAM_ACCESS_TOKEN in .env for live Meta Graph posting)."
            : "Successfully published to your live Instagram business page.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/magazine/articles"] });
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
    } catch (err: any) {
      toast({ title: "Delete Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card className="border-gold-500/20 bg-obsidian-card text-white">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous Editorial Bot
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-white">Magazine & Instagram Autopilot</CardTitle>
          <CardDescription className="text-white/60 text-xs">
            Manage autonomous Caribbean culture feeds, editorial articles, and automated Instagram publishing.
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
                  <TableHead className="text-white">Instagram Status</TableHead>
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
                          Not Posted
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
                          title="Auto-post to Instagram"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          {publishingId === article.id ? "Posting..." : "Post IG"}
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
  );
};
