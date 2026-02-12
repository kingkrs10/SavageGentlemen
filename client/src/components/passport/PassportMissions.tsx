import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, CalendarClock, Target } from "lucide-react";
import type { PassportMission } from "@shared/schema";

export function PassportMissions() {
    const { data: missions = [], isLoading } = useQuery<PassportMission[]>({
        queryKey: ['/api/passport/missions']
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl bg-neutral-900" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Active Missions</h2>
                    <p className="text-gray-400">Complete challenges to earn extra points and badges</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {missions.map((mission) => {
                    const isActive = new Date() >= new Date(mission.activeFrom) && new Date() <= new Date(mission.activeTo);

                    return (
                        <Card key={mission.id} className="flex flex-col border border-white/10 bg-neutral-900/80 backdrop-blur-sm hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(244,114,182,0.15)] transition-all duration-300 rounded-2xl overflow-hidden group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-400 group-hover:bg-pink-500/20">
                                        <Target className="w-3 h-3 mr-1" />
                                        {mission.pointsReward} Pts
                                    </Badge>
                                    {isActive ? (
                                        <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold shadow-[0_0_10px_rgba(34,211,238,0.2)]">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-neutral-800 text-gray-500 border border-white/5">Expired</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-lg text-white group-hover:text-pink-400 transition-colors">{mission.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-gray-400">{mission.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto pt-4">
                                <div className="flex items-center text-xs text-gray-500 mb-4 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                    <CalendarClock className="w-3 h-3 mr-2 text-purple-400" />
                                    {new Date(mission.activeFrom).toLocaleDateString()} - {new Date(mission.activeTo).toLocaleDateString()}
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        className={`w-full font-bold ${isActive ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-900/20' : 'bg-neutral-800 text-gray-500 hover:bg-neutral-700'}`}
                                        disabled={!isActive}
                                    >
                                        {isActive ? "Start Mission" : "Mission Unavailable"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {missions.length === 0 && (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-neutral-900/30">
                    <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
                        <Trophy className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-300">No Missions Available</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">Check back soon for new challenges to test your carnival spirit!</p>
                </div>
            )}
        </div>
    );
}
