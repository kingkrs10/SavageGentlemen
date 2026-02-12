import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Star } from "lucide-react";
import type { PassportRedemptionOffer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MarketplaceResponse {
    offers: PassportRedemptionOffer[];
    userTier: string;
    userCredits: number;
}

export function PassportMarketplace() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const { data, isLoading } = useQuery<MarketplaceResponse>({
        queryKey: ['/api/passport/redemptions/offers']
    });

    const claimMutation = useMutation({
        mutationFn: async (offerId: number) => {
            const res = await apiRequest('POST', `/api/passport/redemptions/${offerId}/claim`);
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Reward Claimed!",
                description: data.message,
            });
            // Refresh credits and offers
            queryClient.invalidateQueries({ queryKey: ['/api/passport/redemptions/offers'] });
            queryClient.invalidateQueries({ queryKey: ['/api/passport/credits'] });
            setClaimingId(null);
        },
        onError: (error: any) => {
            toast({
                title: "Claim Failed",
                description: error.message || "Could not claim reward. Please try again.",
                variant: "destructive"
            });
            setClaimingId(null);
        }
    });

    const handleClaim = (offerId: number) => {
        if (confirm("Are you sure you want to spend your credits on this reward?")) {
            setClaimingId(offerId);
            claimMutation.mutate(offerId);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full rounded-2xl bg-neutral-900" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl bg-neutral-900" />)}
                </div>
            </div>
        );
    }

    const { offers, userCredits } = data || { offers: [], userCredits: 0 };

    return (
        <div className="space-y-8">
            {/* Credits Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950/50 to-neutral-900/50 backdrop-blur-md p-8 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Star className="w-7 h-7 fill-emerald-400/20" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Reward Marketplace</h2>
                        <p className="text-emerald-400/70 text-sm">Redeem points for exclusive perks</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Available Balance</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                        {userCredits.toLocaleString()} <span className="text-lg text-gray-500 font-medium">pts</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => {
                    const canAfford = userCredits >= offer.pointsCost;
                    const isProcessing = claimingId === offer.id;
                    const inventoryLimited = offer.inventoryRemaining !== null;
                    const outOfStock = inventoryLimited && (offer.inventoryRemaining || 0) <= 0;

                    return (
                        <Card key={offer.id} className="flex flex-col h-full hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all duration-300 bg-neutral-900/80 border-white/10 overflow-hidden rounded-3xl group">
                            {offer.imageUrl && (
                                <div className="aspect-video bg-neutral-800 relative overflow-hidden group">
                                    <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-black/60 to-transparent p-3 flex justify-end">
                                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border border-white/10 h-6">
                                            {offer.category.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>
                            )}
                            {!offer.imageUrl && (
                                <div className="aspect-video bg-neutral-800/50 flex items-center justify-center relative">
                                    <ShoppingBag className="w-16 h-16 text-emerald-900/50" />
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="secondary" className="bg-neutral-900/80 text-gray-400 border border-white/10">
                                            {offer.category.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <CardHeader className="pb-3 pt-5">
                                <CardTitle className="flex justify-between items-start gap-2 text-xl font-bold text-white leading-tight">
                                    <span className="line-clamp-1">{offer.name}</span>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[2.5rem] text-gray-400 mt-2">{offer.description}</CardDescription>
                            </CardHeader>

                            <CardFooter className="mt-auto pt-4 flex flex-col gap-4">
                                <div className="flex w-full items-center justify-between text-sm border-t border-white/10 pt-4">
                                    <span className={`font-bold text-lg ${canAfford ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {offer.pointsCost} <span className="text-xs font-normal text-gray-500">Points</span>
                                    </span>
                                    {inventoryLimited && (
                                        <span className={`text-xs px-2 py-1 rounded-full border ${outOfStock ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-emerald-400/80 border-emerald-500/20 bg-emerald-500/5'}`}>
                                            {outOfStock ? 'Out of Stock' : `${offer.inventoryRemaining} left`}
                                        </span>
                                    )}
                                </div>

                                <Button
                                    className={`w-full font-bold h-11 text-md shadow-lg ${canAfford && !outOfStock
                                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-emerald-900/20'
                                        : 'bg-neutral-800 text-gray-500 hover:bg-neutral-700'}`}
                                    disabled={!canAfford || isProcessing || outOfStock}
                                    onClick={() => handleClaim(offer.id)}
                                >
                                    {isProcessing ? (
                                        "Processing..."
                                    ) : outOfStock ? (
                                        "Out of Stock"
                                    ) : !canAfford ? (
                                        `Need ${offer.pointsCost - userCredits} more`
                                    ) : (
                                        "Claim Reward"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            {offers.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-neutral-900/30">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-white">Marketplace Empty</h3>
                    <p className="text-gray-500 mt-2">No rewards are currently available. Check back soon!</p>
                </div>
            )}
        </div>
    );
}
