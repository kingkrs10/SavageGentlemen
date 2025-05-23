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
      <Card className={`mt-4 shadow-md ${isScanned ? 'border-amber-500' : 'border-green-500'}`}>
        <CardHeader className={`pb-3 ${isScanned ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
          <div className="flex flex-col items-center text-center pb-2 sm:pb-3">
            <div className="rounded-full bg-white p-2 mb-2 shadow-sm">
              {isScanned ? (
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 shrink-0" />
              )}
            </div>
            <CardTitle className="text-lg sm:text-xl">
              {isScanned ? 'Ticket Already Scanned' : 'Ticket Valid'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {isScanned && ticketInfo.scannedAt
                ? `This ticket was previously scanned on ${new Date(ticketInfo.scannedAt as string).toLocaleString()}`
                : 'This ticket is valid and has been marked as scanned'}
            </CardDescription>
          </div>
          
          <div className="w-full h-px bg-border my-2"></div>
          
          <div className="font-bold text-lg sm:text-xl text-center">
            {ticketInfo.eventName}
          </div>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4">
          <div className="space-y-3 text-sm sm:text-base">
            <div className="grid grid-cols-3 gap-1 border-b pb-2">
              <span className="font-semibold col-span-1">Ticket:</span> 
              <span className="col-span-2 font-medium">{ticketInfo.ticketName}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-2">
              <span className="font-semibold col-span-1">Date:</span> 
              <span className="col-span-2">{new Date(ticketInfo.eventDate).toLocaleDateString()} {new Date(ticketInfo.eventDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-2">
              <span className="font-semibold col-span-1">Location:</span> 
              <span className="col-span-2">{ticketInfo.eventLocation}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-2">
              <span className="font-semibold col-span-1">Ticket ID:</span> 
              <span className="col-span-2">{ticketInfo.ticketId}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 border-b pb-2">
              <span className="font-semibold col-span-1">Order ID:</span> 
              <span className="col-span-2">{ticketInfo.orderId}</span>
            </div>
            {ticketInfo.scannedAt && (
              <div className="grid grid-cols-3 gap-1 text-amber-700 border-b pb-2">
                <span className="font-semibold col-span-1">Scanned:</span> 
                <span className="col-span-2">{new Date(ticketInfo.scannedAt as string).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={resetScanner} 
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            Scan Another Ticket
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="flex flex-col items-center px-2 sm:px-4 py-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Ticket Scanner</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="text-base">Error</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {!ticketInfo && (
          <Card className="shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">Scan Ticket</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
                    className="w-full text-base sm:text-lg h-12 px-3"
                    autoFocus
                    autoComplete="off"
                    disabled={loading}
                  />
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Type or paste the ticket code that appears in the QR code
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Try "DEMO-TICKET" to see a working example
                    </p>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full flex items-center justify-center h-12 text-base" 
                  disabled={loading || !ticketCode.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <TicketIcon className="mr-2 h-5 w-5" />
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