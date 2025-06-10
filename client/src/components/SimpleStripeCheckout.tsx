import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { User } from '@/lib/types';
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe outside component to avoid recreation
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
console.log(`Using Stripe key: ${stripeKey}`);
const stripePromise = loadStripe(stripeKey);

// Determine if we're in test mode based on the Stripe key
const isTestMode = stripeKey.startsWith('pk_test_');

// Simple form component
const CheckoutForm = ({ 
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
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Form Not Ready",
        description: "Please wait for the payment form to load completely and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Build the return URL
      let returnUrl = window.location.origin + '/payment-success';
      if (eventId && eventTitle) {
        returnUrl += `?eventId=${eventId}&eventTitle=${encodeURIComponent(eventTitle)}`;
        
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
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again or use a different payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: userData?.displayName || 'Customer',
                email: userData?.email || '',
              }
            }
          }}
        />
      </div>
      
      {isTestMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-md mb-3 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Test Mode</h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
            Payment is in test mode. Use these test card numbers:
          </p>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="font-medium">4242 4242 4242 4242</span>
              <span>Success Payment</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">4000 0027 6000 3184</span>
              <span>3D Secure Auth</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">4000 0000 0000 9995</span>
              <span>Insufficient Funds</span>
            </div>
          </div>
          <p className="text-xs mt-2 text-amber-700 dark:text-amber-400">
            Use any future date, any 3 digits for CVC, and any postal code.
          </p>
        </div>
      )}
      
      <Button 
        disabled={isProcessing || !stripe} 
        className="w-full" 
        type="submit"
      >
        {isProcessing ? 'Processing...' : 'Pay with Card'}
      </Button>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Your payment information is securely processed by Stripe.
      </p>
    </form>
  );
};

// Main component that creates payment intent and renders Elements
export default function SimpleStripeCheckout({ 
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
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Create payment intent on component mount
  // Helper function to detect user's country by timezone
  const detectCurrency = (): string => {
    try {
      // Check if we have a URL parameter for currency
      const urlParams = new URLSearchParams(window.location.search);
      const currencyParam = urlParams.get('currency');
      if (currencyParam && ['USD', 'CAD'].includes(currencyParam.toUpperCase())) {
        return currencyParam.toLowerCase();
      }

      // Check if we can detect timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Canadian timezones
      const canadianTimezones = [
        'America/Dawson', 'America/Vancouver', 'America/Whitehorse',
        'America/Edmonton', 'America/Yellowknife', 'America/Cambridge_Bay',
        'America/Inuvik', 'America/Dawson_Creek', 'America/Fort_Nelson',
        'America/Creston', 'America/Regina', 'America/Swift_Current',
        'America/Winnipeg', 'America/Rainy_River', 'America/Resolute',
        'America/Rankin_Inlet', 'America/Iqaluit', 'America/Toronto',
        'America/Thunder_Bay', 'America/Nipigon', 'America/Montreal',
        'America/Moncton', 'America/Halifax', 'America/Glace_Bay',
        'America/St_Johns'
      ];
      
      if (canadianTimezones.includes(timezone)) {
        return 'cad';
      }
      
      // Default to USD
      return 'usd';
    } catch (error) {
      // Default to USD in case of errors
      return 'usd';
    }
  };

  useEffect(() => {
    const createIntent = async () => {
      try {
        // Detect currency based on user's location or URL parameter
        const currency = detectCurrency();
        
        // Try both endpoints - first with API prefix, then without if that fails
        let response = await apiRequest("POST", "/api/payment/create-intent", { 
          amount: amount,
          currency: currency,
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
          response = await apiRequest("POST", "/payment/create-intent", { 
            amount: amount,
            currency: currency, // Use the detected currency
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
          setClientSecret(data.clientSecret);
        } else {
          // Handle specific error responses
          const errorData = await response.json().catch(() => null);
          
          if (errorData?.requiresEmail || (errorData?.message && errorData.message.includes("Email address is required"))) {
            toast({
              title: "Email Required",
              description: "Please add an email address to your profile to receive tickets. Go to your profile settings to update your email.",
              variant: "destructive",
            });
            
            // Open profile modal after a delay
            setTimeout(() => {
              const event = new CustomEvent('sg:open-auth-modal', { 
                detail: { 
                  tab: 'profile'
                } 
              });
              window.dispatchEvent(event);
            }, 2000);
            
            return; // Don't continue with payment setup
          }
          
          throw new Error(errorData?.message || "Failed to create payment intent on both endpoints");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Could not initialize payment. Please try again.";
        
        // Don't show duplicate email error toasts
        if (!errorMessage.includes("Email address is required")) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    createIntent();
  }, [amount, eventId, eventTitle, ticketId, ticketName, toast]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!clientSecret) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="text-red-500 font-medium">
          Could not initialize payment form.
        </div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <Elements 
      key={`stripe-elements-${clientSecret}`}
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: { 
          theme: 'flat',
          variables: {
            colorPrimary: '#E91E63',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '4px'
          }
        }
      }}
    >
      <CheckoutForm 
        amount={amount} 
        eventId={eventId} 
        eventTitle={eventTitle}
        ticketId={ticketId}
        ticketName={ticketName}
        userData={userData}
      />
    </Elements>
  );
}