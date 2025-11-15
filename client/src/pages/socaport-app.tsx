import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Stamp, Trophy, Globe, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import carnivalVideo from "@assets/Caribbean_Nightlife_Loop_Animation_1763081047699.mp4";

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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2c3e50] to-[#34495e] relative overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20"
          >
            <source src={carnivalVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#2c3e50]/90 via-[#34495e]/50 to-[#2c3e50]/95" />
        </div>

        {/* Hyper-Realistic Lighting Layers */}
        {/* Stage Spotlight Effect - Orange */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(230,126,34,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(211,84,0,0.08),transparent_65%)] pointer-events-none" />
        
        {/* Stage Spotlight Effect - Blue */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(52,152,219,0.12),transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(41,128,185,0.06),transparent_70%)] pointer-events-none" />
        
        {/* Ambient Floor Glow - Orange */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(230,126,34,0.1),transparent_40%)] pointer-events-none" />
        
        {/* Ambient Side Glow - Blue */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_60%,rgba(52,152,219,0.08),transparent_45%)] pointer-events-none" />
        
        {/* Depth Shadow Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(26,26,46,0.4)_80%)] pointer-events-none" />
        
        {/* Subtle Bokeh Particles */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_45%,rgba(230,126,34,0.04),transparent_25%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(52,152,219,0.04),transparent_30%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(211,84,0,0.03),transparent_35%)] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* HERO SECTION */}
          <div className="text-center space-y-10 mb-24 relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 -z-10" />
            
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl blur-2xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl shadow-2xl shadow-purple-500/50 border-4 border-white/20">
                  <Stamp className="h-20 w-20 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl animate-pulse" style={{ animationDuration: '3s' }}>
              SOCA PASSPORT
            </h1>
            <p className="text-2xl sm:text-3xl text-gray-100 max-w-4xl mx-auto font-light leading-relaxed drop-shadow-lg">
              Your Caribbean Carnival Journey in One Digital Passport
            </p>
            
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleCTA}
                disabled={createPassportMutation.isPending}
                className="relative group text-xl px-12 py-8 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 border-4 border-white/20 hover:scale-105"
                data-testid="button-create-passport"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  {createPassportMutation.isPending ? (
                    "Creating Passport..."
                  ) : (
                    <>
                      {getCTAText()} <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>

          {/* FEATURE CARDS */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {/* Track Your Events */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-green-500/50 hover:border-green-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-green-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
              
              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl w-fit shadow-lg shadow-green-500/50">
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Track Your Fêtes</h3>
                <p className="text-gray-300 leading-relaxed">
                  Track your events across multiple carnivals, cities, and countries. Never forget where you've fêted.
                </p>
              </CardContent>
            </Card>

            {/* Earn Fête Credits */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-yellow-500/50 hover:border-yellow-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-yellow-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
              
              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-4 rounded-2xl w-fit shadow-lg shadow-yellow-500/50">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Earn Fête Credits</h3>
                <p className="text-gray-300 leading-relaxed">
                  Collect stamps at every event you attend and earn Fête Credits. Unlock exclusive perks and rewards.
                </p>
              </CardContent>
            </Card>

            {/* Digital Journey */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-pink-500/50 hover:border-pink-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-pink-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
              
              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-2xl w-fit shadow-lg shadow-pink-500/50">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Digital Carnival Journey</h3>
                <p className="text-gray-300 leading-relaxed">
                  Keep a digital record of your Caribbean carnival journey. Share your achievements and milestones.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* HOW IT WORKS */}
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 mb-24 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-orange-600/5 pointer-events-none" />
            
            <h2 className="text-5xl font-black text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-purple-500/50 border-4 border-white/20">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Create Your Passport</h3>
                <p className="text-gray-300 leading-relaxed">
                  Sign up for free and create your digital Soca Passport in seconds.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-orange-500/50 border-4 border-white/20">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Attend Fêtes</h3>
                <p className="text-gray-300 leading-relaxed">
                  Attend passport-enabled events and get scanned at the entrance.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-green-500/50 border-4 border-white/20">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Collect & Earn</h3>
                <p className="text-gray-300 leading-relaxed">
                  Collect stamps, earn rewards, and upgrade your status from Bronze to Elite.
                </p>
              </div>
            </div>
          </div>

          {/* CARIBBEAN EXPERIENCES STRIP */}
          <div className="relative mb-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm transform -skew-y-2" />
            <div className="relative py-16 px-8 text-center">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-8 drop-shadow-2xl">
                Your Digital Carnival Passport
              </h2>
              <div className="flex flex-wrap justify-center gap-4 text-lg sm:text-xl text-gray-200 font-medium">
                <span className="px-4 py-2 bg-orange-500/20 rounded-full border border-orange-400/50">Trinidad Carnival</span>
                <span className="px-4 py-2 bg-purple-500/20 rounded-full border border-purple-400/50">Jamaica Carnival</span>
                <span className="px-4 py-2 bg-pink-500/20 rounded-full border border-pink-400/50">Miami Carnival</span>
                <span className="px-4 py-2 bg-green-500/20 rounded-full border border-green-400/50">Crop Over</span>
                <span className="px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-400/50">Labour Day</span>
                <span className="px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/50">Notting Hill</span>
              </div>
            </div>
          </div>

          {/* FOR PROMOTERS SECTION */}
          <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-xl border-2 border-purple-400/30 mb-16 shadow-2xl shadow-purple-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent)] pointer-events-none" />
            <CardContent className="relative p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <h2 className="text-4xl font-black text-white drop-shadow-lg">For Promoters</h2>
                  </div>
                  <p className="text-xl text-gray-200 max-w-xl leading-relaxed">
                    Are you an event creator or promoter? Use Soca Passport to reward your fête fans,
                    track loyalty across events, and see who keeps coming back.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate("/passport-promoters")}
                  className="relative group text-lg px-8 py-6 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 border-2 border-white/10 hover:scale-105"
                  data-testid="link-promoters"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                  <span className="relative">Learn More for Promoters</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* BOTTOM CTA */}
          <div className="text-center relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 -z-10" />
            <Button
              size="lg"
              onClick={handleCTA}
              disabled={createPassportMutation.isPending}
              className="relative group text-xl px-12 py-8 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 border-4 border-white/20 hover:scale-105"
              data-testid="button-create-passport-bottom"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <span className="relative flex items-center gap-3">
                {createPassportMutation.isPending ? (
                  "Creating Passport..."
                ) : (
                  <>
                    {getCTAText()} <ArrowRight className="h-6 w-6" />
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
