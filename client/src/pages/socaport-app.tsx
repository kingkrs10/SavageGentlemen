import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Stamp, Trophy, Globe, Users, CheckCircle, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function SocaportApp() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [passportProfile, setPassportProfile] = useState(null);

  const createPassportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/passport/profile", {});
      return res.json();
    },
    onSuccess: (data) => {
      setPassportProfile(data);
      navigate("/passport");
    },
  });

  const handleCTA = () => {
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("sg:open-auth-modal", {
          detail: { tab: "register", redirectPath: "/passport" },
        })
      );
    } else if (!passportProfile) {
      createPassportMutation.mutate();
    } else {
      navigate("/passport");
    }
  };


  const getCTAText = () => {
    if (!user) return "Create Your Free Passport";
    if (!passportProfile) return "Create Your Free Passport";
    return "View Your Passport";
  };

  return (
    <>
      <SEOHead
        title="Soca Passport - Your Caribbean Carnival Journey"
        description="Track your events across multiple carnivals, earn Fête Credits, and unlock perks. Keep a digital record of your Caribbean journey."
        ogImage="/og-socapassport.jpg"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-6 rounded-3xl">
                <Stamp className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Soca Passport
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Your Caribbean Carnival Journey in One Digital Passport
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleCTA}
                disabled={createPassportMutation.isPending}
                className="text-lg px-8 py-6 rounded-full"
                data-testid="button-create-passport"
              >
                {createPassportMutation.isPending ? (
                  "Creating Passport..."
                ) : (
                  <>
                    {getCTAText()} <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Track Your Events</h3>
                <p className="text-muted-foreground">
                  Track your events across multiple carnivals, cities, and countries. Never forget where you've fêted.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Earn Fête Credits</h3>
                <p className="text-muted-foreground">
                  Collect stamps at every event you attend and earn Fête Credits. Unlock exclusive perks and rewards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Digital Journey</h3>
                <p className="text-muted-foreground">
                  Keep a digital record of your Caribbean carnival journey. Share your achievements and milestones.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card rounded-3xl p-12 mb-20 border-2">
            <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold">Create Your Passport</h3>
                <p className="text-muted-foreground">
                  Sign up for free and create your digital Soca Passport in seconds.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold">Attend Events</h3>
                <p className="text-muted-foreground">
                  Attend passport-enabled events and get scanned at the entrance.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold">Collect & Earn</h3>
                <p className="text-muted-foreground">
                  Collect stamps, earn rewards, and upgrade your status from Bronze to Elite.
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-2 border-primary/20">
            <CardContent className="p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">For Promoters</h2>
                  <p className="text-lg text-muted-foreground max-w-xl">
                    Are you an event creator or promoter? Use Soca Passport to reward your fête fans,
                    track loyalty across events, and see who keeps coming back.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/passport-promoters")}
                  className="text-lg px-8 py-6 rounded-full"
                  data-testid="link-promoters"
                >
                  Learn More for Promoters
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-20">
            <Button
              size="lg"
              onClick={handleCTA}
              disabled={createPassportMutation.isPending}
              className="text-lg px-8 py-6 rounded-full"
              data-testid="button-create-passport-bottom"
            >
              {createPassportMutation.isPending ? (
                "Creating Passport..."
              ) : (
                <>
                  {getCTAText()} <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
