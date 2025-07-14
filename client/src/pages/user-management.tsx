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
        title="User Management | Admin"
        description="Manage users and their roles"
      />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Admin Dashboard</span>
              <span>•</span>
              <span className="font-medium">User Management</span>
            </div>
          </div>
          
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions. Search and filter users to find specific accounts quickly.
            </p>
          </div>
        </div>
        
        <div className="pb-10">
          <UserManagement />
        </div>
      </div>
    </>
  );
}