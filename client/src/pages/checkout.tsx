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
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";
import BrandLoader from '@/components/ui/BrandLoader';
import { User } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// Force production mode for Stripe - always try to initialize even if key is missing
let stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Check and log the Stripe key status for debugging
if (!stripePublicKey) {
  console.warn('Missing Stripe public key from environment. Using fallback key.');
  // Fallback for development/testing - this is safe to expose as it's just a public test key
  // This key won't work for actual charges but allows the form to render for testing
  stripePublicKey = 'pk_test_TYooMQauvdEDq54NiTphI7jx';
} else {
  console.log('Stripe public key loaded from environment successfully');
}

// Log the key type for debugging (prod vs test)
const isTestKey = stripePublicKey.startsWith('pk_test_');
console.log(`Using ${isTestKey ? 'TEST' : 'PRODUCTION'} Stripe key`);

// Initialize Stripe with the key
const stripePromise = loadStripe(stripePublicKey, {
  stripeAccount: undefined, // Use the direct account
  apiVersion: '2023-10-16',
  locale: 'en' // English locale for payment UI
});

// Stripe Checkout Form Component
const StripeCheckoutForm = ({ 
  amount, 
  eventId, 
  eventTitle,
  ticketId,
  ticketName,
  userData
}: { 
  amount: number; 
  eventId?: number | null;
  eventTitle?: string;
  ticketId?: number | null;
  ticketName?: string;
  userData?: User | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [, setLocation] = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if Stripe is available on mount
  useEffect(() => {
    if (!stripe) {
      console.log("Stripe not yet loaded, waiting...");
      
      // Set a timeout to detect if Stripe is taking too long
      timeoutRef.current = setTimeout(() => {
        console.log("Stripe loading timeout reached");
        toast({
          title: "Payment form is taking longer than expected",
          description: "If the form doesn't appear, try refreshing the page",
          variant: "default",
        });
      }, 5000);
    } else {
      console.log("Stripe loaded successfully");
      // Clear timeout if Stripe loads successfully
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Give elements a moment to render
      setTimeout(() => {
        setStripeReady(true);
      }, 1000);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stripe, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify Stripe and Elements are available
    if (!stripe || !elements) {
      console.error("Attempting payment without Stripe instance...");
      
      // Check if iframe exists but JS not connected
      const stripeInstance = document.querySelector('iframe[title="Secure payment frame"]');
      if (stripeInstance) {
        console.log("Stripe iframe found, but JS API not connected");
        toast({
          title: "Payment System Not Ready",
          description: "Please try submitting again in a few seconds.",
        });
      } else {
        toast({
          title: "Payment Form Not Loaded",
          description: "Please wait for the payment form to load completely and try again.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Processing payment with Stripe...");
      
      // Build the return URL with event and ticket information as query parameters
      let returnUrl = window.location.origin + '/payment-success';
      if (eventId && eventTitle) {
        returnUrl += `?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
        
        // Add ticket information if available
        if (ticketId && ticketName) {
          returnUrl += `&ticketId=${ticketId}&ticketName=${encodeURIComponent(ticketName)}`;
        }
      }

      // Try to process the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error("Payment failed:", error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded without redirect
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase! Your ticket has been confirmed.",
        });
        
        // Manually redirect to success page
        const params = new URLSearchParams();
        if (eventId) params.append('eventId', eventId.toString());
        if (eventTitle) params.append('eventTitle', encodeURIComponent(eventTitle));
        if (ticketId) params.append('ticketId', ticketId.toString());
        if (ticketName) params.append('ticketName', encodeURIComponent(ticketName));
        
        setLocation(`/payment-success?${params.toString()}`);
      }
    } catch (err) {
      console.error("Unexpected error during payment:", err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again or use a different payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Additional check for elements readiness (payment form fully loaded)
  useEffect(() => {
    // Set ready state when both Stripe and Elements are available
    if (stripe && elements) {
      // Mark as ready after a slight delay to ensure element is rendered
      setTimeout(() => {
        setStripeReady(true);
      }, 500);
    }
  }, [stripe, elements]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Element with options for better loading and error handling */}
      <div className="mb-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: userData?.displayName || 'Customer',
                email: userData?.email || '',
              }
            },
            paymentMethodOrder: ['card']
          }}
          onChange={(event) => {
            // Log payment element load status for debugging
            if (event.complete) {
              console.log("Payment element fully loaded and ready");
              setStripeReady(true);
            } else if (event.empty) {
              console.log("Payment element is empty");
            } else {
              console.log("Payment element status:", event);
            }
          }}
        />
      </div>
      
      {/* Submit Button with loading and ready states */}
      <div className="relative">
        <Button 
          disabled={isProcessing || !stripeReady} 
          className="w-full" 
          type="submit"
        >
          {isProcessing ? 'Processing...' : 'Pay with Card'}
        </Button>
        
        {/* Show loading overlay if Stripe is not ready */}
        {!stripeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded backdrop-blur-[2px] z-10">
            <div className="text-sm text-muted-foreground flex items-center bg-background px-4 py-2 rounded-md shadow-sm">
              <div className="mr-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading payment form...
            </div>
          </div>
        )}
      </div>
      
      {/* Help text */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Your payment information is securely processed by Stripe.
      </p>
    </form>
  );
};

// Main Checkout Component
export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

  // Create PaymentIntent for paid tickets only
  useEffect(() => {
    const createPaymentIntent = async () => {
      // Only process paid tickets automatically when the user is authenticated
      if (amount > 0 && user) {
        if (!stripePromise) {
          console.error("Stripe not initialized");
          return;
        }
        
        setIsLoading(true);
        try {
          console.log("Creating initial payment intent...");
          
          // Prepare the payload once
          const paymentPayload = { 
            amount: amount,
            currency: currency.toLowerCase(),
            eventId: eventId,
            eventTitle: eventTitle,
            ticketId: ticketId,
            ticketName: ticketName,
            items: [{ 
              id: ticketId ? `event-ticket-${eventId}-${ticketId}` : (eventId ? `event-ticket-${eventId}` : "sg-event-ticket"), 
              name: ticketName ? `${eventTitle} - ${ticketName}` : (eventTitle || "Event Ticket"),
              quantity: 1 
            }]
          };
          
          // Try with API prefix first
          let response = await apiRequest("POST", "/api/payment/create-intent", paymentPayload);
          
          // If that fails, try without the prefix
          if (!response.ok && response.status !== 401) { // Don't retry if it's an auth error
            console.log("API prefixed endpoint failed, trying non-prefixed endpoint...");
            response = await apiRequest("POST", "/payment/create-intent", paymentPayload);
          }
          
          if (response.ok) {
            const data = await response.json();
            console.log("Payment intent created successfully");
            setClientSecret(data.clientSecret);
          } else if (response.status === 401) {
            // User is not authenticated, handled in the render method
            console.warn("Authentication required");
          } else {
            throw new Error("Failed to create payment intent on both endpoints");
          }
        } catch (error) {
          console.error("Error creating payment intent:", error);
          toast({
            title: "Error",
            description: "Could not initialize payment. Please try again or use a different payment method.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Only attempt to create payment intent if we're done checking authentication
    if (!checkingAuth) {
      createPaymentIntent();
    }
  }, [amount, currency, eventId, eventTitle, toast, user, checkingAuth]);

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
                      
                      // First try with /api prefix
                      let response = await apiRequest("POST", "/api/tickets/free", freeTicketPayload);
                      
                      // If that fails, try without the prefix
                      if (!response.ok) {
                        console.log("API prefixed free ticket endpoint failed, trying non-prefixed endpoint...");
                        response = await apiRequest("POST", "/tickets/free", freeTicketPayload);
                      }
                      
                      if (!response.ok) {
                        throw new Error("Server error processing free ticket");
                      }
                      
                      const data = await response.json();
                      if (data.success) {
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
                        
                        // Add a short delay before redirect to ensure toast is seen
                        setTimeout(() => {
                          setLocation(`/payment-success?${redirectParams.toString()}`);
                        }, 1500);
                      } else {
                        throw new Error(data.message || "Failed to claim free ticket");
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
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : clientSecret ? (
                <Elements 
                  key={`stripe-elements-${clientSecret}-${Date.now()}`} // Force re-create with unique key every time
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: { 
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#E91E63', // Brand color 
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '4px'
                      },
                      rules: {
                        '.Label': {
                          marginBottom: '8px',
                          fontWeight: '500'
                        },
                        '.Input': {
                          padding: '12px'
                        },
                        '.Button': {
                          backgroundColor: '#E91E63',
                          fontWeight: '600'
                        }
                      }
                    },
                    fonts: [{
                      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
                    }],
                    locale: 'en',
                    loader: 'always' // Always reload elements
                  }}
                >
                  <StripeCheckoutForm 
                    amount={amount} 
                    eventId={eventId} 
                    eventTitle={eventTitle}
                    ticketId={ticketId}
                    ticketName={ticketName}
                    userData={user}
                  />
                </Elements>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="text-red-500 font-medium">
                    Could not initialize payment form.
                  </div>
                  <Button 
                    onClick={() => {
                      // Try to reinitialize payment with forced new client secret
                      console.log("Retrying payment initialization...");
                      
                      // First reset the client secret to clear old state
                      setClientSecret(null);
                      setIsLoading(true);
                      
                      // Create a new payment intent with slight delay
                      setTimeout(async () => {
                        if (user) {
                          try {
                            console.log("Creating new payment intent...");
                            // Try both endpoints - first with API prefix, then without if that fails
                            let response = await apiRequest("POST", "/api/payment/create-intent", { 
                              amount: amount,
                              currency: currency.toLowerCase(),
                              eventId: eventId,
                              eventTitle: eventTitle,
                              ticketId: ticketId,
                              ticketName: ticketName,
                              items: [{ 
                                id: ticketId ? `event-ticket-${eventId}-${ticketId}` : (eventId ? `event-ticket-${eventId}` : "sg-event-ticket"), 
                                name: ticketName ? `${eventTitle} - ${ticketName}` : (eventTitle || "Event Ticket"),
                                quantity: 1 
                              }]
                            });
                            
                            // Try again with alternate endpoint if first one fails
                            if (!response.ok) {
                              console.log("First endpoint failed, trying alternate endpoint...");
                              response = await apiRequest("POST", "/payment/create-intent", { 
                                amount: amount,
                                currency: currency.toLowerCase(),
                                eventId: eventId,
                                eventTitle: eventTitle,
                                ticketId: ticketId,
                                ticketName: ticketName,
                                items: [{ 
                                  id: ticketId ? `event-ticket-${eventId}-${ticketId}` : (eventId ? `event-ticket-${eventId}` : "sg-event-ticket"), 
                                  name: ticketName ? `${eventTitle} - ${ticketName}` : (eventTitle || "Event Ticket"),
                                  quantity: 1 
                                }]
                              });
                            }
                            
                            if (response.ok) {
                              const data = await response.json();
                              console.log("Payment intent created successfully, updating client secret");
                              setClientSecret(data.clientSecret);
                              toast({
                                title: "Payment Initialized",
                                description: "You can now complete your payment.",
                              });
                            } else {
                              throw new Error("Failed to create payment intent on both endpoints");
                            }
                          } catch (error) {
                            console.error("Error creating payment intent:", error);
                            toast({
                              title: "Error",
                              description: "Could not initialize payment. Please try again or use a different payment method.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        } else {
                          console.error("Cannot retry payment - no user data available");
                          toast({
                            title: "Error",
                            description: "Please sign in to continue with payment.",
                            variant: "destructive",
                          });
                          setIsLoading(false);
                        }
                      }, 1000);
                    }}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              )}
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
                      <p className="text-sm text-muted-foreground mt-1">Send payment to: <span className="font-medium">$SavageGentlemen</span></p>
                    </div>
                    <div className="space-y-4">
                      <div className="text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <h4 className="text-sm font-medium mb-1">How to pay:</h4>
                        <ol className="text-sm list-decimal pl-5 space-y-1">
                          <li>Open Cash App on your phone</li>
                          <li>Tap the $ icon and enter ${amount.toFixed(2)}</li>
                          <li>In the "To" field, enter: $SavageGentlemen</li>
                          <li>Add note: "{eventTitle} - {ticketName || 'Ticket'}"</li>
                          <li>Tap "Pay"</li>
                        </ol>
                      </div>
                      <Button 
                        className="w-full flex items-center justify-center gap-2" 
                        variant="outline"
                        onClick={() => {
                          // Open Cash App if on mobile, or copy to clipboard if on desktop
                          const cashAppUrl = `https://cash.app/$SavageGentlemen/${amount.toFixed(2)}`;
                          
                          // Try to open Cash App
                          window.open(cashAppUrl, '_blank');
                          
                          // Also copy the $cashtag to clipboard as backup
                          navigator.clipboard.writeText('$SavageGentlemen')
                            .then(() => {
                              toast({
                                title: "Copied to clipboard",
                                description: "$SavageGentlemen has been copied to your clipboard",
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