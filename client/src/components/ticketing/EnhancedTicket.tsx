import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  QrCode, 
  Share2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Gift,
  ArrowRightLeft
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatPriceFromCents, getCurrencyFromLocation } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QRCodeLib from "qrcode";

interface TicketPurchase {
  id: number;
  ticketId: number;
  eventId: number;
  userId: number;
  qrCodeData: string;
  status: string;
  ticketType: string;
  price: number;
  attendeeEmail: string;
  attendeeName: string;
  purchaseDate: string;
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
}

interface EnhancedTicketData {
  id: number;
  qrCode: string;
  securityHash: string;
  isTransferable: boolean;
  transferCount: number;
  maxTransfers: number;
  createdAt: string;
}

interface EnhancedTicketProps {
  ticketPurchase: TicketPurchase;
  onTransfer?: () => void;
  onRefund?: () => void;
}

const EnhancedTicket = ({ ticketPurchase, onTransfer, onRefund }: EnhancedTicketProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [transferData, setTransferData] = useState({
    toEmail: "",
    toUserId: "",
  });
  const [refundData, setRefundData] = useState({
    refundType: "full" as "full" | "partial" | "exchange",
    reason: "",
  });

  // Get enhanced ticket data
  const { data: enhancedTicket, isLoading } = useQuery({
    queryKey: [`/api/tickets/${ticketPurchase.id}/enhanced`],
    enabled: !!ticketPurchase.id,
  });

  // Generate QR code URL
  React.useEffect(() => {
    if (enhancedTicket?.qrCode) {
      QRCodeLib.toDataURL(enhancedTicket.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl);
    }
  }, [enhancedTicket]);

  // Create enhanced ticket mutation
  const createEnhancedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/tickets/${ticketPurchase.id}/enhance`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketPurchase.id}/enhanced`] });
      toast({
        title: "Enhanced ticket created",
        description: "Your ticket now has enhanced security features and QR code.",
      });
    },
  });

  // Transfer ticket mutation
  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/tickets/${ticketPurchase.id}/transfer`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketPurchase.id}/enhanced`] });
      setShowTransferForm(false);
      setTransferData({ toEmail: "", toUserId: "" });
      toast({
        title: "Transfer initiated",
        description: `Transfer link: ${data.transferUrl}`,
      });
      onTransfer?.();
    },
  });

  // Request refund mutation
  const refundMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/tickets/${ticketPurchase.id}/refund`, data);
    },
    onSuccess: () => {
      setShowRefundForm(false);
      setRefundData({ refundType: "full", reason: "" });
      toast({
        title: "Refund requested",
        description: "Your refund request has been submitted for review.",
      });
      onRefund?.();
    },
  });

  const handleCopyQRCode = async () => {
    if (enhancedTicket?.qrCode) {
      await navigator.clipboard.writeText(enhancedTicket.qrCode);
      toast({
        title: "QR Code copied",
        description: "QR code data copied to clipboard.",
      });
    }
  };

  const handleDownloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `ticket-${ticketPurchase.id}-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const currency = getCurrencyFromLocation(ticketPurchase.event.location);
  const formattedPrice = formatPriceFromCents(ticketPurchase.price, currency);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{ticketPurchase.event.title}</h3>
            <p className="text-sm opacity-90">{ticketPurchase.ticketType}</p>
          </div>
          <Badge variant="secondary" className="bg-white text-primary">
            {ticketPurchase.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticket Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Event Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Date:</span> {formatDate(ticketPurchase.event.date)}</p>
                <p><span className="font-medium">Location:</span> {ticketPurchase.event.location}</p>
                <p><span className="font-medium">Price:</span> {formattedPrice}</p>
                <p><span className="font-medium">Purchased:</span> {formatDate(ticketPurchase.purchaseDate)}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Attendee Information</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {ticketPurchase.attendeeName}</p>
                <p><span className="font-medium">Email:</span> {ticketPurchase.attendeeEmail}</p>
              </div>
            </div>

            {/* Enhanced Ticket Features */}
            {enhancedTicket && (
              <div>
                <h4 className="font-semibold mb-2">Security Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Enhanced Security Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                    <span>
                      Transfers: {enhancedTicket.transferCount}/{enhancedTicket.maxTransfers}
                      {enhancedTicket.isTransferable ? " (Enabled)" : " (Disabled)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            {enhancedTicket && qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <img src={qrCodeUrl} alt="Ticket QR Code" className="w-48 h-48" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyQRCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <QrCode className="mx-auto h-24 w-24 text-gray-400 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Enable enhanced security features to get your QR code
                </p>
                <Button 
                  onClick={() => createEnhancedMutation.mutate()}
                  disabled={createEnhancedMutation.isPending}
                >
                  {createEnhancedMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enable Enhanced Features
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {enhancedTicket && (
          <div className="mt-6 flex flex-wrap gap-2">
            {enhancedTicket.isTransferable && enhancedTicket.transferCount < enhancedTicket.maxTransfers && (
              <Button 
                variant="outline" 
                onClick={() => setShowTransferForm(true)}
                className="flex-1 min-w-[140px]"
              >
                <Gift className="h-4 w-4 mr-2" />
                Transfer Ticket
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setShowRefundForm(true)}
              className="flex-1 min-w-[140px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Request Refund
            </Button>
          </div>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Transfer Ticket</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Recipient Email</label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={transferData.toEmail}
                    onChange={(e) => setTransferData({ ...transferData, toEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => transferMutation.mutate(transferData)}
                    disabled={transferMutation.isPending || !transferData.toEmail}
                  >
                    {transferMutation.isPending ? "Initiating..." : "Initiate Transfer"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTransferForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refund Form */}
        {showRefundForm && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Request Refund</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Refund Type</label>
                  <select
                    value={refundData.refundType}
                    onChange={(e) => setRefundData({ ...refundData, refundType: e.target.value as any })}
                    className="mt-1 w-full p-2 border rounded-md"
                  >
                    <option value="full">Full Refund</option>
                    <option value="partial">Partial Refund</option>
                    <option value="exchange">Exchange for Credit</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Reason (Optional)</label>
                  <Textarea
                    placeholder="Please explain why you're requesting a refund..."
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => refundMutation.mutate(refundData)}
                    disabled={refundMutation.isPending}
                  >
                    {refundMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRefundForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning Messages */}
        {enhancedTicket && !enhancedTicket.isTransferable && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">This ticket is not transferable</span>
          </div>
        )}

        {enhancedTicket && enhancedTicket.transferCount >= enhancedTicket.maxTransfers && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">Transfer limit reached</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTicket;