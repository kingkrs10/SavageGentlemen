import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from "react-helmet";
import { Gift, Ticket, Trophy, Star, Shirt, Crown, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

interface RedemptionOffer {
  id: number;
  category: string;
  name: string;
  description: string;
  creditCost: number;
  tierRequirement: string | null;
  stockLimit: number | null;
  stockRemaining: number | null;
}

const CATEGORY_ICONS: Record<string, any> = {
  TICKET_DISCOUNT: Ticket,
  EVENT_PERK: Star,
  MERCHANDISE: Shirt,
  VIP_ACCESS: Crown
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-700',
  SILVER: 'bg-gray-400',
  GOLD: 'bg-yellow-500',
  ELITE: 'bg-purple-600'
};

export default function PassportMarketplace() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string; } | null>(null);

  const { data: offersData, isLoading: offersLoading, error: offersError } = useQuery({
    queryKey: ['/api/passport/redemptions/offers'],
    enabled: !!user
  });

  const { data: creditsData } = useQuery({
    queryKey: ['/api/passport/credits'],
    enabled: !!user
  });

  const claimMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const res = await apiRequest('POST', `/api/passport/redemptions/${offerId}/claim`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Claim failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setClaimResult({ success: true, message: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/passport/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/passport/redemptions/offers'] });
    },
    onError: (error: Error) => {
      setClaimResult({ success: false, message: error.message });
    }
  });

  const offers: RedemptionOffer[] = 
    (offersData && typeof offersData === 'object' && 'offers' in offersData) 
      ? (offersData.offers as RedemptionOffer[]) 
      : [];
  const balance: number = 
    (creditsData && typeof creditsData === 'object' && 'balance' in creditsData) 
      ? (creditsData.balance as number) 
      : 0;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view redemption offerings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offersError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive font-semibold">
              Failed to load redemption offers
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              {(offersError as Error)?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Redemption Marketplace | Soca Passport</title>
        <meta name="description" content="Redeem your Fête Credits for exclusive perks, discounts, and VIP access" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Header with Balance */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Redemption Marketplace</h1>
            <p className="text-muted-foreground">Spend your credits on exclusive perks</p>
          </div>
          <Card className="w-full sm:w-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-2xl font-bold" data-testid="text-credit-balance">
                  {balance.toLocaleString()} credits
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Result Alert */}
        {claimResult && (
          <Alert 
            variant={claimResult.success ? "default" : "destructive"}
            className={claimResult.success ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
            data-testid="alert-claim-result"
          >
            <div className="flex items-start gap-3">
              {claimResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <AlertDescription className={claimResult.success ? "text-green-900 dark:text-green-100" : ""}>
                {claimResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Offers Grid */}
        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No redemption offers available at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const Icon = CATEGORY_ICONS[offer.category] || Gift;
              const canAfford = balance >= offer.creditCost;
              const hasStock = offer.stockLimit === null || (offer.stockRemaining !== null && offer.stockRemaining > 0);
              const canClaim = canAfford && hasStock;

              return (
                <Card 
                  key={offer.id}
                  className={!canClaim ? 'opacity-60' : ''}
                  data-testid={`card-offer-${offer.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      {offer.tierRequirement && (
                        <Badge className={`${TIER_COLORS[offer.tierRequirement]} text-white`}>
                          {offer.tierRequirement}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2">{offer.name}</CardTitle>
                    <CardDescription>{offer.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Cost:</span>
                        <span className="font-bold text-lg">
                          {offer.creditCost.toLocaleString()} credits
                        </span>
                      </div>
                      {offer.stockLimit !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Stock:</span>
                          <span className="text-sm">
                            {offer.stockRemaining || 0} / {offer.stockLimit}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!canClaim || claimMutation.isPending}
                      onClick={() => claimMutation.mutate(offer.id)}
                      data-testid={`button-claim-${offer.id}`}
                    >
                      {!canAfford ? 'Insufficient Credits' : !hasStock ? 'Out of Stock' : 'Claim Perk'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
