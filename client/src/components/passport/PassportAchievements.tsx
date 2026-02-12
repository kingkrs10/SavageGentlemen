import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Share2, Lock, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassportAchievementDefinition } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AchievementResponse {
    achievements: (PassportAchievementDefinition & { isUnlocked: boolean; unlockedAt?: string })[];
    totalUnlocked: number;
}

export function PassportAchievements() {
    const { toast } = useToast();
    const { data, isLoading } = useQuery<AchievementResponse>({
        queryKey: ['/api/passport/achievements']
    });

    const handleShare = async (achievement: PassportAchievementDefinition) => {
        try {
            await apiRequest('POST', '/api/passport/share', {
                shareType: 'ACHIEVEMENT',
                payload: { achievementId: achievement.id, name: achievement.name },
                platform: 'TWITTER'
            });
            toast({
                title: "Shared!",
                description: `You've shared your ${achievement.name} badge via social media.`,
            });
        } catch (e) {
            toast({
                title: "Error",
                description: "Failed to share achievement. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl bg-neutral-900" />
                ))}
            </div>
        );
    }

    const { achievements, totalUnlocked } = data || { achievements: [], totalUnlocked: 0 };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Your Badge Collection</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                            {totalUnlocked} / {achievements.length} Unlocked
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {achievements.map((achievement) => (
                    <Card
                        key={achievement.id}
                        className={`text-center relative transition-all duration-300 overflow-hidden rounded-2xl ${achievement.isUnlocked
                            ? 'bg-neutral-900 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:-translate-y-1'
                            : 'bg-neutral-900/50 border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                            }`}
                    >
                        {achievement.isUnlocked && (
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>
                        )}

                        <CardContent className="pt-6 pb-4 px-3 flex flex-col items-center gap-3 h-full relative z-10">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${achievement.isUnlocked
                                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-yellow-400 ring-2 ring-yellow-500/30'
                                : 'bg-white/5 text-gray-500'
                                }`}>
                                {achievement.iconUrl ? (
                                    <img src={achievement.iconUrl} alt={achievement.name} className="w-10 h-10 object-contain drop-shadow-lg" />
                                ) : (
                                    <Medal className="w-8 h-8" />
                                )}
                            </div>

                            <div className="space-y-1 flex-1 flex flex-col justify-center w-full">
                                <h3 className={`font-bold text-sm leading-tight ${achievement.isUnlocked ? 'text-white' : 'text-gray-400'}`}>{achievement.name}</h3>
                                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed px-1">
                                    {achievement.description}
                                </p>
                            </div>

                            {achievement.isUnlocked ? (
                                <div className="w-full mt-2 pt-2 border-t border-white/5">
                                    <div className="text-[10px] text-gray-400 mb-2">
                                        Unlocked {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : 'Recently'}
                                    </div>
                                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400" onClick={() => handleShare(achievement)}>
                                        <Share2 className="w-3 h-3 mr-1.5" /> Share
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-full mt-2 pt-2 border-t border-white/5 flex justify-center text-xs text-gray-600 items-center h-9">
                                    <Lock className="w-3 h-3 mr-1.5" /> Locked
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {achievements.length === 0 && (
                    <div className="col-span-full py-16 text-center border dashed border-white/10 rounded-2xl bg-neutral-900/30">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Trophy className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400">No achievements available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
