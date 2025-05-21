import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useUser } from "@/context/UserContext";
import TicketScanner from "@/components/admin/TicketScanner";

export default function TicketScannerPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  
  // Get user data from context
  const { user, isAdmin, isModerator } = useUser();

  // Check if user is authorized to access this page
  useEffect(() => {
    const checkAccess = () => {
      setLoading(true);
      
      if (isAdmin || isModerator) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    };
    
    checkAccess();
  }, [user, isAdmin, isModerator]);

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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="mb-2 text-xs sm:text-sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Back to Admin
          </Button>
        </div>
        
        <div className="pb-10">
          <TicketScanner />
        </div>
      </div>
    </>
  );
}