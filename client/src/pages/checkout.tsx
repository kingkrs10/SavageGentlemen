import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import PayPalButton from '@/components/PayPalButton';
import SimpleStripeCheckout from '@/components/SimpleStripeCheckout';
import { apiRequest } from "@/lib/queryClient";
import BrandLoader from '@/components/ui/BrandLoader';
import { User } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Stripe implementation has been moved to SimpleStripeCheckout component

// Main Checkout Component
export default function Checkout() {
  // State for controlling the checkout process
  const [amount, setAmount] = useState(29.99);
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [eventId, setEventId] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketName, setTicketName] = useState<string>('');
  const [processingFreeTicket, setProcessingFreeTicket] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        console.log("Checkout page: Checking authentication");
        setCheckingAuth(true);
        const response = await apiRequest('GET', '/api/me');
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Checkout page: User authenticated", userData);
          setUser(userData);
          
          // Store the user data in localStorage for persistence
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.log("Checkout page: User not authenticated");
          // Clear localStorage to ensure consistent state
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Clear localStorage on error for safety
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    getCurrentUser();
    
    // Re-check authentication when auth-related changes happen
    const handleAuthChange = (event: Event) => {
      console.log("Checkout page: Auth change detected");
      // Extract user data from event if available
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.user) {
        console.log("Checkout page: User data from event", customEvent.detail.user);
        setUser(customEvent.detail.user);
        setCheckingAuth(false);
      } else {
        // Otherwise re-fetch user data
        getCurrentUser();
      }
    };
    
    // Handle URL parameter changes
    const handlePopState = () => {
      console.log("Checkout page: PopState event detected");
      // Update params from URL
      const searchParams = new URLSearchParams(window.location.search);
      
      // Get amount
      const amountParam = searchParams.get('amount');
      if (amountParam) {
        setAmount(parseFloat(amountParam));
      }
      
      // Get event ID
      const eventIdParam = searchParams.get('eventId');
      if (eventIdParam) {
        setEventId(parseInt(eventIdParam));
      }
      
      // Get event title
      const titleParam = searchParams.get('title');
      if (titleParam) {
        setEventTitle(decodeURIComponent(titleParam));
      }
      
      // Get currency (optional)
      const currencyParam = searchParams.get('currency');
      if (currencyParam) {
        setCurrency(currencyParam.toUpperCase());
      }
    };
    
    window.addEventListener('sg:auth:changed', handleAuthChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('sg:auth:changed', handleAuthChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Get the params from the URL search params if available
  useEffect(() => {
    // Use a function to ensure we always get the latest URL
    const updateParamsFromURL = () => {
      console.log("Checkout page: Updating params from URL:", window.location.search);
      const searchParams = new URLSearchParams(window.location.search);
      
      // Get amount
      const amountParam = searchParams.get('amount');
      if (amountParam) {
        setAmount(parseFloat(amountParam));
      }
      
      // Get event ID
      const eventIdParam = searchParams.get('eventId');
      if (eventIdParam) {
        setEventId(parseInt(eventIdParam));
      }
      
      // Get event title
      const titleParam = searchParams.get('title');
      if (titleParam) {
        setEventTitle(decodeURIComponent(titleParam));
      }
      
      // Get currency (optional)
      const currencyParam = searchParams.get('currency');
      if (currencyParam) {
        setCurrency(currencyParam.toUpperCase());
      }
      
      // Get ticket ID (optional)
      const ticketIdParam = searchParams.get('ticketId');
      if (ticketIdParam) {
        setTicketId(parseInt(ticketIdParam));
      }
      
      // Get ticket name (optional)
      const ticketNameParam = searchParams.get('ticketName');
      if (ticketNameParam) {
        setTicketName(decodeURIComponent(ticketNameParam));
      }
    };
    
    // Update parameters immediately
    updateParamsFromURL();
    
    // Also add a listener for PopStateEvent which is triggered by our custom navigation
    const handlePopState = () => {
      console.log("Checkout page: PopState event detected");
      updateParamsFromURL();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);

  // No need to create payment intent here - it's handled in SimpleStripeCheckout component
  useEffect(() => {
    // Still set isLoading to false once authentication is done
    if (!checkingAuth) {
      setIsLoading(false);
    }
  }, [checkingAuth]);
  
  // Function to handle the custom event
  const handleCustomEvent = (event: CustomEvent) => {
    // Custom event handling logic
  };

  // Show auth required message if user is not authenticated and we're done checking
  if (!checkingAuth && !user) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to purchase tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                To continue with your ticket purchase, please sign in or create an account.
              </AlertDescription>
            </Alert>
            
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md mb-6">
              {eventTitle && (
                <>
                  <h4 className="font-medium">{eventTitle}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    1 × {amount === 0 ? 'Free' : `$${amount.toFixed(2)}`} Event Ticket
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  // Preserve all original URL parameters in the redirect
                  const currentParams = new URLSearchParams(window.location.search);
                  
                  // Make sure to include all event parameters
                  if (eventId && !currentParams.has('eventId')) {
                    currentParams.set('eventId', eventId.toString());
                  }
                  if (eventTitle && !currentParams.has('title')) {
                    currentParams.set('title', eventTitle);
                  }
                  if (!currentParams.has('amount') && amount) {
                    currentParams.set('amount', amount.toString());
                  }
                  if (!currentParams.has('currency') && currency) {
                    currentParams.set('currency', currency);
                  }
                  
                  // Create the redirect path with all parameters
                  const redirectPath = `/checkout?${currentParams.toString()}`;
                  console.log("Redirecting to login with return path:", redirectPath);
                  
                  // Open the auth modal instead of redirecting
                  const event = new CustomEvent('sg:open-auth-modal', { 
                    detail: { 
                      tab: 'login',
                      redirectPath 
                    } 
                  });
                  window.dispatchEvent(event);
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Preserve all original URL parameters in the redirect
                  const currentParams = new URLSearchParams(window.location.search);
                  
                  // Make sure to include all event parameters
                  if (eventId && !currentParams.has('eventId')) {
                    currentParams.set('eventId', eventId.toString());
                  }
                  if (eventTitle && !currentParams.has('title')) {
                    currentParams.set('title', eventTitle);
                  }
                  if (!currentParams.has('amount') && amount) {
                    currentParams.set('amount', amount.toString());
                  }
                  if (!currentParams.has('currency') && currency) {
                    currentParams.set('currency', currency);
                  }
                  
                  // Create the redirect path with all parameters
                  const redirectPath = `/checkout?${currentParams.toString()}`;
                  console.log("Redirecting to register with return path:", redirectPath);
                  
                  // Open the auth modal instead of redirecting
                  const event = new CustomEvent('sg:open-auth-modal', { 
                    detail: { 
                      tab: 'register',
                      redirectPath 
                    } 
                  });
                  window.dispatchEvent(event);
                }}
              >
                Create Account
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => window.history.back()}>
              Back to Event
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Display loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="container max-w-md mx-auto py-8 flex flex-col items-center justify-center">
        <BrandLoader size="lg" />
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Preparing checkout...
        </p>
      </div>
    );
  }

  // Display a free ticket message when the amount is 0
  if (amount === 0) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Free Ticket</CardTitle>
            <CardDescription>
              {processingFreeTicket ? 'Processing your free ticket...' : 'Claim your free ticket for this event.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              {eventTitle && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-2">
                  <h4 className="font-medium">{eventTitle}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    1 × {ticketName || 'Free Event Ticket'}
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-2">
                <span>Ticket Type:</span>
                <span className="px-2 py-1 bg-primary text-white rounded-full text-xs font-medium">
                  FREE
                </span>
              </div>
            </div>
            
            {processingFreeTicket ? (
              <div className="flex flex-col items-center justify-center py-6">
                <BrandLoader size="lg" />
                <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                  Processing your free ticket request...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">Ready to Claim Your Free Ticket?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Click the button below to claim your free ticket to this event.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    // Basic validation before proceeding
                    if (!user) {
                      toast({
                        title: "Authentication Required",
                        description: "Please sign in to claim your free ticket.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (!eventId || !ticketId) {
                      toast({
                        title: "Invalid Ticket",
                        description: "The ticket information is incomplete. Please try again.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setProcessingFreeTicket(true);
                    try {
                      // Prepare payload once
                      const freeTicketPayload = {
                        eventId: eventId,
                        eventTitle: eventTitle,
                        ticketId: ticketId,
                        ticketName: ticketName
                      };
                      
                      // Prepare headers with authentication
                      const headers: Record<string, string> = {
                        'Content-Type': 'application/json'
                      };
                      
                      console.log("Current user object:", user);
                      
                      // First authentication method: Direct token from user object
                      if (user && user.token) {
                        headers['Authorization'] = `Bearer ${user.token}`;
                        console.log("Added token directly from user object");
                      }
                      
                      // Second authentication method: Token from localStorage
                      if (!headers['Authorization']) {
                        const userDataStr = localStorage.getItem('user');
                        if (userDataStr) {
                          try {
                            const userData = JSON.parse(userDataStr);
                            console.log("User data from localStorage:", userData);
                            
                            // Try different locations where token might be stored
                            if (userData?.data?.data?.token) {
                              headers['Authorization'] = `Bearer ${userData.data.data.token}`;
                              console.log("Added token from nested data");
                            } else if (userData?.data?.token) {
                              headers['Authorization'] = `Bearer ${userData.data.token}`;
                              console.log("Added token from data");
                            } else if (userData?.token) {
                              headers['Authorization'] = `Bearer ${userData.token}`;
                              console.log("Added token from root");
                            }
                          } catch (e) {
                            console.error("Error parsing user data:", e);
                          }
                        }
                      }
                      
                      // Add user ID as reliable authentication method
                      // Always add user-id regardless of other auth methods
                      if (user && user.id) {
                        headers['user-id'] = user.id.toString();
                        console.log("Added user-id header:", user.id);
                      } else {
                        try {
                          const userDataStr = localStorage.getItem('user');
                          if (userDataStr) {
                            const userData = JSON.parse(userDataStr);
                            const userId = userData?.data?.data?.id || userData?.data?.id || userData?.id;
                            
                            if (userId) {
                              headers['user-id'] = userId.toString();
                              console.log("Added user-id from localStorage:", userId);
                            }
                          }
                        } catch (e) {
                          console.error("Error getting user ID from localStorage:", e);
                        }
                      }

                      console.log("Claiming free ticket with headers:", headers);
                      
                      // Try with different endpoint patterns and handle response properly
                      let response;
                      let responseText;
                      let responseData;
                      
                      try {
                        // First try with /api prefix
                        console.log("Trying /api/tickets/free endpoint with payload:", freeTicketPayload);
                        response = await fetch("/api/tickets/free", {
                          method: "POST",
                          headers: headers,
                          body: JSON.stringify(freeTicketPayload),
                          credentials: 'include' // Include cookies if available
                        });
                        
                        // Get response text first for debugging
                        responseText = await response.text();
                        console.log(`API response status: ${response.status}, text:`, responseText);
                        
                        // If it's valid JSON, parse it
                        try {
                          responseData = JSON.parse(responseText);
                        } catch (jsonError) {
                          console.error("Not valid JSON response:", responseText);
                          throw new Error("Server returned invalid JSON");
                        }
                        
                        // Check if we got an error response
                        if (!response.ok) {
                          throw new Error(responseData?.message || "Server error");
                        }
                      } catch (apiPrefixError) {
                        console.error("Error with /api prefix:", apiPrefixError);
                        
                        // If first attempt failed, try without the prefix
                        try {
                          console.log("API prefixed endpoint failed, trying /tickets/free endpoint...");
                          response = await fetch("/tickets/free", {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify(freeTicketPayload),
                            credentials: 'include' // Include cookies if available
                          });
                          
                          // Get response text for debugging
                          responseText = await response.text();
                          console.log(`Non-API response status: ${response.status}, text:`, responseText);
                          
                          // If it's valid JSON, parse it
                          try {
                            responseData = JSON.parse(responseText);
                          } catch (jsonError) {
                            console.error("Not valid JSON response:", responseText);
                            throw new Error("Server returned invalid JSON");
                          }
                          
                          // Check if we got an error response
                          if (!response.ok) {
                            throw new Error(responseData?.message || "Server error");
                          }
                        } catch (nonApiError) {
                          console.error("Error with non-prefixed endpoint:", nonApiError);
                          throw nonApiError; // Rethrow to be caught by the outer catch
                        }
                      }
                      
                      // If we made it here, we have valid response data
                      if (!responseData) {
                        throw new Error("No response data received from server");
                      }
                      
                      // We now already have responseData from our improved error handling
                      if (responseData.success) {
                        toast({
                          title: "Free Ticket Claimed!",
                          description: "Your free ticket has been claimed successfully. Check your email for details.",
                          variant: "default",
                        });
                        
                        // Redirect to the success page with event and ticket details
                        const redirectParams = new URLSearchParams();
                        if (eventId) redirectParams.append('eventId', eventId.toString());
                        if (eventTitle) redirectParams.append('eventTitle', encodeURIComponent(eventTitle));
                        if (ticketId) redirectParams.append('ticketId', ticketId.toString());
                        if (ticketName) redirectParams.append('ticketName', encodeURIComponent(ticketName));
                        
                        // Log successful ticket claim
                        console.log("Successfully claimed free ticket:", responseData);
                        
                        // Add a short delay before redirect to ensure toast is seen
                        setTimeout(() => {
                          setLocation(`/payment-success?${redirectParams.toString()}`);
                        }, 1500);
                      } else {
                        console.error("Server returned success:false:", responseData);
                        throw new Error(responseData.message || "Failed to claim free ticket");
                      }
                    } catch (error) {
                      console.error("Error claiming free ticket:", error);
                      const errorMessage = error instanceof Error ? error.message : "Could not claim free ticket. Please try again.";
                      toast({
                        title: "Error",
                        description: errorMessage,
                        variant: "destructive",
                      });
                    } finally {
                      setProcessingFreeTicket(false);
                    }
                  }}
                  disabled={processingFreeTicket || !user}
                >
                  {processingFreeTicket ? (
                    <>
                      <span className="animate-pulse">Processing</span>
                      <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    </>
                  ) : (
                    "Claim Free Ticket"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Regular checkout process for paid tickets
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Complete your purchase using your preferred payment method.
          </CardDescription>
          {eventTitle && (
            <div className="mt-3 pt-3 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground">Order Summary</h3>
              <div className="mt-2">
                <div className="flex justify-between items-start py-1">
                  <div>
                    <p className="font-medium">{eventTitle}</p>
                    {ticketName && <p className="text-sm text-muted-foreground">{ticketName}</p>}
                  </div>
                  <p className="font-bold">${amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            {eventTitle && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-2">
                <h4 className="font-medium">{eventTitle}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1 × {ticketName || 'Event Ticket'}
                </div>
              </div>
            )}
            <div className="flex justify-between mt-2">
              <span>Subtotal:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1 text-lg font-bold">
              <span>Total:</span>
              <span>${amount.toFixed(2)} {currency}</span>
            </div>
          </div>
          
          <Tabs defaultValue="card" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">Credit Card</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="cashapp">Cash App</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-4">
              {/* Use our new simplified Stripe checkout component */}
              <div className="mt-4">
                <SimpleStripeCheckout
                  amount={amount}
                  eventId={eventId}
                  eventTitle={eventTitle}
                  ticketId={ticketId}
                  ticketName={ticketName}
                  userData={user}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="paypal" className="mt-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full p-4 rounded-md">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      paypal-button {
                        display: block;
                        width: 100%;
                        height: 45px;
                        border-radius: 4px;
                        background-color: #0070ba;
                        color: white;
                        font-weight: bold;
                        text-align: center;
                        line-height: 45px;
                        cursor: pointer;
                        position: relative;
                      }
                      
                      paypal-button::before {
                        content: "Pay with PayPal";
                      }

                      paypal-button.loading::before {
                        content: "Processing...";
                      }
                      
                      paypal-button.loading::after {
                        content: "";
                        position: absolute;
                        top: 50%;
                        right: 15px;
                        transform: translateY(-50%);
                        width: 16px;
                        height: 16px;
                        border: 2px solid rgba(255,255,255,0.3);
                        border-radius: 50%;
                        border-top-color: #fff;
                        animation: paypal-button-spinner 0.8s linear infinite;
                      }

                      @keyframes paypal-button-spinner {
                        to {
                          transform: translateY(-50%) rotate(360deg);
                        }
                      }
                      
                      paypal-button.error {
                        background-color: #f5f5f5;
                        color: #666;
                        cursor: not-allowed;
                      }
                      
                      paypal-button.error::before {
                        content: "PayPal Unavailable";
                      }
                    `
                  }} />
                  <PayPalButton 
                    amount={amount.toString()} 
                    currency={currency.toLowerCase()} 
                    intent="CAPTURE"
                    eventId={eventId}
                    eventTitle={eventTitle}
                    ticketId={ticketId}
                    ticketName={ticketName}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Click the PayPal button above to complete your purchase securely with PayPal.
                </p>
                {/* Add retry button that reloads the page to force PayPal to reinitialize */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    // Add loading class to PayPal button
                    const paypalButton = document.getElementById('paypal-button');
                    if (paypalButton) {
                      paypalButton.classList.add('loading');
                    }
                    
                    // Wait a moment before reloading to show the loading state
                    setTimeout(() => {
                      window.location.reload();
                    }, 800);
                  }}
                >
                  Refresh PayPal
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cashapp" className="mt-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full p-4 rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Pay with Cash App</h3>
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-[#00d632] rounded-xl flex items-center justify-center mx-auto">
                        <span className="text-white text-2xl font-bold">$</span>
                      </div>
                    </div>
                    <div className="border-t border-b border-border py-4 mb-4">
                      <p className="font-medium">Total Amount: ${amount.toFixed(2)} {currency}</p>
                      <p className="text-sm text-muted-foreground mt-1">Send payment to: <span className="font-medium">$SavageGentlem3n</span></p>
                    </div>
                    <div className="space-y-4">
                      <div className="text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <h4 className="text-sm font-medium mb-1">How to pay:</h4>
                        <ol className="text-sm list-decimal pl-5 space-y-1">
                          <li>Open Cash App on your phone</li>
                          <li>Tap the $ icon and enter ${amount.toFixed(2)}</li>
                          <li>In the "To" field, enter: $SavageGentlem3n</li>
                          <li>Add note: "{eventTitle} - {ticketName || 'Ticket'}"</li>
                          <li>Tap "Pay"</li>
                        </ol>
                      </div>
                      <Button 
                        className="w-full flex items-center justify-center gap-2" 
                        variant="outline"
                        onClick={() => {
                          // Open Cash App if on mobile, or copy to clipboard if on desktop
                          const cashAppUrl = `https://cash.app/$SavageGentlem3n/${amount.toFixed(2)}`;
                          
                          // Try to open Cash App
                          window.open(cashAppUrl, '_blank');
                          
                          // Also copy the $cashtag to clipboard as backup
                          navigator.clipboard.writeText('$SavageGentlem3n')
                            .then(() => {
                              toast({
                                title: "Copied to clipboard",
                                description: "$SavageGentlem3n has been copied to your clipboard",
                              });
                            })
                            .catch(err => {
                              console.error("Could not copy text: ", err);
                            });
                        }}
                      >
                        <span>Open Cash App</span>
                        <span className="h-5 w-5 text-[#00d632]">→</span>
                      </Button>
                      <div className="mt-4 text-sm text-gray-500">
                        <p>After sending payment, please contact us with your payment confirmation to receive your ticket.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}