import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LogoImg from "@/assets/SGFLYERLOGO.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onContinueAsGuest: () => void;
}

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Enhanced password validation for registration
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const registerSchema = loginSchema.extend({
  displayName: z.string().min(3, "Display name must be at least 3 characters"),
  // Use the enhanced password validation for registration
  password: passwordSchema,
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthModal = ({ isOpen, onClose, onLogin, onContinueAsGuest }: AuthModalProps) => {
  // Check for stored tab preference in localStorage
  const storedTab = localStorage.getItem('authModalSelectedTab');
  const [currentTab, setCurrentTab] = useState<"login" | "register">(
    (storedTab === "register" ? "register" : "login")
  );
  const { toast } = useToast();
  const { loading, error } = useAuth();
  
  // Clear stored tab preference when modal opens
  useEffect(() => {
    if (isOpen) {
      // Only clear the tab preference, keep the redirect path
      localStorage.removeItem('authModalSelectedTab');
    }
  }, [isOpen]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.displayName}!`,
      });
      
      // Call the onLogin function to update user state
      onLogin(data);
      loginForm.reset();
      
      // Dispatch auth changed event
      window.dispatchEvent(new CustomEvent('sg:auth:changed', { detail: { user: data } }));
      
      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('sg:auth:redirect');
      if (redirectPath) {
        console.log('Redirecting after login to:', redirectPath);
        // Clear the redirect path from localStorage first to prevent loops
        localStorage.removeItem('sg:auth:redirect');
        
        // IMPORTANT: We need to wait for the auth state to propagate before navigation
        setTimeout(() => {
          try {
            // Use direct URL manipulation without page reload
            const url = new URL(window.location.origin + redirectPath);
            
            // Use history API to navigate without reload - note we're using replaceState not pushState
            window.history.replaceState({}, '', url.toString());
            
            // Force a navigation event to update the UI
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            console.log('Successfully navigated to:', url.toString());
          } catch (err) {
            console.error('Navigation error:', err);
          }
        }, 800); // Increased delay to ensure state is fully updated
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      
      let errorMessage = "Please check your credentials";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a network error from Firebase
        if (error.message.includes('network-request-failed') || error.message.includes('Network Error')) {
          errorMessage = "Network connection error. Please check your internet connection and try again.";
          
          // Log additional details for troubleshooting
          console.log('Network error details:', {
            url: window.location.href,
            navigator: navigator.onLine ? 'online' : 'offline',
            timestamp: new Date().toISOString()
          });
        }
        
        // Provide more user-friendly messages based on common errors
        if (errorMessage.includes("Invalid username or password")) {
          errorMessage = "Invalid username or password. Please try again.";
        } else if (errorMessage.includes("User not found")) {
          errorMessage = "Account not found. Please check your username or register.";
        } else if (errorMessage.toLowerCase().includes("network") || 
                   errorMessage.toLowerCase().includes("connection")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const { confirmPassword, ...registerData } = data;
      
      try {
        // Make API request - explicitly skip auto error throwing for auth requests
        const res = await apiRequest("POST", "/api/auth/register", registerData, { skipErrorThrow: true });
        
        // Handle response based on status
        if (!res.ok) {
          // Try to extract error message from response
          let errorMessage = "Registration failed";
          let errorData;
          
          try {
            // Create a clone of the response before reading it
            const clonedResponse = res.clone();
            errorData = await clonedResponse.json();
            
            // Check for different error formats
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            
            // Check for validation errors
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = errorData.errors.map((e: any) => e.message).join(', ');
            }
          } catch (jsonError) {
            console.error("Error parsing JSON error response:", jsonError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Success case - handle carefully to avoid "body already read" error
        try {
          // Create a clone before reading
          const clonedSuccessResponse = res.clone();
          const userData = await clonedSuccessResponse.json();
          
          // Ensure we got valid user data
          if (!userData || !userData.id) {
            throw new Error("Invalid user data received");
          }
          
          return userData;
        } catch (jsonError) {
          console.error("Error parsing success response:", jsonError);
          throw new Error("Unable to process registration response");
        }
      } catch (error) {
        console.error("Registration API error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: `Welcome to Savage Gentlemen, ${data.displayName}!`,
      });
      onLogin(data);
      registerForm.reset();
      
      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('sg:auth:redirect');
      if (redirectPath) {
        console.log('Redirecting after registration to:', redirectPath);
        // Clear the redirect path from localStorage first to prevent loops
        localStorage.removeItem('sg:auth:redirect');
        
        // IMPORTANT: We need to wait for the auth state to propagate before navigation
        setTimeout(() => {
          try {
            // Use direct URL manipulation without page reload
            const url = new URL(window.location.origin + redirectPath);
            
            // Use history API to navigate without reload - note we're using replaceState not pushState
            window.history.replaceState({}, '', url.toString());
            
            // Force a navigation event to update the UI
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            console.log('Successfully navigated to:', url.toString());
          } catch (err) {
            console.error('Navigation error:', err);
          }
        }, 800); // Increased delay to ensure state is fully updated
      }
    },
    onError: (error) => {
      console.error("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more user-friendly messages based on common errors
        if (errorMessage.includes("already exists") || errorMessage.includes("already taken")) {
          errorMessage = "Username already exists. Please choose a different username.";
        } else if (errorMessage.toLowerCase().includes("network") || 
                 errorMessage.toLowerCase().includes("connection")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (errorMessage.includes("validation")) {
          errorMessage = "Please check your information and try again.";
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={LogoImg} alt="Savage Gentlemen Logo" className="h-32 object-contain" />
          </div>
          <DialogTitle className="text-2xl font-heading">
            Join The Community
          </DialogTitle>
          <DialogDescription>
            Connect with other Savage Gentlemen fans, access exclusive content and more.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" value={currentTab} onValueChange={(v) => setCurrentTab(v as "login" | "register")}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Loading..." : "Login"}
                </Button>
                <div className="text-sm text-center mt-2">
                  <Button 
                    variant="link" 
                    className="text-blue-500 p-0 h-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      window.location.href = "/password-reset";
                    }}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your display name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Loading..." : "Register"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        {/* Email/password authentication is the only login method */}

        <div className="text-center mt-4">
          <Button
            variant="ghost"
            className="text-gray-400 text-sm"
            onClick={onContinueAsGuest}
          >
            Continue as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
