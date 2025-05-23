import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Ticket, Users, LineChart, ShoppingBag, Calendar } from "lucide-react";

export default function AdminTemp() {
  const [, navigate] = useLocation();
  const { isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState("tools");
  
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>
        
        <Tabs 
          defaultValue="tools" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="tools" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1 text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs sm:text-sm">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Scanner Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Ticket Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Scan and validate tickets for events.</p>
                  <Button 
                    onClick={() => navigate('/ticket-scanner')}
                    className="w-full h-10 text-sm"
                  >
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>
              
              {/* User Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Manage user roles and permissions.</p>
                  <Button 
                    onClick={() => navigate('/user-management')}
                    className="w-full h-10 text-sm"
                  >
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Events Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm">Manage events and tickets.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => navigate('/events')}
                      className="w-full h-10 text-sm"
                      variant="outline"
                    >
                      View Events
                    </Button>
                    <Button 
                      onClick={() => {
                        // Navigate to admin with event tab active
                        navigate('/admin');
                        setActiveTab("content");
                      }}
                      className="w-full h-10 text-sm"
                    >
                      Manage Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Products Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">Manage store products.</p>
                  <Button 
                    onClick={() => navigate('/shop')}
                    className="w-full h-10 text-sm"
                  >
                    View Products
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tickets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Scanner Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Ticket Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm">Scan tickets at the event entrance.</p>
                  <Button 
                    onClick={() => navigate('/ticket-scanner')}
                    className="w-full h-10 text-sm"
                  >
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>
              
              {/* Ticket Management Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Manage Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm">Create and edit event tickets.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => navigate('/events')}
                      className="w-full h-10 text-sm"
                      variant="outline"
                    >
                      View Events
                    </Button>
                    <Button 
                      onClick={() => {
                        // Navigate to dedicated ticket management interface
                        navigate('/ticket-management');
                      }}
                      className="w-full h-10 text-sm"
                    >
                      Manage Tickets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Analytics Card */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <LineChart className="h-4 w-4 mr-2" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm mb-4">View site analytics and statistics.</p>
                  <Button 
                    onClick={() => navigate('/analytics')}
                    className="w-full h-10 text-sm"
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}