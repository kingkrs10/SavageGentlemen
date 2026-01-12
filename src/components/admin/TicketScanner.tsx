"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface TicketScannerProps {
  onScan: (data: string) => void;
  onError?: (error: any) => void;
  isProcessing?: boolean;
}

export function TicketScanner({ onScan, onError, isProcessing }: TicketScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize scanner
    // We need a DOM element id "reader"
    // Wait for mount

    function onScanSuccess(decodedText: string, decodedResult: any) {
      // Handle success
      if (isProcessing) return; // Ignore if already processing
      onScan(decodedText);

      // Optional: Pause scanner or clear to prevent duplicate rapid scans
      scannerRef.current?.pause(true);
      setTimeout(() => {
        scannerRef.current?.resume();
      }, 2000);
    }

    function onScanFailure(error: any) {
      // scan failure, usually better to ignore and keep scanning
      // setScanError(error);
    }

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
    ];

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: formatsToSupport
      },
            /* verbose= */ false
    );

    scannerRef.current = html5QrcodeScanner;

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScan, isProcessing]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="reader" className="bg-black border border-white/10 rounded-lg overflow-hidden"></div>
      {scanError && <p className="text-red-500 text-center mt-2">{scanError}</p>}
    </div>
  );
}