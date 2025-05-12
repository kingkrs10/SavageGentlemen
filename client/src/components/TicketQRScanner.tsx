import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, TicketIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TicketInfo {
  ticketId: number;
  orderId: number;
  eventName: string;
  ticketName: string;
  holderName: string;
  isValid: boolean;
  scannedAt?: string;
  status: 'valid' | 'invalid' | 'already_used';
}

const TicketQRScanner: React.FC = () => {
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
    
    setLoading(true);
    setError(null);
    
    try {
      // Parse the ticket identifier (SGX-TIX-orderId-ticketId)
      const parts = ticketCode.split('-');
      
      if (parts.length !== 4 || parts[0] !== 'SGX' || parts[1] !== 'TIX') {
        throw new Error('Invalid ticket format. Expected format: SGX-TIX-orderId-ticketId');
      }
      
      const orderId = parseInt(parts[2]);
      const ticketId = parseInt(parts[3]);
      
      if (isNaN(orderId) || isNaN(ticketId)) {
        throw new Error('Invalid ticket identifier. Order ID and Ticket ID must be numbers.');
      }
      
      console.log('Validating ticket:', { orderId, ticketId });
      
      // Validate the ticket with the server
      const response = await apiRequest('POST', '/api/admin/tickets/validate', {
        orderId,
        ticketId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate ticket');
      }
      
      const result = await response.json();
      setTicketInfo(result);
      
      // Show toast based on validation result
      if (result.status === 'valid') {
        toast({
          title: "Valid Ticket",
          description: `Ticket for ${result.eventName} has been validated.`,
        });
      } else if (result.status === 'already_used') {
        toast({
          title: "Already Used",
          description: `This ticket has already been scanned at ${new Date(result.scannedAt).toLocaleString()}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invalid Ticket",
          description: "This ticket is not valid.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error validating ticket:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Error",
        description: "Failed to validate ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderStatusCard = () => {
    if (!ticketInfo) return null;
    
    return (
      <Card className={`mt-4 ${
        ticketInfo.status === 'valid' 
          ? 'border-green-500' 
          : ticketInfo.status === 'already_used' 
            ? 'border-yellow-500' 
            : 'border-red-500'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {ticketInfo.status === 'valid' && (
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            )}
            {ticketInfo.status === 'already_used' && (
              <RefreshCw className="mr-2 h-5 w-5 text-yellow-500" />
            )}
            {ticketInfo.status === 'invalid' && (
              <XCircle className="mr-2 h-5 w-5 text-red-500" />
            )}
            {ticketInfo.status === 'valid' 
              ? 'Valid Ticket' 
              : ticketInfo.status === 'already_used' 
                ? 'Already Scanned' 
                : 'Invalid Ticket'
            }
          </CardTitle>
          <CardDescription>
            {ticketInfo.eventName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Ticket Type:</span> {ticketInfo.ticketName}
            </div>
            <div>
              <span className="font-semibold">Holder:</span> {ticketInfo.holderName}
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
                  <TicketIcon className="mr-2 h-4 w-4" />
                  {loading ? 'Validating...' : 'Validate Ticket'}
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

export default TicketQRScanner;