import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import TicketQRScanner from "@/components/TicketQRScanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";

export default function TicketScannerPage() {
  const { currentUser, loading: firebaseLoading } = useAuth();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  // Check stored user from localStorage
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        // Check all possible localStorage keys for user data
        let parsedUser = null;
        
        // Log all localStorage items for debugging
        console.log("All localStorage keys:", Object.keys(localStorage));
        
        // Try sgAppUser first
        const sgAppUser = localStorage.getItem('sgAppUser');
        if (sgAppUser) {
          parsedUser = JSON.parse(sgAppUser);
          console.log("Found user in sgAppUser:", parsedUser);
        }
        
        // Try standard user key next
        if (!parsedUser) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            parsedUser = JSON.parse(storedUser);
            console.log("Found user in 'user' key:", parsedUser);
          }
        }
        
        // Finally try to verify with API regardless
        const response = await apiRequest('GET', '/api/me');
        if (response.ok) {
          const userData = await response.json();
          console.log("API verified user:", userData);
          setLocalUser(userData);
        } else if (parsedUser) {
          // Use localStorage data if API fails but we found something
          console.log("Using localStorage user data:", parsedUser);
          setLocalUser(parsedUser);
        } else {
          console.log("No valid user data found");
          setLocalUser(null);
        }
      } catch (error) {
        console.error("Error checking stored user:", error);
        setLocalUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  // Debug auth state
  useEffect(() => {
    console.log("Auth state:", { 
      firebaseUser: currentUser,
      localUser,
      firebaseRole: currentUser?.role, 
      localRole: localUser?.role 
    });
  }, [currentUser, localUser]);

  // Check if user is admin or moderator from either Firebase or local auth
  const isAuthorized = 
    (currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator')) ||
    (localUser && (localUser.role === 'admin' || localUser.role === 'moderator'));

  if (loading || firebaseLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
        <p className="mb-6">You need admin or moderator privileges to access the ticket scanner.</p>
        <Button 
          onClick={() => navigate('/admin')}
          variant="default"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Ticket Scanner | Admin"
        description="Scan and validate event tickets"
      />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">Ticket Scanner</h1>
          <p className="text-muted-foreground">
            Scan QR codes to validate tickets at the event entrance
          </p>
        </div>
        
        <div className="pb-10">
          <TicketQRScanner />
        </div>
      </div>
    </>
  );
}