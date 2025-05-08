import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ArrowLeft, KeyRound, MailCheck, Lock } from "lucide-react";
import BrandLoader from "@/components/ui/BrandLoader";
import SEOHead from "@/components/SEOHead";

export default function PasswordResetPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("request"); // request, verify, reset, success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract token from URL if present
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep("reset");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Email is required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/password-reset/request", { email });
      
      if (response.ok) {
        setStep("verify");
        toast({
          title: "Reset email sent",
          description: "Check your inbox for instructions to reset your password",
        });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Password reset request failed:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password) {
      setError("New password is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/password-reset/reset", { 
        token,
        password 
      });
      
      if (response.ok) {
        setStep("success");
        toast({
          title: "Password reset successful",
          description: "Your password has been reset successfully",
        });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Reset Password | Savage Gentlemen"
        description="Reset your password to regain access to your Savage Gentlemen account."
      />
      
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {step === "request" && "Reset Your Password"}
              {step === "verify" && "Check Your Email"}
              {step === "reset" && "Set New Password"}
              {step === "success" && "Password Reset Complete"}
            </CardTitle>
            <CardDescription className="text-center">
              {step === "request" && "Enter your email to receive a password reset link"}
              {step === "verify" && "We've sent instructions to reset your password"}
              {step === "reset" && "Create a new password for your account"}
              {step === "success" && "Your password has been successfully reset"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {step === "request" && (
              <form onSubmit={handleRequestReset}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </div>
              </form>
            )}
            
            {step === "verify" && (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <MailCheck className="h-8 w-8" />
                </div>
                <p className="mb-6">
                  We've sent a password recovery link to <strong>{email}</strong>. 
                  Please check your email and click on the link to reset your password.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  If you don't see the email, check your spam folder or click the button below to send it again.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleRequestReset}
                  disabled={isLoading}
                  className="mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                      Resending...
                    </div>
                  ) : (
                    "Resend Email"
                  )}
                </Button>
              </div>
            )}
            
            {step === "reset" && (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      At least 8 characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required
                        className="pr-10"
                      />
                      <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Resetting...
                      </div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </form>
            )}
            
            {step === "success" && (
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button 
                  onClick={() => navigate("/login")}
                  className="mt-2"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {step !== "success" && (
              <Button 
                variant="link" 
                className="text-sm"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}