import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import SplashScreen from "@/components/SplashScreen";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import AuthModal from "@/components/auth/AuthModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import SEOHead from "@/components/SEOHead";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import BrandLoader from "@/components/ui/BrandLoader";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";

// Lazily load pages for code splitting
const Home = lazy(() => import("@/pages/home"));
const Events = lazy(() => import("@/pages/events"));
const EventDetail = lazy(() => import("@/pages/event-detail"));
const Shop = lazy(() => import("@/pages/shop"));
const Live = lazy(() => import("@/pages/live"));
const Community = lazy(() => import("@/pages/community"));
const Checkout = lazy(() => import("@/pages/checkout"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const Admin = lazy(() => import("@/pages/admin-new"));
const PasswordReset = lazy(() => import("@/pages/password-reset"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const MyTickets = lazy(() => import("@/pages/my-tickets"));

function Router() {
  return (
    <Suspense fallback={
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <BrandLoader size="lg" />
          <p className="text-muted-foreground text-sm">Loading content...</p>
        </div>
      </div>
    }>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/events" component={Events} />
        <Route path="/event/:id" component={EventDetail} />
        <Route path="/shop" component={Shop} />
        <Route path="/live" component={Live} />
        <Route path="/community" component={Community} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/admin" component={Admin} />
        <Route path="/password-reset" component={PasswordReset} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/my-tickets" component={MyTickets} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const guestLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/guest", {});
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
    },
  });

  useEffect(() => {
    // Hide splash screen after 3 seconds to allow video to play (reduced for testing)
    const timer = setTimeout(() => {
      console.log("Splash screen timer completed, moving to main app");
      setShowSplash(false);
    }, 3000);

    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }

    // Listen for custom event to open auth modal with tab and redirect parameters
    const handleOpenAuthModal = (event: CustomEvent) => {
      setShowAuthModal(true);
      
      // Handle tab parameter if specified
      if (event.detail && event.detail.tab) {
        // Store the selected tab in localStorage so AuthModal can access it
        localStorage.setItem('sg:auth:tab', event.detail.tab);
      }
      
      // Handle redirect path if specified
      if (event.detail && event.detail.redirectPath) {
        // Store the redirect path in localStorage so AuthModal can retrieve it after login
        localStorage.setItem('sg:auth:redirect', event.detail.redirectPath);
        console.log('Stored redirect path:', event.detail.redirectPath);
      }
    };

    window.addEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleContinueAsGuest = () => {
    guestLoginMutation.mutate();
    setShowAuthModal(false);
    
    // Check if there's a stored redirect path
    const redirectPath = localStorage.getItem('sg:auth:redirect');
    if (redirectPath) {
      console.log('Redirecting after guest login to:', redirectPath);
      // Wait a small amount of time to ensure state is updated before redirect
      setTimeout(() => {
        window.location.href = redirectPath;
        // Clear the redirect path from localStorage
        localStorage.removeItem('sg:auth:redirect');
      }, 500);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <SEOHead 
        title="Home"
        description="Savage Gentlemen - Caribbean-American lifestyle brand featuring events, merchandise, livestreams, and community connection. Shop tickets, apparel, and more."
      />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col bg-background">
            <Header
              user={user}
              onProfileClick={() => setShowAuthModal(true)}
              onLogout={handleLogout}
            />
            <main className="flex-grow container mx-auto px-3 py-4 pb-16">
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </main>
            <BottomNavigation user={user} />
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onLogin={handleLogin}
              onContinueAsGuest={handleContinueAsGuest}
            />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
