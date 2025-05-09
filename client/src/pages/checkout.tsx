import { useState, useEffect } from 'react';
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
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key');
}

// Force production mode for Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
    stripeAccount: undefined, // Use the direct account
    apiVersion: '2023-10-16',
    locale: 'en' // English locale for payment UI
  }) : null;

// Stripe Checkout Form Component
const StripeCheckoutForm = ({ 
  amount, 
  eventId, 
  eventTitle 
}: { 
  amount: number; 
  eventId?: number | null;
  eventTitle?: string; 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    // Build the return URL with any event information as query parameters
    let returnUrl = window.location.origin + '/payment-success';
    if (eventId && eventTitle) {
      returnUrl += `?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // The payment has been processed!
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
      // No need to manually redirect, the confirmPayment will handle it
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        disabled={!stripe || isProcessing} 
        className="w-full" 
        type="submit"
      >
        {isProcessing ? 'Processing...' : 'Pay with Card'}
      </Button>
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
  const [processingFreeTicket, setProcessingFreeTicket] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setCheckingAuth(true);
        const response = await apiRequest('GET', '/api/me');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Get the params from the URL search params if available
  useEffect(() => {
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
          const response = await apiRequest("POST", "/payment/create-intent", { 
            amount: amount,
            currency: currency.toLowerCase(),
            eventId: eventId,
            eventTitle: eventTitle,
            items: [{ 
              id: eventId ? `event-ticket-${eventId}` : "sg-event-ticket", 
              name: eventTitle || "Event Ticket",
              quantity: 1 
            }]
          });
          
          if (response.ok) {
            const data = await response.json();
            setClientSecret(data.clientSecret);
          } else if (response.status === 401) {
            // User is not authenticated, handled in the render method
            console.warn("Authentication required");
          } else {
            throw new Error("Failed to create payment intent");
          }
        } catch (error) {
          console.error("Error creating payment intent:", error);
          toast({
            title: "Error",
            description: "Could not initialize payment. Please try again.",
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
                  // Preserve event parameters in redirect
                  const params = new URLSearchParams();
                  if (eventId) params.append("eventId", eventId.toString());
                  if (eventTitle) params.append("eventTitle", eventTitle);
                  const redirectPath = `/checkout${params.toString() ? `?${params.toString()}` : ''}`;
                  setLocation(`/login?redirect=${encodeURIComponent(redirectPath)}`);
                }}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Preserve event parameters in redirect
                  const params = new URLSearchParams();
                  if (eventId) params.append("eventId", eventId.toString());
                  if (eventTitle) params.append("eventTitle", eventTitle);
                  const redirectPath = `/checkout${params.toString() ? `?${params.toString()}` : ''}`;
                  setLocation(`/register?redirect=${encodeURIComponent(redirectPath)}`);
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
                    1 × Free Event Ticket
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-2">
                <span>Ticket Price:</span>
                <span>FREE</span>
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
                    setProcessingFreeTicket(true);
                    try {
                      const response = await apiRequest("POST", "/tickets/free", {
                        eventId: eventId,
                        eventTitle: eventTitle
                      });
                      
                      const data = await response.json();
                      
                      if (data.success) {
                        toast({
                          title: "Free Ticket Claimed!",
                          description: "Your free ticket has been claimed successfully. Check your email for details.",
                        });
                        
                        // Redirect to the success page
                        setLocation(`/payment-success?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle || '')}`);
                      } else {
                        throw new Error(data.message || "Failed to claim free ticket");
                      }
                    } catch (error) {
                      console.error("Error claiming free ticket:", error);
                      toast({
                        title: "Error",
                        description: "Could not claim free ticket. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setProcessingFreeTicket(false);
                    }
                  }}
                  disabled={processingFreeTicket}
                >
                  Claim Free Ticket
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
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            {eventTitle && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md my-2">
                <h4 className="font-medium">{eventTitle}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1 × Event Ticket
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="card">Credit Card</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : clientSecret && stripePromise ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret, 
                    appearance: { theme: 'stripe' },
                    locale: 'en',
                    // Ensure always use production mode
                    loader: 'always'
                  }}
                >
                  <StripeCheckoutForm 
                    amount={amount} 
                    eventId={eventId} 
                    eventTitle={eventTitle}
                  />
                </Elements>
              ) : (
                <div className="text-center py-4 text-red-500">
                  Could not initialize Stripe payment form.
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
                    `
                  }} />
                  <PayPalButton 
                    amount={amount.toString()} 
                    currency={currency.toLowerCase()} 
                    intent="CAPTURE"
                    eventId={eventId}
                    eventTitle={eventTitle}
                  />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Click the PayPal button above to complete your purchase securely with PayPal.
                </p>
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