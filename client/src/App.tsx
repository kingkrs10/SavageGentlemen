import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import AuthModal from "@/components/auth/AuthModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import SEOHead from "@/components/SEOHead";
import NotFound from "@/pages/not-found";

import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { UserProvider, useUser } from "@/context/UserContext";
import { initGA } from "@/lib/ga-analytics";
import { trackPageView } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

// Lazily load pages for code splitting
const Home = lazy(() => import("@/pages/home"));
const Events = lazy(() => import("@/pages/events"));
const EventDetail = lazy(() => import("@/pages/event-detail"));
const Shop = lazy(() => import("@/pages/shop"));
const Live = lazy(() => import("@/pages/live"));
const Community = lazy(() => import("@/pages/community"));
const Checkout = lazy(() => import("@/pages/checkout"));
const PaymentSuccess = lazy(() => import("@/pages/payment-success"));
const Admin = lazy(() => import("@/pages/admin-temp"));
const PasswordReset = lazy(() => import("@/pages/password-reset"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const MyTickets = lazy(() => import("@/pages/my-tickets"));
const TicketScanner = lazy(() => import("@/pages/ticket-scanner"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const TicketManagement = lazy(() => import("@/pages/ticket-management"));
const FreeTicketsDashboard = lazy(() => import("@/pages/free-tickets-dashboard"));
const EmailManagement = lazy(() => import("@/pages/email-management"));

function Router() {
  const [location] = useLocation();
  const { user } = useUser();
  
  useEffect(() => {
    trackPageView(location, user?.id);
    console.log('Page view tracked:', location);
  }, [location, user?.id]);
  
  return (
    <Suspense fallback={
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">Loading content...</p>
        </div>
      </div>
    }>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/events" component={Events} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/events/:id/:slug" component={EventDetail} />
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
        <Route path="/user-management" component={UserManagement} />
        <Route path="/ticket-management" component={TicketManagement} />
        <Route path="/free-tickets" component={FreeTicketsDashboard} />
        <Route path="/email-management" component={EmailManagement} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  useEffect(() => {
    const handleOpenAuthModal = (event: CustomEvent) => {
      setShowAuthModal(true);
      
      if (event.detail && event.detail.tab) {
        localStorage.setItem("authModalSelectedTab", event.detail.tab);
      }
      
      if (event.detail && event.detail.redirectPath) {
        localStorage.setItem("redirectAfterAuth", event.detail.redirectPath);
      }
    };

    window.addEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);
    
    return () => {
      window.removeEventListener("sg:open-auth-modal", handleOpenAuthModal as EventListener);
    };
  }, []);

  useEffect(() => {
    if (user && !user.isGuest) {
      console.log("User session validated successfully");
    }
  }, [user]);

  useEffect(() => {
    console.log("Waiting for gtag to be available...");
    initGA();
  }, []);

  const handleAuthSuccess = (userData: User) => {
    login(userData);
    setShowAuthModal(false);
    
    const redirectPath = localStorage.getItem("redirectAfterAuth");
    if (redirectPath) {
      localStorage.removeItem("redirectAfterAuth");
      window.location.href = redirectPath;
    }
  };

  return (
    <>
      <SEOHead 
        title="Home"
        description="Caribbean-American event and lifestyle brand. Explore events, shop for merchandise, watch live streams, and connect with the community."
      />
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="min-h-screen bg-background text-foreground">
            <Header 
              user={user} 
              onLogout={logout} 
              onProfileClick={() => setShowAuthModal(true)} 
            />
            
            <main className="container mx-auto px-4 py-8">
              <Router />
            </main>
            
            <BottomNavigation />
            
            {showAuthModal && (
              <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAuthSuccess={handleAuthSuccess}
                onGuestLogin={() => guestLoginMutation.mutate()}
              />
            )}
            
            <Toaster />
          </div>
        </ThemeProvider>
      </TooltipProvider>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ErrorBoundary>
  );
}