import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, BarChart3, Heart, CheckCircle, Sparkles, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import carnivalVideo from "@assets/Caribbean_Nightlife_Loop_Animation_1763081047699.mp4";

const promoterFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Valid email is required"),
  organization: z.string().max(255).optional(),
  locationCity: z.string().max(120).optional(),
  locationCountry: z.string().length(2, "Country code must be 2 characters (e.g., US, TT, CA)").optional(),
  websiteOrSocial: z.string().max(255).optional(),
  eventTypes: z.string().max(255).optional(),
});

type PromoterFormData = z.infer<typeof promoterFormSchema>;



export default function PassportPromoters() {
  const [submitted, setSubmitted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<PromoterFormData>({
    resolver: zodResolver(promoterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      locationCity: "",
      locationCountry: "",
      websiteOrSocial: "",
      eventTypes: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: PromoterFormData) => {
      const res = await apiRequest("POST", "/api/promoters/register", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll contact you shortly to activate Soca Passport for your events.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PromoterFormData) => {
    registerMutation.mutate(data);
  };

  const handleAccessCodeSubmit = () => {
    const trimmedCode = accessCode.trim();
    if (!trimmedCode) {
      toast({
        title: "Access Code Required",
        description: "Please enter your event access code.",
        variant: "destructive",
      });
      return;
    }
    // Redirect to the new promoter dashboard
    setLocation(`/socapassport/promoter/${trimmedCode.toUpperCase()}`);
  };

  if (submitted) {
    return (
      <>
        <SEOHead
          title="Soca Passport for Promoters - Thank You"
          description="Thank you for your interest in Soca Passport for event promoters."
        />
        <div className="min-h-screen bg-gradient-to-br from-[#0B0B0E] via-[#005137] to-[#6B2AFF] flex items-center justify-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(107,42,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,126,57,0.08),transparent_40%)] pointer-events-none" />

          <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20" data-testid="card-thank-you">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-full shadow-lg shadow-green-500/50 animate-pulse">
                  <CheckCircle className="h-16 w-16 text-white" data-testid="icon-success" />
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent" data-testid="text-thank-you-title">
                Welcome to the Carnival!
              </h1>
              <p className="text-xl text-gray-200" data-testid="text-thank-you-message">
                We've received your application and will contact you shortly to activate Soca Passport for your events.
              </p>
              <p className="text-gray-300" data-testid="text-expected-response-time">
                You can expect to hear from us within 2-3 business days.
              </p>
              <div className="pt-4">
                <Sparkles className="h-8 w-8 text-yellow-400 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Soca Passport for Promoters - Reward Your Fête Fans"
        description="Track loyalty across events, see who keeps coming back, and reward your superfans with Soca Passport."
        ogImage="/og-socapassport-promoters.jpg"
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* HERO SECTION */}
          <div className="text-center space-y-8 mb-20 relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 -z-10" />

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl animate-pulse" style={{ animationDuration: '3s' }}>
              SOCA PASSPORT
              <br />
              <span className="text-5xl sm:text-6xl lg:text-7xl">FOR PROMOTERS</span>
            </h1>
            <p className="text-2xl sm:text-3xl text-gray-100 max-w-4xl mx-auto font-light leading-relaxed drop-shadow-lg">
              Reward your fête fans, track loyalty across events, and see who keeps coming back.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-full border-2 border-green-400/60 text-green-300 font-bold text-xl animate-pulse shadow-lg shadow-green-500/30">
                ✨ No Scanners Required — Fans Check In Themselves!
              </span>
            </div>
          </div>

          {/* ACCESS CODE ENTRY FOR EXISTING PROMOTERS */}
          <Card className="max-w-2xl mx-auto mb-16 bg-black/60 backdrop-blur-2xl border-2 border-green-500/50 shadow-2xl shadow-green-500/30" data-testid="card-access-code">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-green-500/50">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Already a Promoter?
              </CardTitle>
              <CardDescription className="text-lg text-gray-300 mt-2">
                Enter your event access code to manage check-ins and view attendee stats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAccessCodeSubmit()}
                  className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/50 text-lg"
                  data-testid="input-access-code"
                />
                <Button
                  onClick={handleAccessCodeSubmit}
                  disabled={!accessCode.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 shadow-lg shadow-green-500/30"
                  size="lg"
                  data-testid="button-access-scanner"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Manage Event
                </Button>
              </div>
              <p className="text-sm text-gray-400 text-center">
                Your event code is auto-generated when you enable Soca Passport. Share it with attendees for easy check-in!
              </p>
            </CardContent>
          </Card>

          {/* FEATURE BLOCKS */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {/* Know Your Superfans */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-purple-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />

              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl w-fit shadow-lg shadow-purple-500/50">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Know Your Superfans</h3>
                <p className="text-gray-300 leading-relaxed">
                  See who follows your events across cities, islands, and carnival circuits.
                </p>
              </CardContent>
            </Card>

            {/* Reward Loyalty */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-orange-500/50 hover:border-orange-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-orange-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />

              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-orange-500 to-yellow-600 p-4 rounded-2xl w-fit shadow-lg shadow-orange-500/50">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Reward Loyalty Easily</h3>
                <p className="text-gray-300 leading-relaxed">
                  Automatically award stamps and perks to attendees. Build a loyal carnival tribe around your brand.
                </p>
              </CardContent>
            </Card>

            {/* Multi-Event Insights */}
            <Card className="relative group bg-black/40 backdrop-blur-xl border-2 border-green-500/50 hover:border-green-400 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-green-500/50 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />

              <CardContent className="relative pt-8 space-y-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl w-fit shadow-lg shadow-green-500/50">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Multi-Event Insights</h3>
                <p className="text-gray-300 leading-relaxed">
                  Track who moves with you from city to city and understand your most engaged audiences.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* HOW IT WORKS */}
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-12 mb-20 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-orange-600/5 pointer-events-none" />

            <h2 className="text-5xl font-black text-center mb-16 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-purple-500/50 border-4 border-white/20">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Create Your Account</h3>
                <p className="text-gray-300 leading-relaxed">
                  Sign up as a promoter and tell us about your brand or event company.
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
                <h3 className="text-xl font-bold text-white">Enable Passport</h3>
                <p className="text-gray-300 leading-relaxed">
                  Add your events and enable stamps, rewards, and carnival circuits.
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
                <h3 className="text-xl font-bold text-white">Easy Check-In</h3>
                <p className="text-gray-300 leading-relaxed">
                  Attendees check in with your event code or auto-verify via GPS location. No scanning required!
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center space-y-4 group">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-pink-500/50 border-4 border-white/20">
                    4
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">Track the Movement</h3>
                <p className="text-gray-300 leading-relaxed">
                  See how fans travel between cities, carnivals, and islands.
                </p>
              </div>
            </div>
          </div>

          {/* NEW MID-SECTION - Caribbean Experiences */}
          <div className="relative mb-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm transform -skew-y-2" />
            <div className="relative py-16 px-8 text-center">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-8 drop-shadow-2xl">
                Designed for Every Caribbean Experience
              </h2>
              <div className="flex flex-wrap justify-center gap-4 text-lg sm:text-xl text-gray-200 font-medium">
                <span className="px-4 py-2 bg-orange-500/20 rounded-full border border-orange-400/50">J'ouvert</span>
                <span className="px-4 py-2 bg-purple-500/20 rounded-full border border-purple-400/50">Glow Parties</span>
                <span className="px-4 py-2 bg-pink-500/20 rounded-full border border-pink-400/50">Soca Brunches</span>
                <span className="px-4 py-2 bg-green-500/20 rounded-full border border-green-400/50">Mas Bands</span>
                <span className="px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-400/50">Boat Rides</span>
                <span className="px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/50">Carnival Concerts</span>
                <span className="px-4 py-2 bg-red-500/20 rounded-full border border-red-400/50">Diaspora Fêtes</span>
              </div>
            </div>
          </div>

          {/* BETA NOTICE - Contact to get started */}
          <div className="max-w-3xl mx-auto mb-16 bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-xl border-2 border-green-400/50 rounded-2xl p-8 text-center">
            <Sparkles className="h-10 w-10 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">Ready to Reward Your Fête Fans?</h2>
            <p className="text-xl text-gray-200 mb-6">
              Soca Passport is currently in <span className="font-bold text-green-400">Beta</span> with FREE access for early promoters!
            </p>
            <p className="text-lg text-gray-300">
              Contact <a href="mailto:info@savgent.com" className="text-green-400 underline hover:text-green-300 font-semibold">info@savgent.com</a> or fill out the form below to get started.
            </p>
          </div>

          {/* REGISTRATION FORM */}
          <Card className="max-w-3xl mx-auto bg-black/60 backdrop-blur-2xl border-2 border-purple-500/40 shadow-2xl shadow-purple-500/30">
            <CardHeader className="text-center space-y-3 pb-8">
              <CardTitle className="text-4xl font-black bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Get Started as a Promoter
              </CardTitle>
              <CardDescription className="text-lg text-gray-300">
                Fill out the form below and we'll contact you shortly to activate Soca Passport for your events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 text-base">Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            {...field}
                            data-testid="input-name"
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 text-base">Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                            data-testid="input-email"
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 text-base">Organization / Brand</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your event company or brand"
                            {...field}
                            data-testid="input-organization"
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="locationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base">City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Miami"
                              {...field}
                              data-testid="input-city"
                              className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200 text-base">Country Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="US"
                              {...field}
                              data-testid="input-country"
                              maxLength={2}
                              className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="websiteOrSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 text-base">Website or Instagram Handle</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="@yourhandle or https://yourwebsite.com"
                            {...field}
                            data-testid="input-website"
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 text-base">Type of Events</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="fêtes, brunches, carnivals, etc."
                            {...field}
                            data-testid="input-event-types"
                            className="bg-white/5 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold text-lg py-6 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 border-2 border-white/10"
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-promoter"
                  >
                    {registerMutation.isPending ? "Submitting..." : "Become a Passport Promoter"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
