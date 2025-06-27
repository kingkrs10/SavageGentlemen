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
  KeyboardIcon,
  Video,
  StopCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import QrScanner from 'qr-scanner';

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
  const [scanMode, setScanMode] = useState<'manual' | 'upload' | 'camera'>('manual');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  
  useEffect(() => {
    // Focus input on component mount if we're in manual mode
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
    
    // Clean up camera when switching modes
    if (scanMode !== 'camera' && qrScannerRef.current) {
      stopCamera();
    }
  }, [scanMode]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        stopCamera();
      }
    };
  }, []);
  
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

  // Start camera for live QR scanning with alternative initialization
  const startCamera = async () => {
    try {
      setError(null);
      setLoading(true);

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser');
        setLoading(false);
        return;
      }

      // First, request camera permission to ensure it's available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          } 
        });
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        setLoading(false);
        const error = permissionError as any;
        if (error?.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error?.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Camera access failed. Please check your camera permissions.');
        }
        return;
      }

      // Alternative approach: Create video element manually if ref is not ready
      let video = videoRef.current;
      if (!video) {
        // Force component re-render to ensure video element exists
        setCameraActive(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        video = videoRef.current;
        if (!video) {
          setError('Unable to initialize video element. Please try refreshing the page.');
          setLoading(false);
          return;
        }
      }

      // Set video element properties for mobile compatibility
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('disablepictureinpicture', 'true');
      video.muted = true;
      video.autoplay = true;

      setCameraActive(true);

      // Use QrScanner with a more robust initialization
      try {
        qrScannerRef.current = new QrScanner(
          video,
          (result) => {
            console.log('QR Code detected:', result.data);
            
            toast({
              title: "QR Code Detected", 
              description: "Processing ticket information...",
              variant: "default"
            });
            
            setTicketCode(result.data);
            validateTicket(result.data);
            stopCamera();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 2,
            preferredCamera: 'environment',
            returnDetailedScanResult: true
          }
        );

        // Start scanner with delay to ensure video is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        await qrScannerRef.current.start();
        
        setLoading(false);
        
        toast({
          title: "Camera Started",
          description: "Point your camera at a QR code to scan",
          variant: "default"
        });
        
        console.log('QR Scanner started successfully');
        
      } catch (scannerError) {
        console.error('QR Scanner initialization failed:', scannerError);
        setCameraActive(false);
        setLoading(false);
        
        const error = scannerError as any;
        if (error?.message?.includes('video element')) {
          setError('Camera initialization failed. Please try using the "Photo" mode instead.');
        } else {
          setError(`Scanner error: ${error?.message || 'Failed to start QR scanner'}`);
        }
        
        if (qrScannerRef.current) {
          try {
            qrScannerRef.current.destroy();
          } catch (e) {
            console.warn('Error destroying scanner:', e);
          }
          qrScannerRef.current = null;
        }
      }
      
    } catch (error) {
      console.error('Error starting camera:', error);
      let errorMessage = 'Failed to start camera. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Camera is being used by another application.';
        } else {
          errorMessage += 'Please check your camera and try again.';
        }
      } else {
        errorMessage += 'Please check your camera and try again.';
      }
      
      setError(errorMessage);
      setCameraActive(false);
      setLoading(false);
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setCameraActive(false);
  };
  
  // Reference for the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to handle file input for QR code image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setError(null);
      setLoading(true);
      
      try {
        // Use QrScanner to scan QR code from the uploaded image
        const result = await QrScanner.scanImage(file);
        
        if (result) {
          // Successfully scanned QR code
          toast({
            title: "QR Code Detected",
            description: "Processing ticket information...",
            variant: "default"
          });
          
          // Set the scanned code and validate it
          setTicketCode(result);
          await validateTicket(result);
        } else {
          throw new Error("No QR code found in the image");
        }
      } catch (error) {
        console.error('QR Code scanning error:', error);
        setError("Could not detect QR code in the image. Please try again or enter the code manually.");
        
        toast({
          title: "Scan Failed",
          description: "Please try taking another photo or enter the code manually",
          variant: "destructive"
        });
        
        // Switch to manual mode for fallback
        setScanMode('manual');
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 500);
      } finally {
        setLoading(false);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  
  // Function to trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to cycle between scanning modes
  const cycleScanMode = () => {
    if (scanMode === 'manual') {
      setScanMode('camera');
    } else if (scanMode === 'camera') {
      setScanMode('upload');
    } else {
      setScanMode('manual');
    }
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
      // Support multiple formats:
      // 1. New format: EVENT-{eventId}-ORDER-{orderId}-{timestamp}
      // 2. Manual format: EVENT-{eventId}-ORDER-MANUAL-{timestamp}
      // 3. Legacy format: SGX-TIX-ticketId-orderId
      const codeParts = code.split('-');
      let isValidFormat = false;
      
      if (codeParts.length >= 4) {
        // Check for EVENT-X-ORDER format
        if (codeParts[0] === 'EVENT' && codeParts[2] === 'ORDER') {
          isValidFormat = true;
        }
        // Check for legacy SGX-TIX format
        else if (codeParts.length === 4 && codeParts[0] === 'SGX' && codeParts[1] === 'TIX') {
          isValidFormat = true;
        }
      }
      
      if (!isValidFormat) {
        setError('Invalid ticket format. Expected format: EVENT-{eventId}-ORDER-{orderId}-{timestamp} or SGX-TIX-ticketId-orderId');
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
            <div className="bg-muted rounded-lg p-1 inline-flex flex-wrap">
              <Button
                type="button"
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center text-xs sm:text-sm mb-1 sm:mb-0"
                onClick={() => setScanMode('manual')}
              >
                <KeyboardIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Manual
              </Button>
              <Button
                type="button"
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center text-xs sm:text-sm mb-1 sm:mb-0"
                onClick={() => setScanMode('camera')}
              >
                <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Live Scan
              </Button>
              <Button
                type="button"
                variant={scanMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center text-xs sm:text-sm"
                onClick={() => setScanMode('upload')}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Photo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
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
          <Card className="shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">Live QR Scanner</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use your camera to scan QR codes in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {!cameraActive ? (
                  <>
                    <div className="w-full aspect-square max-w-[280px] border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center bg-green-50">
                      <div className="text-center p-4">
                        <Video className="h-16 w-16 mx-auto text-green-500 mb-3" />
                        <p className="text-sm font-medium text-green-700 mb-1">Start Live Scanner</p>
                        <p className="text-xs text-green-600">Point camera at QR code for instant scanning</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={startCamera} 
                        className="w-full flex items-center justify-center h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Starting Camera...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-6 w-6" />
                            Start Camera
                          </>
                        )}
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">
                          Camera not working? Try photo mode instead
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setScanMode('upload')}
                          className="text-xs"
                        >
                          Switch to Photo Mode
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full aspect-square max-w-[280px] rounded-lg overflow-hidden bg-black relative">
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                        controls={false}
                        onLoadedMetadata={() => console.log('Video metadata loaded')}
                        onLoadedData={() => console.log('Video data loaded')}
                        onCanPlay={() => console.log('Video can play')}
                      />
                      <div className="absolute inset-0 border-2 border-green-400 rounded-lg"></div>
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Live Scanner Active
                      </div>
                    </div>
                    
                    <Button 
                      onClick={stopCamera} 
                      variant="outline"
                      className="w-full flex items-center justify-center h-12 text-base border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <StopCircle className="mr-2 h-5 w-5" />
                      Stop Camera
                    </Button>
                  </>
                )}
                
                <div className="flex flex-col space-y-1 w-full">
                  <p className="text-xs text-muted-foreground">
                    Most accurate method for scanning tickets
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Automatically detects QR codes and validates tickets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!ticketInfo && scanMode === 'upload' && (
          <Card className="shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl">Take a Photo</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Take a photo of the ticket QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full aspect-square max-w-[280px] border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50">
                  <div className="text-center p-4">
                    <Camera className="h-16 w-16 mx-auto text-blue-500 mb-3" />
                    <p className="text-sm font-medium text-blue-700 mb-1">Position QR code in frame</p>
                    <p className="text-xs text-blue-600">Ensure good lighting for best results</p>
                  </div>
                </div>
                
                <Button 
                  onClick={triggerFileUpload} 
                  className="w-full flex items-center justify-center h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Scanning QR Code...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-6 w-6" />
                      Take Photo & Scan
                    </>
                  )}
                </Button>
                
                <div className="flex flex-col space-y-1 w-full">
                  <p className="text-xs text-muted-foreground">
                    Alternative method for checking tickets
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Make sure there's good lighting for best results
                  </p>
                </div>
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