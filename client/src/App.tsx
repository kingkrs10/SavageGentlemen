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

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { UserProvider, useUser } from "@/context/UserContext";

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
const TicketScanner = lazy(() => import("@/pages/ticket-scanner"));

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
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/shop" component={Shop} />
        <Route path="/live" component={Live} />
        <Route path="/community" component={Community} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/admin" component={Admin} />
        <Route path="/password-reset" component={PasswordReset} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/my-tickets" component={MyTickets} />
        <Route path="/ticket-scanner" component={TicketScanner} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  // Only show splash screen on first visit to the site in this browser session
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Check if we've shown the splash already this session
    if (typeof window !== 'undefined') {
      const hasShownSplash = sessionStorage.getItem("hasShownSplash");
      return !hasShownSplash;
    }
    return true; // Default for SSR
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Get user from our new context
  const { user, login, logout } = useUser();

  const guestLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/guest", {});
      return res.json();
    },
    onSuccess: (data) => {
      login(data);
    },
  });

  // Effect for splash screen
  useEffect(() => {
    if (showSplash) {
      console.log("Loading SplashScreen component");
      console.log("Application starting...");
      
      // Immediately mark that we've shown the splash in this session
      // This prevents the splash from showing again if the user refreshes the page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("hasShownSplash", "true");
      }
      
      // Hide splash screen after 3 seconds to allow video to play
      const timer = setTimeout(() => {
        console.log("Splash screen timer completed, moving to main app");
        setShowSplash(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Effect for auth modal event listener
  useEffect(() => {
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
        // Parse the current URL to extract query parameters
        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);
        
        // Ensure we're capturing all relevant parameters
        let redirectPath = event.detail.redirectPath;
        
        // Check if the redirectPath includes the necessary parameters
        const redirectUrl = new URL(window.location.origin + redirectPath);
        const redirectParams = new URLSearchParams(redirectUrl.search);
        
        // Ensure all parameters are present
        if (params.has('eventId') && !redirectParams.has('eventId')) {
          redirectParams.set('eventId', params.get('eventId')!);
        }
        if (params.has('title') && !redirectParams.has('title')) {
          redirectParams.set('title', params.get('title')!);
        }
        if (params.has('amount') && !redirectParams.has('amount')) {
          redirectParams.set('amount', params.get('amount')!);
        }
        if (params.has('currency') && !redirectParams.has('currency')) {
          redirectParams.set('currency', params.get('currency')!);
        }
        
        // Update the redirect path with the enhanced parameters
        redirectPath = redirectUrl.pathname + '?' + redirectParams.toString();
        
        // Store the enhanced redirect path
        localStorage.setItem('sg:auth:redirect', redirectPath);
        console.log('Stored redirect path:', redirectPath);
      }
    };

    window.addEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);

    return () => {
      window.removeEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);
    };
  }, []);

  const handleLogin = (userData: User) => {
    // Use login from context
    login(userData);
    setShowAuthModal(false);
    
    // Check if there's a stored redirect path
    const redirectPath = localStorage.getItem('sg:auth:redirect');
    if (redirectPath) {
      console.log('Redirecting after login to:', redirectPath);
      // Clear the redirect path from localStorage first to prevent loops
      localStorage.removeItem('sg:auth:redirect');
      
      // IMPORTANT: We need to wait for the auth state to propagate before navigation
      setTimeout(() => {
        try {
          // Use direct URL manipulation without page reload
          const url = new URL(window.location.origin + redirectPath);
          
          // Use history API to navigate without reload - note we're using replaceState not pushState
          window.history.replaceState({}, '', url.toString());
          
          // Force a navigation event to update the UI
          window.dispatchEvent(new PopStateEvent('popstate'));
          
          console.log('Successfully navigated to:', url.toString());
        } catch (err) {
          console.error('Navigation error:', err);
        }
      }, 800); // Increased delay to ensure state is fully updated
    }
  };

  const handleContinueAsGuest = () => {
    guestLoginMutation.mutate();
    setShowAuthModal(false);
    
    // Check if there's a stored redirect path
    const redirectPath = localStorage.getItem('sg:auth:redirect');
    if (redirectPath) {
      console.log('Redirecting after guest login to:', redirectPath);
      // Clear the redirect path from localStorage first to prevent loops
      localStorage.removeItem('sg:auth:redirect');
      
      // IMPORTANT: We need to wait for the auth state to propagate before navigation
      setTimeout(() => {
        try {
          // Use direct URL manipulation without page reload
          const url = new URL(window.location.origin + redirectPath);
          
          // Use history API to navigate without reload - note we're using replaceState not pushState
          window.history.replaceState({}, '', url.toString());
          
          // Force a navigation event to update the UI
          window.dispatchEvent(new PopStateEvent('popstate'));
          
          console.log('Successfully navigated to:', url.toString());
        } catch (err) {
          console.error('Navigation error:', err);
        }
      }, 800); // Increased delay to ensure state is fully updated
    }
  };

  const handleLogout = () => {
    // Use the logout function from context
    logout();
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
            <BottomNavigation />
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

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;