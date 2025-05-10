import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TicketQRScanner from "@/components/TicketQRScanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { apiRequest } from "@/lib/queryClient";

export default function TicketScannerPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  // Simple role check function - uses direct API call
  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        
        // Make a direct API call to check access with staff endpoint
        const response = await fetch('/api/staff/me', {
          headers: {
            // Get user ID from localStorage if available
            'user-id': localStorage.getItem('user') ? 
              JSON.parse(localStorage.getItem('user') || '{}').id : 
              ''
          }
        });
        
        // If response is successful, user is admin/moderator
        if (response.ok) {
          const userData = await response.json();
          console.log("Admin access check successful:", userData);
          setIsAuthorized(true);
        } else {
          console.log("Admin access check failed");
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
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