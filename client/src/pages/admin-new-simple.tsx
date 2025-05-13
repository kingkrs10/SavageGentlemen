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
      const userData = parsedUser.data || parsedUser;
      
      if (!userData.role || userData.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4">We're currently fixing an issue with the full admin dashboard. Please check back soon.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          <p>Create and manage events and tickets</p>
        </div>
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Marketing</h2>
          <p>Email marketing and subscriber management</p>
        </div>
      </div>
    </div>
  );
}