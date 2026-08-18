import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  Ticket as TicketIcon, 
  Calendar,
  FileText,
  Database,
  RefreshCw,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface ScanRecord {
  id: number;
  ticketId: number;
  orderId: number;
  scannedAt: string;
  scannedBy: number;
  status: string;
  notes: string;
  ticketName?: string;
  eventName?: string;
  scannerName?: string;
}

const ScanDataViewer = () => {
  const [scanData, setScanData] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchScanData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all scan records from the database
      const response = await fetch('/api/admin/scan-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('userId') || '2' // Use stored user ID
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScanData(data || []);
        toast({
          title: "Scan Data Loaded",
          description: `Found ${data?.length || 0} scan records`,
          variant: "default"
        });
      } else {
        throw new Error('Failed to fetch scan data');
      }
    } catch (err) {
      console.error('Error fetching scan data:', err);
      setError('Failed to load scan data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load scan data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'valid':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Valid</span>;
      case 'duplicate':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">Duplicate</span>;
      case 'invalid':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">Invalid</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-gray-300 border border-white/15">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gold-400">Live Optical Scan Telemetry</h2>
          <p className="text-xs font-mono text-gray-400 mt-1">Audit log of all door validations and anti-passback checks</p>
        </div>
        <Button 
          onClick={fetchScanData} 
          disabled={loading}
          className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono"
          variant="outline"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </Button>
      </div>

      {/* Database Location Info */}
      <div className="glass-obsidian border border-gold-500/20 p-4 rounded-2xl text-xs font-mono text-gray-300 flex items-start gap-3">
        <Database className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gold-400">Storage Architecture:</span> Scanned telemetry is indexed in the PostgreSQL database with millisecond timestamps, gatekeeper ID, and anti-duplicate locks.
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-950/40 border-red-500/30 text-red-300">
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gold-400" />
              <span className="text-xs font-mono text-gray-400">Syncing door scan logs...</span>
            </CardContent>
          </Card>
        ) : scanData.length === 0 ? (
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-heading font-bold text-white mb-2">No Door Scans Recorded</h3>
              <p className="text-xs font-mono text-gray-400 mb-4">
                No tickets scanned for this event yet. Launch the Optical Ticket Scanner to begin gate admission.
              </p>
              <p className="text-xs font-mono text-gray-500">
                Sample test code: <code className="bg-white/10 px-2 py-0.5 rounded text-gold-400">SGX-TIX-1-7</code>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-xs font-mono text-gray-400">
              Showing {scanData.length} recorded scan event{scanData.length !== 1 ? 's' : ''}
            </div>
            
            {scanData.map((scan) => (
              <Card key={scan.id} className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-base font-heading text-white">
                      <TicketIcon className="h-4 w-4 text-gold-400" />
                      Scan #{scan.id}
                      {getStatusBadge(scan.status)}
                    </CardTitle>
                    <div className="text-xs font-mono text-gray-400">
                      {format(new Date(scan.scannedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                  </div>
                  {scan.eventName && (
                    <CardDescription className="text-gold-400 font-mono text-xs flex items-center gap-1 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {scan.eventName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase">Ticket ID:</span>
                      <div className="text-white font-bold">{scan.ticketId}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase">Order ID:</span>
                      <div className="text-white font-bold">{scan.orderId}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase">Gatekeeper:</span>
                      <div className="text-white font-semibold flex items-center gap-1">
                        <User className="h-3 w-3 text-gold-400" />
                        {scan.scannerName || `User ${scan.scannedBy}`}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-gray-400 block text-[10px] uppercase">Timestamp:</span>
                      <div className="text-white flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gold-400" />
                        {format(new Date(scan.scannedAt), 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  
                  {scan.ticketName && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-mono">
                      <span className="text-gray-400">Tier:</span>
                      <span className="text-gold-300 font-semibold">{scan.ticketName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ScanDataViewer;