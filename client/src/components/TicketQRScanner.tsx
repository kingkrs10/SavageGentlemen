import React, { useState, useEffect } from 'react';
import QrReader from 'react-qr-scanner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
  const [scanning, setScanning] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Start scanning when component mounts
  useEffect(() => {
    // Delay starting the scanner to avoid browser issues
    const timer = setTimeout(() => {
      startScanning();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const startScanning = () => {
    setScanning(true);
    setScannedData(null);
    setTicketInfo(null);
    setError(null);
  };
  
  const stopScanning = () => {
    setScanning(false);
  };
  
  const handleScan = async (data: { text: string } | null) => {
    // Only process if we have data and it's not already being processed
    if (!data || !data.text || loading || scannedData === data.text) return;
    
    setScannedData(data.text);
    setLoading(true);
    stopScanning();
    
    try {
      // Parse the ticket identifier (SGX-TIX-orderId-ticketId)
      const parts = data.text.split('-');
      
      if (parts.length !== 4 || parts[0] !== 'SGX' || parts[1] !== 'TIX') {
        throw new Error('Invalid QR code format');
      }
      
      const orderId = parseInt(parts[2]);
      const ticketId = parseInt(parts[3]);
      
      if (isNaN(orderId) || isNaN(ticketId)) {
        throw new Error('Invalid ticket identifier');
      }
      
      // Validate the ticket with the server
      const response = await apiRequest('POST', '/admin/tickets/validate', {
        orderId,
        ticketId
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate ticket');
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
  
  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
    setError('Camera error. Please check permissions and try again.');
    setScanning(false);
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
          <Button onClick={startScanning} className="w-full">
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
        
        {scanning ? (
          <div className="relative">
            <QrReader
              delay={500}
              style={{ width: '100%' }}
              onError={handleError}
              onScan={handleScan}
              constraints={{
                video: {
                  facingMode: 'environment'
                }
              }}
            />
            <div className="absolute top-2 right-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopScanning}
                className="bg-white/80 hover:bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          !ticketInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Scanner</CardTitle>
                <CardDescription>
                  Scan QR codes to validate event tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-8">
                <Button onClick={startScanning} className="sg-btn" disabled={loading}>
                  {loading ? 'Processing...' : 'Start Scanning'}
                </Button>
              </CardContent>
            </Card>
          )
        )}
        
        {renderStatusCard()}
      </div>
    </div>
  );
};

export default TicketQRScanner;