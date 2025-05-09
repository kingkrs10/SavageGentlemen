import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Mail, Lock } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import LogoSvg from "@/assets/logo.svg";

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const PasswordResetPage = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"request" | "check-email" | "reset" | "success">("request");
  const [token, setToken] = useState<string>("");
  const [resetEmail, setResetEmail] = useState<string>("");
  const { toast } = useToast();

  const requestForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check if a token is in the URL query params
  const queryParams = new URLSearchParams(window.location.search);
  const queryToken = queryParams.get("token");
  
  // If there's a token in the URL, move to the reset step
  // Using useEffect here to handle side effects when component mounts
  useEffect(() => {
    if (queryToken) {
      setToken(queryToken);
      resetForm.setValue("token", queryToken);
      setStep("reset");
    }
  }, []);

  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestResetFormValues) => {
      const res = await apiRequest("POST", "/api/auth/password-reset/request", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResetEmail(requestForm.getValues().email);
      setStep("check-email");
      toast({
        title: "Reset Request Sent",
        description: "Check your email for instructions to reset your password",
      });
    },
    onError: (error) => {
      console.error("Password reset request error:", error);
      
      let errorMessage = "Failed to send password reset request";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("user not found") || errorMessage.includes("no account")) {
          errorMessage = "No account found with that email address";
        } else if (errorMessage.toLowerCase().includes("network") || 
                 errorMessage.toLowerCase().includes("connection")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast({
        title: "Reset Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const res = await apiRequest("POST", "/api/auth/password-reset/reset", data);
      return res.json();
    },
    onSuccess: (data) => {
      setStep("success");
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully",
      });
    },
    onError: (error) => {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to reset password";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("token invalid") || errorMessage.includes("expired")) {
          errorMessage = "Invalid or expired token. Please request a new password reset link.";
        } else if (errorMessage.toLowerCase().includes("network") || 
                 errorMessage.toLowerCase().includes("connection")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onRequestSubmit = (data: RequestResetFormValues) => {
    requestResetMutation.mutate(data);
  };

  const onResetSubmit = (data: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(data);
  };

  const goToHome = () => {
    setLocation("/");
  };

  const goToLogin = () => {
    // Close the password reset flow and redirect to home
    setLocation("/");
    // Open the auth modal with login tab (handled in App.tsx)
    window.dispatchEvent(new CustomEvent("sg:open-auth-modal", { detail: { tab: "login" } }));
  };

  return (
    <>
      <SEOHead 
        title="Reset Password"
        description="Reset your Savage Gentlemen account password"
      />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <img src={LogoSvg} alt="Savage Gentlemen Logo" className="h-20 w-20 mb-4" />
          <h1 className="text-3xl font-bold font-heading">Savage Gentlemen</h1>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {step === "request" && "Reset Your Password"}
              {step === "check-email" && "Check Your Email"}
              {step === "reset" && "Create New Password"}
              {step === "success" && "Password Reset Successful"}
            </CardTitle>
            <CardDescription>
              {step === "request" && "Enter your email address to receive password reset instructions"}
              {step === "check-email" && "We've sent you an email with a link to reset your password"}
              {step === "reset" && "Enter your new password"}
              {step === "success" && "Your password has been reset successfully"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" && (
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="flex relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Enter your email address" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={requestResetMutation.isPending}
                  >
                    {requestResetMutation.isPending ? "Sending..." : "Send Reset Instructions"}
                  </Button>
                </form>
              </Form>
            )}

            {step === "check-email" && (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-5 w-5" />
                  <AlertTitle>Check your inbox</AlertTitle>
                  <AlertDescription>
                    We've sent a password reset link to <strong>{resetEmail}</strong>. 
                    Click the link in the email to reset your password.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground mt-4">
                  If you don't see the email, check your spam folder. The link will expire in 60 minutes.
                </p>
              </div>
            )}

            {step === "reset" && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem className={queryToken ? "hidden" : ""}>
                        <FormLabel>Reset Token</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the token from your email" 
                            {...field} 
                            value={token || field.value}
                            onChange={(e) => {
                              setToken(e.target.value);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="flex relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              placeholder="Enter your new password" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="flex relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              placeholder="Confirm your new password" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-300" />
                </div>
                <p>Your password has been reset successfully. You can now log in with your new password.</p>
                <Button onClick={goToLogin} className="w-full">
                  Log In
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {step === "request" && (
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={goToHome}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Button>
            )}
            {step === "check-email" && (
              <div className="w-full space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep("request")}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Request
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep("reset")}
                >
                  I have a reset token
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            {step === "reset" && (
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => setStep("request")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Request New Reset Link
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default PasswordResetPage;