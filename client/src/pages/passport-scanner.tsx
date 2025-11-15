import { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from "react-helmet";
import { QrCode, Camera, CameraOff, CheckCircle2, XCircle, Coins } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface CheckInResponse {
  success: boolean;
  message: string;
  creditsAwarded?: number;
  newBalance?: number;
  achievement?: {
    name: string;
    creditBonus: number;
  };
}

export default function PassportScanner() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [manualCode, setManualCode] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const checkInMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', `/api/passport/checkin/${code}`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Check-in failed');
      }
      return res.json();
    },
    onSuccess: (data: CheckInResponse) => {
      setCheckInResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/passport/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/passport/achievements'] });
      stopScanner();
    },
    onError: (error: Error) => {
      setCheckInResult({
        success: false,
        message: error.message
      });
    }
  });

  const startScanner = async () => {
    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          checkInMutation.mutate(decodedText);
        },
        () => {
          // Ignore scan errors
        }
      );

      setScannerActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Unable to access camera. Please check permissions or use manual entry.");
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScannerActive(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      checkInMutation.mutate(manualCode.trim());
      setManualCode("");
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to check in at events.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Event Check-In | Soca Passport</title>
        <meta name="description" content="Scan event QR codes to check in and earn Fête Credits" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Event Check-In</h1>
          <p className="text-muted-foreground">
            Scan the QR code at the event to earn credits
          </p>
        </div>

        {/* Camera Scanner */}
        <Card data-testid="card-qr-scanner">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Point your camera at the event QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              id="qr-reader" 
              className="w-full rounded-lg overflow-hidden min-h-[250px]"
              style={{ visibility: scannerActive ? 'visible' : 'hidden', height: scannerActive ? 'auto' : '250px' }}
            />

            {cameraError && (
              <Alert variant="destructive">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {!scannerActive ? (
                <Button 
                  onClick={startScanner}
                  className="flex-1"
                  disabled={checkInMutation.isPending}
                  data-testid="button-start-scanner"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanner
                </Button>
              ) : (
                <Button 
                  onClick={stopScanner}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-stop-scanner"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card data-testid="card-manual-entry">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Enter the event code manually if camera is unavailable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter event code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={checkInMutation.isPending}
                data-testid="input-manual-code"
              />
              <Button 
                type="submit"
                disabled={!manualCode.trim() || checkInMutation.isPending}
                data-testid="button-submit-code"
              >
                Check In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Display */}
        {checkInResult && (
          <Alert 
            variant={checkInResult.success ? "default" : "destructive"}
            className={checkInResult.success ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
            data-testid="alert-checkin-result"
          >
            <div className="flex items-start gap-3">
              {checkInResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription className={checkInResult.success ? "text-green-900 dark:text-green-100" : ""}>
                  <p className="font-semibold">{checkInResult.message}</p>
                  {checkInResult.success && checkInResult.creditsAwarded && (
                    <div className="mt-2 space-y-1">
                      <p className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        +{checkInResult.creditsAwarded} Fête Credits earned!
                      </p>
                      <p className="text-sm">
                        New balance: {checkInResult.newBalance?.toLocaleString()} credits
                      </p>
                      {checkInResult.achievement && (
                        <p className="text-sm font-semibold mt-2 flex items-center gap-2">
                          🏆 Achievement Unlocked: {checkInResult.achievement.name}
                          <span className="text-xs">(+{checkInResult.achievement.creditBonus} bonus credits)</span>
                        </p>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>
    </>
  );
}
