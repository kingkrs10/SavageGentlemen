import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useUser } from "@/context/UserContext";
import UserManagement from "@/components/admin/UserManagement";

export default function UserManagementPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  
  // Get user data from context
  const { user, isAdmin } = useUser();

  // Check if user is admin (only admins can manage users, not moderators)
  useEffect(() => {
    const checkAccess = () => {
      setLoading(true);
      
      if (isAdmin) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    };
    
    checkAccess();
  }, [user, isAdmin]);

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
        <p className="mb-6">You need administrator privileges to access the user management page.</p>
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
        title="User Directory & Permissions - Savage Gentlemen Admin"
        description="Manage member accounts, permissions, roles, and administrative rights."
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
                  MEMBER DIRECTORY & ACCESS CONTROL
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
                User Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage user accounts, promoter authorizations, admin permissions, and guest profiles.
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-obsidian border border-gold-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
          <UserManagement />
        </div>
      </div>
    </>
  );
}