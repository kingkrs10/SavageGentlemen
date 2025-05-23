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
import { 
  Ticket as TicketIcon, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Camera, 
  CameraOff,
  Smartphone,
  KeyboardIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import QrReader from 'react-qr-scanner';

// Add TypeScript declaration for react-qr-scanner
declare module 'react-qr-scanner';

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
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'rear' | 'front'>('rear');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus input on component mount if we're in manual mode
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);
  
  const resetScanner = () => {
    setTicketCode('');
    setTicketInfo(null);
    setError(null);
    
    // Re-focus the input if in manual mode
    if (scanMode === 'manual') {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };
  
  // Function to handle QR scanner errors
  const handleScanError = (err: any) => {
    console.error('QR Scanner error:', err);
    if (err.name === 'NotAllowedError') {
      setCameraPermission(false);
      setError('Camera access denied. Please enable camera permissions.');
    } else {
      setError(`Scanner error: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Function to handle successful QR code scan
  const handleScanSuccess = (data: any) => {
    if (data && !loading && !ticketInfo) {
      // Extract the text from scanned QR code
      const scannedText = data.text;
      if (scannedText && scannedText.trim() !== '') {
        setTicketCode(scannedText);
        validateTicket(scannedText);
      }
    }
  };
  
  // Function to toggle camera facing mode
  const toggleCamera = () => {
    setFacingMode(facingMode === 'rear' ? 'front' : 'rear');
  };
  
  // Function to toggle between manual and camera scanning modes
  const toggleScanMode = () => {
    setScanMode(scanMode === 'manual' ? 'camera' : 'manual');
    setError(null);
  };
  
  // Extract the validation logic to a separate function for reuse
  const validateTicket = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a ticket code');
      return;
    }

    // For this demo, we'll create fake success data in case the API isn't returning the expected response
    // This allows you to see how the UI will look with a valid ticket
    if (code === "DEMO-TICKET") {
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
      console.log('Sending ticket code for validation:', code);
      
      // Validate format before sending to server
      const codeParts = code.split('-');
      if (codeParts.length !== 4 || codeParts[0] !== 'SGX' || codeParts[1] !== 'TIX') {
        setError('Invalid ticket format. Expected format: SGX-TIX-ticketId-orderId');
        setLoading(false);
        return;
      }

      const response = await apiRequest('POST', '/api/tickets/scan', { ticketCode: code });
      
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

  // Handle form submission for manual entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateTicket(ticketCode);
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
        
        {!ticketInfo && (
          <div className="mb-4 flex justify-center">
            <div className="bg-muted rounded-lg p-1 inline-flex">
              <Button
                type="button"
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center text-xs sm:text-sm"
                onClick={() => setScanMode('manual')}
              >
                <KeyboardIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Manual Entry
              </Button>
              <Button
                type="button"
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center text-xs sm:text-sm"
                onClick={() => setScanMode('camera')}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Camera Scan
              </Button>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="text-base">Error</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {!ticketInfo && scanMode === 'manual' && (
          <Card className="shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">Enter Ticket Code</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Type or paste the ticket code
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
        
        {!ticketInfo && scanMode === 'camera' && (
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">Scan QR Code</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Point your camera at the ticket QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-square overflow-hidden bg-black">
                  <QrReader
                    delay={300}
                    onError={handleScanError}
                    onScan={handleScanSuccess}
                    style={{ width: '100%' }}
                    constraints={{
                      video: {
                        facingMode: facingMode === 'rear' ? 'environment' : 'user'
                      }
                    }}
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                <div className="absolute top-3 right-3">
                  <Button 
                    onClick={toggleCamera} 
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-col space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">
                    Position the QR code within the camera view
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Make sure there's good lighting for best results
                  </p>
                </div>
                {cameraPermission === false && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertTitle className="text-sm">Camera Access Denied</AlertTitle>
                    <AlertDescription className="text-xs">
                      Please allow camera access in your browser settings to use the scanner.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {renderStatusCard()}
      </div>
    </div>
  );
};

export default TicketScanner;