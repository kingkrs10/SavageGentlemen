import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, QrCode, Scan, Calendar, MapPin, Trophy, Upload } from "lucide-react";
import { Helmet } from "react-helmet";
import { Html5Qrcode } from "html5-qrcode";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

interface CheckInEvent extends Event {
  passportStampEnabled: boolean;
  pointsAwarded: number;
}

export default function PassportCheckIn() {
  const { code } = useParams<{ code: string }>();
  const [manualCode, setManualCode] = useState("");
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; points?: number } | null>(null);

  // Fetch event details by access code
  const { data: event, isLoading: eventLoading } = useQuery<CheckInEvent>({
    queryKey: ['/api/passport/checkin', code],
    enabled: !!code,
    retry: false
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (qrData: string) => {
      const res = await apiRequest("POST", "/api/passport/checkin", {
        qrData,
        accessCode: code
      });
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: data.message || "Check-in successful!",
        points: data.pointsAwarded
      });
      stopScanner();
    },
    onError: (error: any) => {
      setScanResult({
        success: false,
        message: error.message || "Check-in failed. Please try again."
      });
    }
  });

  // Initialize scanner
  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Successfully scanned
          checkInMutation.mutate(decodedText);
        },
        () => {
          // Scan error (ignore - happens continuously during scanning)
        }
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      alert("Unable to start camera. Please check permissions.");
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (scanner && isScanning) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  // Manual code entry
  const handleManualCheckIn = () => {
    if (manualCode.trim()) {
      checkInMutation.mutate(manualCode.trim());
      setManualCode("");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        stopScanner();
      }
    };
  }, [scanner]);

  // Reset scan result after 5 seconds
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        setScanResult(null);
        if (scanResult.success && !isScanning) {
          // Restart scanner for next attendee
          startScanner();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading event details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event || !event.passportStampEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Helmet>
          <title>Invalid Access Code - Soca Passport</title>
        </Helmet>
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              This event does not have passport check-in enabled or the access code is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Please verify the access code with the event organizer.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <Helmet>
        <title>Check-In: {event.title} - Soca Passport</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Event Info Card */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              {event.date && new Date(event.date).toLocaleDateString()}
              <Separator orientation="vertical" className="h-4" />
              <MapPin className="w-4 h-4" />
              {event.location || "TBA"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">Points per check-in:</span>
              </div>
              <Badge variant="default" className="text-lg px-3 py-1">
                +{event.pointsAwarded} points
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Passport QR Code</CardTitle>
            <CardDescription>
              Scan attendee's Soca Passport QR code to check them in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scan Result Alert */}
            {scanResult && (
              <Alert variant={scanResult.success ? "default" : "destructive"} className="animate-in fade-in slide-in-from-top-2">
                {scanResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {scanResult.message}
                  {scanResult.points && (
                    <span className="block mt-1 font-semibold">
                      +{scanResult.points} points awarded!
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Camera Scanner */}
            {!isScanning && !checkInMutation.isPending && (
              <Button
                onClick={startScanner}
                className="w-full"
                size="lg"
                data-testid="button-start-scanner"
              >
                <Scan className="w-5 h-5 mr-2" />
                Start Camera Scanner
              </Button>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-primary" />
                <Button
                  onClick={stopScanner}
                  variant="outline"
                  className="w-full"
                  data-testid="button-stop-scanner"
                >
                  Stop Scanner
                </Button>
              </div>
            )}

            {/* Loading state */}
            {checkInMutation.isPending && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-muted-foreground">Processing check-in...</p>
              </div>
            )}

            {/* Manual Entry */}
            <div className="space-y-3">
              <Separator />
              <p className="text-sm text-muted-foreground text-center">
                Or enter code manually
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste QR code data here"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                  disabled={checkInMutation.isPending || isScanning}
                  data-testid="input-manual-code"
                />
                <Button
                  onClick={handleManualCheckIn}
                  disabled={!manualCode.trim() || checkInMutation.isPending || isScanning}
                  data-testid="button-manual-checkin"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">How to Check In Attendees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Start Camera Scanner" to activate your device camera</li>
              <li>Ask the attendee to display their Soca Passport QR code</li>
              <li>Point your camera at the QR code to scan automatically</li>
              <li>Wait for confirmation that the check-in was successful</li>
              <li>The system prevents duplicate check-ins automatically</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
