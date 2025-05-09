import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  useEffect(() => {
    // Try to get payment details from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentParam = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const provider = searchParams.get('provider');
    const orderId = searchParams.get('order_id');
    const eventId = searchParams.get('eventId');
    const eventTitle = searchParams.get('eventTitle');
    
    // Check first if we have event details - this is a ticket purchase
    if (eventId && eventTitle) {
      setPaymentDetails({
        id: paymentIntentParam || `order-${Date.now()}`,
        type: 'stripe',
        isEventTicket: true,
        eventId: eventId,
        eventTitle: decodeURIComponent(eventTitle),
        ticketType: 'Standard Admission'
      });
    } else if (paymentIntentParam && paymentIntentClientSecret) {
      // For regular Stripe payments
      setPaymentDetails({
        id: paymentIntentParam,
        type: 'stripe'
      });
    } else if (provider === 'paypal' && orderId) {
      // For PayPal payments - fetch order details if needed
      // Check if this is a ticket purchase (for PayPal)
      if (eventId && eventTitle) {
        setPaymentDetails({
          id: orderId,
          type: 'paypal',
          isEventTicket: true,
          eventId: eventId,
          eventTitle: decodeURIComponent(eventTitle),
          ticketType: 'Standard Admission'
        });
      } else {
        // For regular PayPal purchases
        fetch(`/api/payment/paypal-order/${orderId}/details`)
          .then(response => {
            if (response.ok) return response.json();
            return { id: orderId };
          })
          .then(data => {
            setPaymentDetails({
              id: orderId,
              type: 'paypal',
              amount: data.amount,
              status: data.status || 'completed'
            });
          })
          .catch(error => {
            console.error('Error fetching PayPal order details:', error);
            setPaymentDetails({
              id: orderId,
              type: 'paypal'
            });
          });
      }
    } else {
      // For other payment methods where we might not have URL params
      setPaymentDetails({
        id: `order-${Date.now()}`,
        type: 'other'
      });
    }
    
    // You could also fetch order details from your API here
  }, []);

  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-lg mb-2">Order Details</h3>
              {paymentDetails ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="text-sm break-all font-mono">{paymentDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="capitalize">{paymentDetails.type}</span>
                  </div>
                  {paymentDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span>${paymentDetails.amount}</span>
                    </div>
                  )}
                  {paymentDetails.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{paymentDetails.status}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="animate-pulse">Loading order details...</div>
                </div>
              )}
            </div>
            
            {/* Show Event Ticket Information if available */}
            {paymentDetails?.isEventTicket && (
              <div className="bg-green-50 p-4 rounded-md border-2 border-green-100">
                <h3 className="font-medium text-lg mb-2 text-green-800 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Event Ticket Purchased
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium">{paymentDetails.eventTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Type:</span>
                    <span>{paymentDetails.ticketType}</span>
                  </div>
                  <div className="mt-3 text-sm text-green-800">
                    <p className="mb-1">Your ticket has been reserved and will be sent to your email soon.</p>
                    <p>You'll also find it in your account under "My Tickets".</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">What's Next?</h3>
              <p className="text-sm">
                {paymentDetails?.isEventTicket 
                  ? 'You will receive a confirmation email with your ticket QR code shortly. Save this email, as you\'ll need to show the QR code to enter the event.'
                  : 'You will receive a confirmation email with your purchase details shortly.'}
                {' '}If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => setLocation('/events')}>
            Browse More Events
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setLocation('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}