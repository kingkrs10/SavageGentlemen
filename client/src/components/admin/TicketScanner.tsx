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
      
      // Call the scan API endpoint with robust error handling and proper authentication
      console.log('Scanning ticket with code:', cleanCode);
      
      const response = await apiRequest('POST', '/tickets/scan', { ticketCode: cleanCode }, {
        skipErrorThrow: true
      });
      
      console.log('Scanner API response status:', response.status);
      
      if (!response.ok) {
        // Handle non-200 responses
        let errorMessage = 'Failed to validate ticket';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // Response might not be JSON
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        console.error('Scanner API error:', errorMessage);
        setError(errorMessage);
        
        toast({
          title: "❌ VALIDATION FAILED",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Enhanced haptic feedback for error
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]); // Error pattern
        }
        
        return;
      }
      
      const result = await response.json();
      console.log('Scanner API result:', result);
      
      // Check if the result indicates success
      if (result.valid !== false) {
        // Success - valid ticket
        const ticketData = result.ticketInfo || result.ticket || result;
        setTicketInfo(ticketData);
        
        const isAlreadyScanned = result.alreadyScanned || ticketData.alreadyScanned;
        
        toast({
          title: isAlreadyScanned ? "Already Scanned" : "✅ ENTRY APPROVED",
          description: isAlreadyScanned 
            ? `Previously scanned on ${new Date(ticketData.scannedAt || result.scannedAt).toLocaleDateString()}`
            : "Ticket validated successfully",
          variant: isAlreadyScanned ? "default" : "default"
        });

        // Enhanced haptic feedback for success
        if (navigator.vibrate) {
          if (isAlreadyScanned) {
            navigator.vibrate([200, 100, 200]); // Duplicate pattern
          } else {
            navigator.vibrate([100, 50, 100, 50, 100]); // Success pattern
          }
        }
        
      } else {
        // Handle invalid ticket response
        const errorMessage = result.error || result.message || 'Invalid ticket code';
        setError(errorMessage);
        
        toast({
          title: "❌ ENTRY DENIED", 
          description: errorMessage,
          variant: "destructive"
        });

        // Error haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([500]); // Error vibration
        }
      }
    } catch (error) {
      console.error('Ticket validation error:', error);
      
      // More specific error handling
      let errorMessage = 'Connection error - please try again';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network connection failed - check internet connection';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout - server may be busy';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication failed - please refresh and try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Enhanced haptic feedback for connection error
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]); // Connection error pattern
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateTicket(ticketCode);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Mode Selection */}
      <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-lg sm:text-xl font-heading text-gold-400">Optical Ticket Validator</CardTitle>
          <CardDescription className="text-xs font-mono text-gray-400">
            Select high-speed validation mode for gatekeeper entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={scanMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setScanMode('manual')}
              className={`flex-1 text-xs font-mono rounded-xl transition-all ${
                scanMode === 'manual'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian font-bold shadow-md shadow-gold-500/20'
                  : 'border-white/15 text-gray-300 hover:bg-white/5'
              }`}
            >
              <KeyboardIcon className="mr-2 h-4 w-4" />
              Manual Code Entry
            </Button>
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={() => setScanMode('camera')}
              className={`flex-1 text-xs font-mono rounded-xl transition-all ${
                scanMode === 'camera'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian font-bold shadow-md shadow-gold-500/20'
                  : 'border-white/15 text-gray-300 hover:bg-white/5'
              }`}
            >
              <Video className="mr-2 h-4 w-4" />
              Live Optical Camera
            </Button>
            <Button
              variant={scanMode === 'upload' ? 'default' : 'outline'}
              onClick={() => setScanMode('upload')}
              className={`flex-1 text-xs font-mono rounded-xl transition-all ${
                scanMode === 'upload'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian font-bold shadow-md shadow-gold-500/20'
                  : 'border-white/15 text-gray-300 hover:bg-white/5'
              }`}
            >
              <Camera className="mr-2 h-4 w-4" />
              Photo / File Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="bg-red-950/60 border border-red-500/40 text-red-200 rounded-2xl shadow-xl">
          <XCircle className="h-5 w-5 text-red-400" />
          <AlertTitle className="font-heading font-bold text-red-300">Admission Alert</AlertTitle>
          <AlertDescription className="text-xs font-mono text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {ticketInfo && (
        <Card className="glass-obsidian border-2 border-emerald-500/50 bg-emerald-950/20 rounded-2xl shadow-2xl text-white">
          <CardHeader className="pb-2 sm:pb-3 border-b border-emerald-500/20">
            <CardTitle className="flex items-center text-emerald-400 font-heading text-lg sm:text-2xl">
              <CheckCircle className="mr-2.5 h-7 w-7 text-emerald-400" />
              {ticketInfo.scannedAt ? 'Previously Admitted' : 'ENTRY APPROVED'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase">Event</span>
                <span className="text-white font-bold text-sm">{ticketInfo.eventName}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase">Tier</span>
                <span className="text-gold-300 font-bold text-sm">{ticketInfo.ticketName}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase">Date & Time</span>
                <span className="text-gray-300">{ticketInfo.eventDate}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase">Location</span>
                <span className="text-gray-300">{ticketInfo.eventLocation}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-gray-400 block text-[10px] uppercase">Order ID</span>
                <span className="text-white font-bold">#{ticketInfo.orderId}</span>
              </div>
              {ticketInfo.scannedAt && (
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/30">
                  <span className="text-red-400 block text-[10px] uppercase">First Admitted</span>
                  <span className="text-red-200">{new Date(ticketInfo.scannedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              onClick={resetScanner}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-obsidian font-bold text-sm h-12 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Scan Next Ticket
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Manual Entry Mode */}
      {!ticketInfo && scanMode === 'manual' && (
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl font-heading text-white">Manual Passcode Validation</CardTitle>
            <CardDescription className="text-xs font-mono text-gray-400">
              Type or paste the attendee ticket identifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder="e.g. SGX-TIX-1-7 or DEMO-TICKET"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value)}
                className="text-center text-lg font-mono bg-obsidian-card border-white/15 text-gold-300 rounded-xl h-12 tracking-wider"
                disabled={loading}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-sm font-bold bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian rounded-xl shadow-lg shadow-gold-500/20"
                disabled={loading || !ticketCode.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Validating Ticket Code...
                  </>
                ) : (
                  <>
                    <TicketIcon className="mr-2 h-5 w-5" />
                    Verify & Admit Attendee
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Camera Scanning Mode */}
      {!ticketInfo && scanMode === 'camera' && (
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl font-heading text-white">Live Optical QR Scanner</CardTitle>
            <CardDescription className="text-xs font-mono text-gray-400">
              Point your camera at the digital or printed attendee QR pass
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {!cameraActive ? (
                <>
                  <div className="w-full aspect-square max-w-[280px] border-2 border-dashed border-gold-500/30 rounded-2xl flex items-center justify-center bg-white/5">
                    <div className="text-center p-4">
                      <Video className="h-14 w-14 mx-auto text-gold-400 mb-3 animate-pulse" />
                      <p className="text-sm font-heading font-bold text-white mb-1">Optical Camera Ready</p>
                      <p className="text-xs font-mono text-gray-400">Instant hardware scanner integration</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 w-full max-w-sm">
                    <Button 
                      onClick={startCamera} 
                      className="w-full flex items-center justify-center h-12 text-sm font-bold bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian rounded-xl shadow-lg shadow-gold-500/20"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Initializing Camera Feed...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 h-5 w-5" />
                          Activate Scanner Camera
                        </>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setScanMode('upload')}
                        className="text-xs font-mono border-white/15 text-gray-400 hover:text-white rounded-xl"
                      >
                        Switch to Photo Upload Mode
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    id="qr-scanner-container" 
                    className="w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden border border-gold-500/30 shadow-2xl"
                    style={{ minHeight: '300px' }}
                  />
                  
                  <div className="w-full max-w-[280px] mx-auto mt-2">
                    <div className="bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian px-3 py-1.5 rounded-full text-xs font-mono font-bold text-center animate-pulse">
                      TARGET QR CODE FOR AUTO-VALIDATION
                    </div>
                  </div>
                  
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    className="w-full max-w-sm flex items-center justify-center h-11 text-xs font-mono border-red-500/30 text-red-300 hover:bg-red-950/40 rounded-xl"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Camera Feed
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Mode */}
      {!ticketInfo && scanMode === 'upload' && (
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-lg sm:text-xl font-heading text-white">Photo / File Upload</CardTitle>
            <CardDescription className="text-xs font-mono text-gray-400">
              Upload a screenshot or photo of the attendee QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full aspect-square max-w-[280px] border-2 border-dashed border-gold-500/30 rounded-2xl flex items-center justify-center bg-white/5">
                <div className="text-center p-4">
                  <Camera className="h-14 w-14 mx-auto text-gold-400 mb-3" />
                  <p className="text-sm font-heading font-bold text-white mb-1">Upload QR Snapshot</p>
                  <p className="text-xs font-mono text-gray-400">Select PNG, JPG, or camera roll photo</p>
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
              
              <div className="space-y-3 w-full max-w-sm">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center h-12 text-sm font-bold bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-obsidian rounded-xl shadow-lg shadow-gold-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Scanning Uploaded Image...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-5 w-5" />
                      Choose Image or Take Photo
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanMode('camera')}
                    className="text-xs font-mono border-white/15 text-gray-400 hover:text-white rounded-xl"
                  >
                    Switch to Live Camera Feed
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