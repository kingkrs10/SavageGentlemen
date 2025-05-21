import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Ticket as TicketIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface TicketInfo {
  ticketId: number;
  orderId: number;
  ticketName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  purchaseDate: string;
  scannedAt?: string;
}

const TicketScanner = () => {
  const [ticketCode, setTicketCode] = useState<string>('');
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const resetScanner = () => {
    setTicketCode('');
    setTicketInfo(null);
    setError(null);
    
    // Re-focus the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketCode.trim()) {
      setError('Please enter a ticket code');
      return;
    }

    // For this demo, we'll create fake success data in case the API isn't returning the expected response
    // This allows you to see how the UI will look with a valid ticket
    if (ticketCode === "DEMO-TICKET") {
      const demoTicket: TicketInfo = {
        ticketId: 7,
        orderId: 1,
        ticketName: "Early Bird Ladies",
        eventName: "Riddem Riot",
        eventDate: "2025-05-27T21:00:00",
        eventLocation: "Club Galaxy",
        purchaseDate: "2025-05-09T19:15:54.761Z"
      };
      
      setTicketInfo(demoTicket);
      toast({
        title: "Demo Mode",
        description: "Using demo ticket data for preview",
        variant: "default"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending ticket code for validation:', ticketCode);
      
      // Validate format before sending to server
      const codeParts = ticketCode.split('-');
      if (codeParts.length !== 4 || codeParts[0] !== 'SGX' || codeParts[1] !== 'TIX') {
        setError('Invalid ticket format. Expected format: SGX-TIX-ticketId-orderId');
        setLoading(false);
        return;
      }

      const response = await apiRequest('POST', '/api/tickets/scan', { ticketCode });
      
      if (!response.ok) {
        // Get the error details
        let errorMessage = 'Failed to validate ticket';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response data
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Failed to parse success response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (result.valid) {
        setTicketInfo(result.ticketInfo);
        
        if (result.alreadyScanned) {
          // Show warning for already scanned tickets
          toast({
            title: "Ticket Already Scanned",
            description: `This ticket was previously scanned on ${new Date(result.scannedAt).toLocaleString()}`,
            variant: "destructive"
          });
        } else {
          // Success for newly scanned tickets
          toast({
            title: "Ticket Valid",
            description: "Ticket has been successfully scanned and verified",
            variant: "default"
          });
        }
      } else {
        setError(result.error || 'Invalid ticket');
      }
    } catch (err) {
      console.error('Error scanning ticket:', err);
      setError((err as Error).message || 'Failed to scan ticket');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStatusCard = () => {
    if (!ticketInfo) return null;
    
    const isScanned = ticketInfo.scannedAt !== undefined;
    
    return (
      <Card className={`mt-4 ${isScanned ? 'border-yellow-500' : 'border-green-500'}`}>
        <CardHeader className={`${isScanned ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
          <div className="flex items-center gap-2">
            {isScanned ? (
              <CheckCircle className="h-6 w-6 text-yellow-500" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            <CardTitle>
              {isScanned ? 'Ticket Already Scanned' : 'Ticket Valid'}
            </CardTitle>
          </div>
          <CardDescription>
            {isScanned && ticketInfo.scannedAt
              ? `This ticket was previously scanned on ${new Date(ticketInfo.scannedAt).toLocaleString()}`
              : 'This ticket is valid and has been marked as scanned'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="font-bold text-xl">
              {ticketInfo.eventName}
            </div>
            <div>
              <span className="font-semibold">Ticket Type:</span> {ticketInfo.ticketName}
            </div>
            <div>
              <span className="font-semibold">Event Date:</span> {new Date(ticketInfo.eventDate).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Location:</span> {ticketInfo.eventLocation}
            </div>
            <div>
              <span className="font-semibold">Ticket ID:</span> {ticketInfo.ticketId}
            </div>
            <div>
              <span className="font-semibold">Order ID:</span> {ticketInfo.orderId}
            </div>
            {ticketInfo.scannedAt && (
              <div>
                <span className="font-semibold">Previously Scanned:</span> {new Date(ticketInfo.scannedAt).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={resetScanner} className="w-full">
            Scan Another Ticket
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!ticketInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Ticket Scanner</CardTitle>
              <CardDescription>
                Enter the ticket code from the QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="SGX-TIX-123-456"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    className="w-full"
                    autoFocus
                    autoComplete="off"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Type or paste the ticket code that appears in the QR code
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full flex items-center justify-center" 
                  disabled={loading || !ticketCode.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <TicketIcon className="mr-2 h-4 w-4" />
                      Validate Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        
        {renderStatusCard()}
      </div>
    </div>
  );
};

export default TicketScanner;