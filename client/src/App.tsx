import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import SplashScreen from "@/components/SplashScreen";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import AuthModal from "@/components/auth/AuthModal";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Events from "@/pages/events";
import Shop from "@/pages/shop";
import Live from "@/pages/live";
import Community from "@/pages/community";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import Admin from "@/pages/admin";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events" component={Events} />
      <Route path="/shop" component={Shop} />
      <Route path="/live" component={Live} />
      <Route path="/community" component={Community} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
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

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleContinueAsGuest = () => {
    guestLoginMutation.mutate();
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider attribute="class" forcedTheme="dark">
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header
            user={user}
            onProfileClick={() => setShowAuthModal(true)}
            onLogout={handleLogout}
          />
          <main className="flex-grow container mx-auto px-3 py-4 pb-16">
            <Router />
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
  );
}

export default App;
