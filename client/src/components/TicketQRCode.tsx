import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TicketQRCodeProps {
  ticketId: number;
  orderId: number;
  eventName: string;
  ticketName: string;
  holderName: string;
}

const TicketQRCode: React.FC<TicketQRCodeProps> = ({ 
  ticketId, 
  orderId, 
  eventName, 
  ticketName,
  holderName
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Generate a unique ticket identifier to be encoded in the QR code
  const ticketIdentifier = `SGX-TIX-${orderId}-${ticketId}`;
  
  useEffect(() => {
    // Generate QR code on component mount
    generateQRCode();
  }, [ticketId, orderId]);
  
  const generateQRCode = async () => {
    try {
      // Create QR code data URL
      const dataURL = await QRCode.toDataURL(ticketIdentifier, {
        width: 250,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Could not generate ticket QR code. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const downloadQRCode = async () => {
    if (!qrRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(qrRef.current);
      
      // Create a link element to download the image
      const link = document.createElement('a');
      link.download = `SGX-Ticket-${eventName.replace(/\s+/g, '-')}-${ticketId}.png`;
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
      const response = await apiRequest('POST', '/api/tickets/email', {
        ticketId,
        orderId,
        email: userEmail,
        eventName,
        ticketName,
        holderName
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
        <div className="text-center mb-4">
          <h3 className="font-bold text-xl">{eventName}</h3>
          <p className="text-sm text-gray-600">{ticketName}</p>
          <p className="text-xs text-gray-500">Ticket #{ticketId}</p>
          <p className="text-xs text-gray-500">Order #{orderId}</p>
          <p className="text-sm font-semibold mt-1">{holderName}</p>
        </div>
        
        {qrCodeDataURL ? (
          <img 
            src={qrCodeDataURL} 
            alt="Ticket QR Code" 
            className="mx-auto"
            width={250}
            height={250}
          />
        ) : (
          <div className="w-[250px] h-[250px] bg-gray-200 animate-pulse mx-auto"></div>
        )}
        
        <div className="text-center mt-3">
          <p className="text-xs">{ticketIdentifier}</p>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <Button onClick={downloadQRCode} className="sg-btn">
          Download
        </Button>
        <Button onClick={emailQRCode} variant="outline">
          Email Ticket
        </Button>
      </div>
    </div>
  );
};

export default TicketQRCode;