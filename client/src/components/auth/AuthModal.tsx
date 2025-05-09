import { useState, useEffect } from "react";
import { X, Mail } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
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
import LogoSvg from "@/assets/logo.svg";

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

const registerSchema = loginSchema.extend({
  displayName: z.string().min(3, "Display name must be at least 3 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthModal = ({ isOpen, onClose, onLogin, onContinueAsGuest }: AuthModalProps) => {
  // Check for stored tab preference in localStorage
  const storedTab = localStorage.getItem('sg:auth:tab');
  const [currentTab, setCurrentTab] = useState<"login" | "register">(
    (storedTab === "register" ? "register" : "login")
  );
  const { toast } = useToast();
  const { signInWithGoogle, loading, error } = useAuth();
  
  // Clear stored tab preference when modal opens
  useEffect(() => {
    if (isOpen) {
      // Only clear the tab preference, keep the redirect path
      localStorage.removeItem('sg:auth:tab');
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
      const res = await apiRequest("POST", "/api/auth/register", registerData);
      return res.json();
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
            <img src={LogoSvg} alt="Savage Gentlemen Logo" className="h-20 w-20" />
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

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Check if we're on Replit and show appropriate Google button */}
          {window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.app') ? (
            <>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center bg-gray-300 text-gray-500 cursor-not-allowed"
                disabled={true}
              >
                <FaGoogle className="w-4 h-4 mr-2" />
                <span>Google Login (Disabled on Replit)</span>
              </Button>
              <div className="text-xs text-center text-gray-400 mt-1 mb-2">
                <p>Google login requires domain verification.</p>
                <p>Please use email login or continue as guest.</p>
              </div>
            </>
          ) : (
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-black"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  toast({
                    title: "Login Successful",
                    description: "Welcome to Savage Gentlemen!",
                  });
                } catch (error: any) {
                  console.error("Error signing in:", error);
                  
                  // Handle specific Firebase error codes with user-friendly messages
                  let errorMessage = "Failed to login with Google";
                  
                  if (error?.code === "auth/configuration-not-found") {
                    errorMessage = "Google authentication needs to be configured. Please ensure your domain is added to Firebase authorized domains.";
                  } else if (error?.code === "auth/popup-closed-by-user") {
                    errorMessage = "Login was canceled. Please try again.";
                  } else if (error?.code === "auth/popup-blocked") {
                    errorMessage = "Login popup was blocked by your browser. Please allow popups for this site.";
                  } else if (error?.code === "auth/account-exists-with-different-credential") {
                    errorMessage = "An account already exists with the same email but different sign-in credentials.";
                  } else if (error?.code === "auth/network-request-failed") {
                    errorMessage = "Network error. Please check your internet connection and try again.";
                  } else if (error?.message) {
                    errorMessage = error.message;
                  }
                  
                  toast({
                    title: "Login Failed",
                    description: errorMessage,
                    variant: "destructive",
                  });
                }
              }}
              disabled={loading}
            >
              <FaGoogle className="w-4 h-4 mr-2" />
              <span>Google</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center bg-black hover:bg-gray-900 border-gray-700"
            onClick={() => setCurrentTab("login")}
          >
            <Mail className="w-4 h-4 mr-2" />
            <span>Email</span>
          </Button>
        </div>

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
