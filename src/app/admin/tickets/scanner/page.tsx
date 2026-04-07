"use client";

import { useState } from "react";
import { TicketScanner } from "@/components/admin/TicketScanner";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

type ScanResult = {
    success: boolean;
    message: string;
    code: string;
    ticket?: any;
    scanInfo?: any;
};

export default function ScannerPage() {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

    const handleScan = async (qrCodeData: string) => {
        if (isProcessing || qrCodeData === lastScannedCode) return;

        setIsProcessing(true);
        setLastScannedCode(qrCodeData);

        try {
            // Play ping sound (optional)

            const response = await apiRequest("POST", "/api/admin/tickets/scan", { qrCodeData });
            const result = await response.json();

            setScanResult(result);

            // Auto-clear result after 5 seconds if success for rapid scanning?
            // Or Keep it until next scan? 
            // Better to keep until next scan or manual reset.

        } catch (error) {
            console.error("Scan Error:", error);
            setScanResult({
                success: false,
                message: "Network or Server Error",
                code: "SERVER_ERROR"
            });
        } finally {
            setIsProcessing(false);
            // Allow re-scanning same code after delay?
            setTimeout(() => setLastScannedCode(null), 3000);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setLastScannedCode(null);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/tickets">
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Ticket Scanner</h1>
                    <p className="text-gray-400">Scan guest QR codes for entry.</p>
                </div>
            </div>

            {/* Result Display */}
            {scanResult && (
                <div className={`p-6 rounded-xl border-2 text-center animate-in zoom-in-95 duration-200 ${scanResult.success
                        ? "bg-green-500/10 border-green-500 text-green-500"
                        : scanResult.code === 'ALREADY_SCANNED'
                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                            : "bg-red-500/10 border-red-500 text-red-500"
                    }`}>
                    <div className="flex justify-center mb-4">
                        {scanResult.success ? (
                            <CheckCircle className="w-20 h-20" />
                        ) : scanResult.code === 'ALREADY_SCANNED' ? (
                            <AlertTriangle className="w-20 h-20" />
                        ) : (
                            <XCircle className="w-20 h-20" />
                        )}
                    </div>

                    <h2 className="text-3xl font-heading uppercase tracking-widest mb-2">
                        {scanResult.message}
                    </h2>

                    {scanResult.ticket && (
                        <div className="mt-4 p-4 bg-black/40 rounded-lg text-white text-left space-y-2">
                            <p><span className="text-white/40 uppercase text-xs tracking-wider">Attendee:</span> <span className="font-bold">{scanResult.ticket.attendeeName || "Guest"}</span></p>
                            <p><span className="text-white/40 uppercase text-xs tracking-wider">Ticket:</span> {scanResult.ticket.ticketType}</p>
                            <p><span className="text-white/40 uppercase text-xs tracking-wider">Event:</span> {scanResult.ticket.event?.title}</p>

                            {scanResult.scanInfo && (
                                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-yellow-500">
                                    <p>First Scanned: {format(new Date(scanResult.scanInfo.firstScan), "MMM d, h:mm:ss a")}</p>
                                    <p>Total Scans: {scanResult.scanInfo.scanCount}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={resetScanner}
                        className="mt-6 w-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Scan Next
                    </Button>
                </div>
            )}

            {/* Scanner Camera */}
            {!scanResult && (
                <Card className="bg-gray-900 border-white/10 overflow-hidden">
                    <CardContent className="p-0">
                        <TicketScanner onScan={handleScan} isProcessing={isProcessing} />
                        <div className="p-4 text-center text-white/40 text-sm">
                            Position the QR code within the frame.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
