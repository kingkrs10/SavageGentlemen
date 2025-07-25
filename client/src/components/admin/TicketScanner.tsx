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
  StopCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

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
  const html5QrcodeScannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  useEffect(() => {
    // Focus input on component mount if we're in manual mode
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
    
    // Clean up camera when switching modes
    if (scanMode !== 'camera') {
      stopCamera();
    }
  }, [scanMode]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
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

  // Start camera for live QR scanning using html5-qrcode
  const startCamera = async () => {
    try {
      setError(null);
      setLoading(true);

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser. Please use Photo Upload mode instead.');
        setLoading(false);
        return;
      }

      // Test camera access first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' 
          } 
        });
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError: any) {
        setLoading(false);
        setCameraActive(false);
        
        let errorMessage = 'Camera access denied. ';
        if (permissionError.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera access in your browser settings and try again.';
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage += 'Camera is being used by another application.';
        } else {
          errorMessage += 'Please check your camera permissions.';
        }
        
        setError(errorMessage);
        toast({
          title: "Camera Permission Required",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      setCameraActive(true);

      // Clean up any existing scanner
      if (html5QrcodeScannerRef.current) {
        try {
          await html5QrcodeScannerRef.current.clear();
        } catch (e) {
          console.log('Previous scanner already cleared');
        }
        html5QrcodeScannerRef.current = null;
      }

      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Success callback when QR code is scanned
      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        console.log('QR Code automatically detected:', decodedText);
        
        // Immediate visual feedback
        toast({
          title: "✓ QR Code Detected!", 
          description: "Automatically processing ticket...",
          variant: "default"
        });

        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Success vibration pattern
        }

        // Set the detected code and validate
        setTicketCode(decodedText);
        validateTicket(decodedText);
        stopCamera();
      };

      // Error callback for scanning issues
      const qrCodeErrorCallback = (errorMessage: string) => {
        // Only log significant errors, ignore routine scanning messages
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
          console.error('Camera permission error:', errorMessage);
          setError('Camera permission denied. Please allow camera access.');
          setCameraActive(false);
          setLoading(false);
        }
        // Ignore routine "No QR code found" messages - they're normal during scanning
      };

      // Enhanced configuration for html5-qrcode scanner
      const config = {
        fps: 5, // Reduced for better performance
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment' // Use back camera on mobile
        },
        formatsToSupport: [0], // Only QR codes
        showTorchButtonIfSupported: true, // Show flashlight if available
        showZoomSliderIfSupported: false,
        defaultZoomValueIfSupported: 2
      };

      // Create new Html5QrcodeScanner instance
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false // verbose logging disabled
      );

      // Start the scanner with error handling
      try {
        html5QrcodeScannerRef.current.render(
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        );
        
        setLoading(false);
        
        toast({
          title: "🎥 Camera Active",
          description: "AUTO-SCAN ACTIVE - Point camera at QR code",
          variant: "default"
        });
        
        console.log('Html5QrcodeScanner started successfully');
        
      } catch (renderError) {
        console.error('Scanner render error:', renderError);
        throw renderError;
      }
      
    } catch (error) {
      console.error('Error starting camera:', error);
      
      let errorMessage = 'Failed to start camera. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Permission') || error.message.includes('NotAllowed')) {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (error.message.includes('NotFound')) {
          errorMessage = 'No camera found on this device. Please use Photo Upload mode instead.';
        } else if (error.message.includes('NotReadable')) {
          errorMessage = 'Camera is being used by another application. Please close other camera apps and try again.';
        } else if (error.message.includes('OverConstrained')) {
          errorMessage = 'Camera settings not supported. Please try a different device or use Photo Upload mode.';
        } else {
          errorMessage += 'Please try Photo Upload mode instead, or check your camera permissions.';
        }
      } else {
        errorMessage += 'Please try Photo Upload mode instead.';
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

  // Stop camera using html5-qrcode
  const stopCamera = async () => {
    try {
      if (html5QrcodeScannerRef.current) {
        // Use Html5QrcodeScanner's clear method
        await html5QrcodeScannerRef.current.clear().catch((err) => {
          console.log('Scanner already cleared or not running');
        });
        html5QrcodeScannerRef.current = null;
      }
      setCameraActive(false);
    } catch (error) {
      console.log('Scanner cleanup completed');
      setCameraActive(false);
    }
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
        // Use Html5Qrcode to scan QR code from the uploaded image
        const result = await Html5Qrcode.scanFile(file, true);
        
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
        
        // Switch to manual input mode if upload fails
        setScanMode('manual');
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
      
      setLoading(false);
    }
  };
  
  // Validate ticket by sending to backend
  const validateTicket = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a ticket code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Clean the code - remove any extra whitespace or formatting
      const cleanCode = code.trim();
      
      // Call the scan API endpoint using proper authentication
      const response = await apiRequest('POST', '/api/tickets/scan', { ticketCode: cleanCode });
      
      const result = await response.json();
      
      if (response.ok) {
        // Success - valid ticket
        setTicketInfo(result.ticket);
        
        toast({
          title: result.alreadyScanned ? "Already Scanned" : "✅ ENTRY APPROVED",
          description: result.alreadyScanned 
            ? `Previously scanned on ${new Date(result.ticket.scannedAt).toLocaleDateString()}`
            : "Ticket validated successfully",
          variant: result.alreadyScanned ? "default" : "default"
        });

        // Enhanced haptic feedback for success
        if (navigator.vibrate) {
          if (result.alreadyScanned) {
            navigator.vibrate([200, 100, 200]); // Duplicate pattern
          } else {
            navigator.vibrate([100, 50, 100, 50, 100]); // Success pattern
          }
        }
        
      } else {
        // Error - invalid ticket or server error
        setError(result.error || 'Failed to validate ticket');
        
        toast({
          title: "❌ ENTRY DENIED",
          description: result.error || 'Invalid ticket code',
          variant: "destructive"
        });

        // Error haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([500]); // Error vibration
        }
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      setError('Failed to validate ticket. Please check your connection.');
      
      toast({
        title: "Connection Error",
        description: "Please check your internet connection",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateTicket(ticketCode);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 space-y-4">
      {/* Mode Selection */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Ticket Scanner</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose your preferred scanning method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setScanMode('manual')}
              className="flex-1 text-xs sm:text-sm"
            >
              <KeyboardIcon className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={() => setScanMode('camera')}
              className="flex-1 text-xs sm:text-sm"
            >
              <Video className="mr-2 h-4 w-4" />
              Live Camera
            </Button>
            <Button
              variant={scanMode === 'upload' ? 'default' : 'outline'}
              onClick={() => setScanMode('upload')}
              className="flex-1 text-xs sm:text-sm"
            >
              <Camera className="mr-2 h-4 w-4" />
              Photo Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="shadow-sm">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {ticketInfo && (
        <Card className="shadow-md border-green-200 bg-green-50">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center text-green-800 text-lg sm:text-xl">
              <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
              {ticketInfo.scannedAt ? 'Previously Scanned' : '✅ ENTRY APPROVED'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-semibold text-green-800">Event:</p>
                <p className="text-green-700">{ticketInfo.eventName}</p>
              </div>
              <div>
                <p className="font-semibold text-green-800">Ticket:</p>
                <p className="text-green-700">{ticketInfo.ticketName}</p>
              </div>
              <div>
                <p className="font-semibold text-green-800">Date:</p>
                <p className="text-green-700">{ticketInfo.eventDate}</p>
              </div>
              <div>
                <p className="font-semibold text-green-800">Location:</p>
                <p className="text-green-700">{ticketInfo.eventLocation}</p>
              </div>
              <div>
                <p className="font-semibold text-green-800">Order ID:</p>
                <p className="text-green-700">#{ticketInfo.orderId}</p>
              </div>
              {ticketInfo.scannedAt && (
                <div>
                  <p className="font-semibold text-green-800">First Scanned:</p>
                  <p className="text-green-700">{new Date(ticketInfo.scannedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={resetScanner}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Scan Next Ticket
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Manual Entry Mode */}
      {!ticketInfo && scanMode === 'manual' && (
        <Card className="shadow-md">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">Manual Entry</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter the ticket code manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter ticket code (e.g., SGX-TIX-123-456 or EVENT-7-ORDER-67-123456)"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                className="text-center text-lg font-mono"
                disabled={loading}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold"
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

      {/* Camera Scanning Mode */}
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
                  {/* Html5QrcodeScanner container */}
                  <div 
                    id="qr-scanner-container" 
                    className="w-full max-w-[400px] mx-auto rounded-lg overflow-hidden"
                    style={{ minHeight: '300px' }}
                  >
                    {/* Scanner will be injected here by html5-qrcode */}
                  </div>
                  
                  {/* Enhanced scanning indicators overlay */}
                  <div className="w-full max-w-[280px] mx-auto mt-2">
                    <div className="bg-green-500 text-white px-3 py-2 rounded-full text-xs font-bold text-center animate-pulse">
                      🎯 AUTO-SCAN ACTIVE - Point at QR code
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Mode */}
      {!ticketInfo && scanMode === 'upload' && (
        <Card className="shadow-md">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl">Photo Upload</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Take a photo of the QR code or upload an image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full aspect-square max-w-[280px] border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50">
                <div className="text-center p-4">
                  <Camera className="h-16 w-16 mx-auto text-blue-500 mb-3" />
                  <p className="text-sm font-medium text-blue-700 mb-1">Upload QR Code Image</p>
                  <p className="text-xs text-blue-600">Take a photo or select from gallery</p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="space-y-3 w-full">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Scanning Image...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-6 w-6" />
                      Take Photo / Upload
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Photo not working? Try live camera instead
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanMode('camera')}
                    className="text-xs"
                  >
                    Switch to Live Camera
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketScanner;