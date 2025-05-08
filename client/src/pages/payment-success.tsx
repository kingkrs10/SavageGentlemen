import { useEffect, useState } from 'react';
import { useNavigate } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  useEffect(() => {
    // Try to get payment details from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentParam = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    
    if (paymentIntentParam && paymentIntentClientSecret) {
      // For Stripe payments
      setPaymentDetails({
        id: paymentIntentParam,
        type: 'stripe'
      });
    } else {
      // For PayPal or other payment methods where we might not have URL params
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
                    <span>{paymentDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="capitalize">{paymentDetails.type}</span>
                  </div>
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
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">What's Next?</h3>
              <p className="text-sm">
                You will receive a confirmation email with your purchase details shortly.
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => navigate('/events')}>
            Browse More Events
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}