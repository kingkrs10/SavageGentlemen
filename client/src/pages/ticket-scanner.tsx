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
        title="Live Gate QR Validator - Savage Gentlemen Admin"
        description="High-speed optical camera and QR validation for event door access."
      />
      <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        {/* ── LUXURY HERO ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back to Admin
                </Button>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest">
                  DOOR ACCESS & LIVE QR VALIDATION
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
                Ticket Scanner
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Scan, verify, and check-in attendee QR codes with instant anti-fraud prevention.
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-obsidian border border-gold-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
          <TicketScanner />
        </div>
      </div>
    </>
  );
}