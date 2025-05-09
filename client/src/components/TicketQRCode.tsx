import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TicketQRCodeProps {
  data: string;
  orderId: string;
  size?: number;
  downloadable?: boolean;
  emailable?: boolean;
  eventName?: string;
  ticketName?: string;
  holderName?: string;
}

const TicketQRCode: React.FC<TicketQRCodeProps> = ({ 
  data, 
  orderId, 
  size = 200,
  downloadable = false,
  emailable = false,
  eventName,
  ticketName,
  holderName
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use the provided data or create a fallback identifier
  const qrCodeData = data || `SGX-TIX-${orderId}`;
  
  const downloadQRCode = async () => {
    if (!qrRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(qrRef.current);
      
      // Create a link element to download the image
      const link = document.createElement('a');
      const filename = eventName && typeof eventName === 'string' ? 
        `SGX-Ticket-${eventName.replace(/\s+/g, '-')}.png` : 
        `SGX-Ticket-${orderId}.png`;
      
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Success",
        description: "Ticket QR code downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Error",
        description: "Failed to download ticket QR code. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const emailQRCode = async () => {
    try {
      // Get the current user email from localStorage
      const storedUser = localStorage.getItem("user");
      let userEmail = "";
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userEmail = user.email || "";
      }
      
      if (!userEmail) {
        // Prompt user for email if not available
        const promptEmail = prompt("Please enter your email address to receive your ticket:", "");
        if (!promptEmail) return;
        userEmail = promptEmail;
      }
      
      // Send the QR code via email
      const response = await apiRequest('POST', '/tickets/email', {
        ticketId: id,
        orderId,
        email: userEmail,
        qrCodeDataUrl: data,
        eventName: eventName || 'Untitled Event',
        ticketName: ticketName || 'Standard Ticket',
        ticketPrice: price || 0,
        eventDate: date || new Date(),
        eventLocation: location || 'TBA',
        holderName: holderName || 'Ticket Holder'
      });
      
      if (response.ok) {
        toast({
          title: "Email Sent",
          description: `Your ticket has been emailed to ${userEmail}`,
        });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error('Error emailing QR code:', error);
      toast({
        title: "Error",
        description: "Failed to email ticket QR code. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div 
        ref={qrRef} 
        className="bg-white p-4 rounded-lg shadow-md"
      >
        {(eventName || ticketName || holderName) && (
          <div className="text-center mb-4">
            {eventName && <h3 className="font-bold text-xl">{eventName}</h3>}
            {ticketName && <p className="text-sm text-gray-600">{ticketName}</p>}
            <p className="text-xs text-gray-500">Order #{orderId}</p>
            {holderName && <p className="text-sm font-semibold mt-1">{holderName}</p>}
          </div>
        )}
        
        <img 
          src={qrCodeData} 
          alt="Ticket QR Code" 
          className="mx-auto"
          width={size}
          height={size}
        />
        
        <div className="text-center mt-3">
          <p className="text-xs">{orderId}</p>
        </div>
      </div>
      
      {(downloadable || emailable) && (
        <div className="flex space-x-2 mt-4">
          {downloadable && (
            <Button onClick={downloadQRCode} variant="default">
              Download
            </Button>
          )}
          {emailable && (
            <Button onClick={emailQRCode} variant="outline">
              Email Ticket
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketQRCode;