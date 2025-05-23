import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import SEOHead from "@/components/SEOHead";

export default function AdminTemp() {
  const [, navigate] = useLocation();
  const { isAdmin } = useUser();
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You need administrator privileges to access this page.</p>
      </div>
    );
  }
  
  return (
    <>
      <SEOHead 
        title="Admin Dashboard" 
        description="Savage Gentlemen Admin Dashboard" 
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ticket Scanner Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ticket Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Scan and validate tickets for events.</p>
              <Button 
                onClick={() => navigate('/ticket-scanner')}
                className="w-full"
              >
                Open Scanner
              </Button>
            </CardContent>
          </Card>
          
          {/* User Management Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">Manage user roles and permissions.</p>
              <Button 
                onClick={() => navigate('/user-management')}
                className="w-full"
              >
                Manage Users
              </Button>
            </CardContent>
          </Card>
          
          {/* Analytics Card */}
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">View site analytics and statistics.</p>
              <Button 
                onClick={() => navigate('/analytics')}
                className="w-full"
              >
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}