import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Flame, 
  Send, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Radio, 
  Zap,
  Tag,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StrategyPlan {
  day: number;
  title: string;
  country: string;
  flag: string;
  theme: string;
  hook: string;
  storyScript: string;
  caption: string;
  hashtags: string[];
  product: {
    id: string;
    title: string;
    priceFormatted: string;
    shopUrl: string;
    imageUrl: string;
    videoUrl?: string;
  };
  promoCode: string;
  growthMultiplier: string;
  targetPlatforms: string[];
  isCompleted?: boolean;
  isCurrent?: boolean;
  postedAt?: string;
}

export function SevenDayStrategySection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [postingDay, setPostingDay] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{
    state: {
      currentActiveDay: number;
      isAutoProgressionEnabled: boolean;
      history: any[];
      lastExecutedAt?: string;
    };
    schedule: StrategyPlan[];
  }>({
    queryKey: ["/api/seven-day-strategy"],
    queryFn: async () => {
      const res = await fetch("/api/seven-day-strategy");
      if (!res.ok) throw new Error("Failed to load 7-day strategy");
      return res.json();
    }
  });

  const postMutation = useMutation({
    mutationFn: async ({ day, dryRun }: { day: number; dryRun?: boolean }) => {
      const res = await apiRequest("POST", `/api/seven-day-strategy/post/${day}`, { dryRun: !!dryRun });
      return res.json();
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/seven-day-strategy"] });
      toast({
        title: `🎉 Day ${vars.day} Dispatched!`,
        description: `Successfully broadcast to Instagram, TikTok, YouTube Shorts & Facebook.`,
      });
      setPostingDay(null);
    },
    onError: (err: any) => {
      toast({
        title: "Dispatch Error",
        description: err.message || "Failed to publish day post.",
        variant: "destructive"
      });
      setPostingDay(null);
    }
  });

  const handlePostDay = (day: number) => {
    setPostingDay(day);
    postMutation.mutate({ day, dryRun: false });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard."
    });
  };

  if (isLoading || !data) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-center text-gray-400">
        <Sparkles className="w-6 h-6 text-gold-400 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading 7-Day Caribbean Strategy Engine...</p>
      </div>
    );
  }

  const { state, schedule } = data;

  return (
    <div className="bg-gradient-to-b from-black/60 via-black/40 to-black/60 border border-gold-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
      {/* Glow background accent */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-gold-500/10 blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30 text-[10px] font-mono uppercase font-bold tracking-widest mb-1.5">
            <Radio className="w-3 h-3 text-gold-400 animate-pulse" />
            ORGANIC GROWTH & SHOP CONVERSION ENGINE
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>🌴 7-Day Caribbean Culture & Shop Sales Social Strategy</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-3xl">
            Targeting 20,000 followers with authentic island heritage (Trinidad, Jamaica, Barbados, Grenada, St. Lucia, Dominica, St. Vincent, Antigua, Bahamas, Guyana) paired with high-converting luxury drops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30 px-3 py-1 text-xs font-mono">
            Active: Day {state.currentActiveDay} of 7
          </Badge>
          <Button
            size="sm"
            onClick={() => handlePostDay(state.currentActiveDay)}
            disabled={postingDay !== null}
            className="bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs gap-1.5 shadow-lg shadow-gold-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            {postingDay === state.currentActiveDay ? "Broadcasting..." : `Broadcast Day ${state.currentActiveDay} Now`}
          </Button>
        </div>
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {schedule.map((plan) => {
          const isExpanded = expandedDay === plan.day;
          const isPostingThis = postingDay === plan.day;

          return (
            <Card 
              key={plan.day} 
              className={`border transition-all duration-300 ${
                plan.isCurrent 
                  ? "bg-gradient-to-b from-gold-500/10 to-black/80 border-gold-500/50 ring-1 ring-gold-500/30 shadow-lg shadow-gold-500/5" 
                  : plan.isCompleted
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-black/40 border-white/10 hover:border-white/20"
              }`}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  {/* Top Bar: Day # & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gold-400">
                      Day {plan.day} • {plan.flag}
                    </span>
                    {plan.isCompleted ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Posted
                      </Badge>
                    ) : plan.isCurrent ? (
                      <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/40 text-[10px] px-1.5 py-0 animate-pulse">
                        Next Up
                      </Badge>
                    ) : (
                      <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px] px-1.5 py-0">
                        Upcoming
                      </Badge>
                    )}
                  </div>

                  {/* Island & Theme */}
                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                    {plan.country}
                  </h3>
                  <p className="text-xs text-gray-300 font-medium mb-3 line-clamp-2">
                    {plan.theme}
                  </p>

                  {/* Featured Product Box */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {plan.product.title}
                      </div>
                      <div className="text-[10px] font-mono text-gold-300 font-semibold">
                        {plan.product.priceFormatted} • Code: {plan.promoCode}
                      </div>
                    </div>
                  </div>

                  {/* Retention Hook Preview */}
                  <div className="bg-black/60 rounded-lg p-2 border border-white/5 mb-3">
                    <div className="text-[9px] uppercase font-mono text-gray-400 tracking-wider mb-0.5">
                      0-3s Retention Hook
                    </div>
                    <p className="text-[11px] italic text-gold-200 line-clamp-2">
                      "{plan.hook}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePostDay(plan.day)}
                      disabled={isPostingThis}
                      className={`w-full font-bold text-xs h-8 ${
                        plan.isCurrent
                          ? "bg-gold-500 hover:bg-gold-400 text-black shadow-md shadow-gold-500/20"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      {isPostingThis ? "Posting..." : `Post Day ${plan.day}`}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedDay(isExpanded ? null : plan.day)}
                      className="h-8 px-2 border-white/10 text-gray-400 hover:text-white"
                      title="View Full Copy"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>

                  {/* Expandable Copy Drawer */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-black/80 rounded-xl border border-white/10 text-left space-y-2.5 animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span>Full Social Copy</span>
                        <button
                          onClick={() => copyToClipboard(plan.caption)}
                          className="hover:text-gold-400 flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-200 whitespace-pre-line max-h-48 overflow-y-auto font-sans leading-relaxed">
                        {plan.caption}
                      </p>
                      <div className="pt-2 border-t border-white/10 text-[10px] text-gold-400/80">
                        🎯 Multiplier: {plan.growthMultiplier}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
