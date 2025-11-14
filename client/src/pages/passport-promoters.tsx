import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, BarChart3, Heart, CheckCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

  if (submitted) {
    return (
      <>
        <SEOHead
          title="Soca Passport for Promoters - Thank You"
          description="Thank you for your interest in Soca Passport for event promoters."
        />
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
          <Card className="max-w-2xl w-full" data-testid="card-thank-you">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-500/10 p-6 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" data-testid="icon-success" />
                </div>
              </div>
              <h1 className="text-4xl font-bold" data-testid="text-thank-you-title">Thank You!</h1>
              <p className="text-xl text-muted-foreground" data-testid="text-thank-you-message">
                We've received your application and will contact you shortly to activate Soca Passport for your events.
              </p>
              <p className="text-muted-foreground" data-testid="text-expected-response-time">
                You can expect to hear from us within 2-3 business days.
              </p>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Soca Passport for Promoters
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Reward your fête fans, track loyalty across events, and see who keeps coming back.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Know Your Superfans</h3>
                <p className="text-muted-foreground">
                  See who attends your events repeatedly across cities, countries, and carnival circuits.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Reward Loyalty Easily</h3>
                <p className="text-muted-foreground">
                  Automatically award stamps and perks to attendees. Build a community of loyal fans.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-primary/10 p-4 rounded-full w-fit">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Event Insights</h3>
                <p className="text-muted-foreground">
                  Track who follows you from city to city and understand your most engaged audiences.
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
                <h3 className="text-xl font-semibold">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up as a promoter and tell us about your events.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold">Enable Passport</h3>
                <p className="text-muted-foreground">
                  Add your events and enable Soca Passport for each one.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold">Scan & Reward</h3>
                <p className="text-muted-foreground">
                  Scan attendees at the door and automatically issue stamps.
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-2 border-primary/20 mb-12">
            <CardContent className="p-12 text-center space-y-4">
              <h2 className="text-3xl font-bold">Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Per-event pricing coming soon. During beta, you can request access to try Soca Passport at your event.
              </p>
            </CardContent>
          </Card>

          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">Get Started as a Promoter</CardTitle>
              <CardDescription>
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
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} data-testid="input-name" />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
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
                        <FormLabel>Organization / Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="Your event company or brand" {...field} data-testid="input-organization" />
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
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Miami" {...field} data-testid="input-city" />
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
                          <FormLabel>Country Code</FormLabel>
                          <FormControl>
                            <Input placeholder="US" {...field} data-testid="input-country" maxLength={2} />
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
                        <FormLabel>Website or Instagram Handle</FormLabel>
                        <FormControl>
                          <Input placeholder="@yourhandle or https://yourwebsite.com" {...field} data-testid="input-website" />
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
                        <FormLabel>Type of Events</FormLabel>
                        <FormControl>
                          <Input placeholder="fêtes, brunches, carnivals, etc." {...field} data-testid="input-event-types" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-promoter"
                  >
                    {registerMutation.isPending ? "Submitting..." : "Submit Application"}
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
