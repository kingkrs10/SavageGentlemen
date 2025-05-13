import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';

export default function SimpleAdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    // Check user authentication
    const user = localStorage.getItem('user');
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the admin page.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      console.log("Admin page - Raw parsed user:", parsedUser);
      
      // Handle deeply nested data structure
      let userData;
      if (parsedUser.data && parsedUser.data.data) {
        userData = parsedUser.data.data;
      } else if (parsedUser.data) {
        userData = parsedUser.data;
      } else {
        userData = parsedUser;
      }
      
      console.log("Admin page - Final user data:", userData);
      
      if (!userData.role || userData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
      } else {
        console.log("Admin page - Access granted for admin user:", userData.username);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast({
        title: "Authentication Error",
        description: "There was a problem with your session. Please log in again.",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, []);

  const [activeTab, setActiveTab] = React.useState("dashboard");
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Temporary Version</p>
      </div>
      
      <div className="mb-6 border-b flex overflow-x-auto">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "dashboard" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "events" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "users" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "emails" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("emails")}
        >
          Email Marketing
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "livestreams" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("livestreams")}
        >
          Livestreams
        </button>
      </div>
      
      {activeTab === "dashboard" && (
        <div>
          <p className="mb-4 text-lg">We're currently fixing an issue with the full admin dashboard. This is a temporary simplified version.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-1">Users</h2>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-1">Events</h2>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-1">Ticket Sales</h2>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-1">Subscribers</h2>
              <p className="text-3xl font-bold">-</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <p className="text-muted-foreground">Activity data is being loaded from the database...</p>
            </div>
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-2">
                <a href="/" className="text-primary hover:underline">View Public Site</a>
                <a href="/events" className="text-primary hover:underline">View All Events</a>
                <a href="/shop" className="text-primary hover:underline">View Shop</a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "events" && (
        <div>
          <p className="mb-4">To manage events, please wait for the full admin dashboard to be restored.</p>
        </div>
      )}
      
      {activeTab === "users" && (
        <div>
          <p className="mb-4">To manage users, please wait for the full admin dashboard to be restored.</p>
        </div>
      )}
      
      {activeTab === "emails" && (
        <div>
          <p className="mb-4">To manage email marketing, please wait for the full admin dashboard to be restored.</p>
        </div>
      )}
      
      {activeTab === "livestreams" && (
        <div>
          <p className="mb-4">To manage livestreams, please wait for the full admin dashboard to be restored.</p>
        </div>
      )}
    </div>
  );
}