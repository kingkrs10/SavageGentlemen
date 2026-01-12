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
        return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>;
      case 'duplicate':
        return <Badge variant="destructive">Duplicate</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Scan Data</h1>
          <p className="text-gray-600 mt-2">View all recorded ticket scan activity</p>
        </div>
        <Button onClick={fetchScanData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Database Location Info */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Scan Data Storage:</strong> All ticket scan records are stored in the PostgreSQL database in the 
          <code className="mx-1 px-2 py-1 bg-gray-100 rounded">ticket_scans</code> table. 
          This includes scan timestamp, scanner identity, ticket details, and duplicate prevention data.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading scan data...
            </CardContent>
          </Card>
        ) : scanData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scan Data Found</h3>
              <p className="text-gray-600 mb-4">
                No ticket scans have been recorded yet. Start scanning tickets to see data here.
              </p>
              <p className="text-sm text-gray-500">
                Test with QR code: <code className="bg-gray-100 px-2 py-1 rounded">SGX-TIX-1-7</code> or <code className="bg-gray-100 px-2 py-1 rounded">DEMO-TICKET</code>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Showing {scanData.length} scan record{scanData.length !== 1 ? 's' : ''}
            </div>
            
            {scanData.map((scan) => (
              <Card key={scan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TicketIcon className="h-5 w-5" />
                      Scan #{scan.id}
                      {getStatusBadge(scan.status)}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      {format(new Date(scan.scannedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                  </div>
                  <CardDescription>
                    {scan.eventName && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {scan.eventName}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Ticket ID:</span>
                      <div className="text-gray-900">{scan.ticketId}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Order ID:</span>
                      <div className="text-gray-900">{scan.orderId}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Scanned By:</span>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {scan.scannerName || `User ${scan.scannedBy}`}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Time:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(scan.scannedAt), 'HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                  
                  {scan.ticketName && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="font-medium text-gray-700">Ticket:</span>
                      <div className="text-gray-900">{scan.ticketName}</div>
                    </div>
                  )}
                  
                  {scan.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
                        <div>
                          <span className="font-medium text-gray-700">Notes:</span>
                          <div className="text-gray-900">{scan.notes}</div>
                        </div>
                      </div>
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