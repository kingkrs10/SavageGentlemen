import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import TicketQRScanner from "@/components/TicketQRScanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function TicketScannerPage() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();

  // Check if user is admin or moderator
  const isAuthorized = currentUser && 
    (currentUser.role === 'admin' || currentUser.role === 'moderator');

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