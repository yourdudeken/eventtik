
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Mail, QrCode, Calendar, MapPin, User, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DigitalTicketProps {
  ticket: any;
  onBack: () => void;
}

export const DigitalTicket = ({ ticket, onBack }: DigitalTicketProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ticket-pdf', {
        body: { ticketData: ticket }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${ticket.ticketId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Ticket Downloaded",
        description: "Your ticket has been saved to your device"
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download ticket",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-ticket-email', {
        body: {
          email: ticket.buyer.email,
          ticketData: ticket
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Sent",
          description: "Ticket has been sent to your email address"
        });
      } else {
        throw new Error(data.error || 'Email sending failed');
      }
    } catch (error: any) {
      console.error('Email error:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Generate QR code data URL (in real app, this would be generated on backend)
  const qrCodeDataUrl = `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
        ${ticket.qrCode}
      </text>
      <rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>
    </svg>
  `)}`;

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">Ticket Purchase Successful!</span>
        </div>
        <p className="text-green-700 mt-1 text-sm">
          Your digital ticket is ready. Save it to your phone for easy access at the event.
        </p>
      </div>

      {/* Digital Ticket */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-6 w-6" />
              <CardTitle>Digital Ticket</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white text-blue-600">
              Valid
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Event & Ticket Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {ticket.event.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {ticket.event.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>
                    {new Date(ticket.event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {ticket.event.time}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span>{ticket.event.venue}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>{ticket.buyer.name}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ticket ID:</span>
                  <span className="font-mono">{ticket.ticketId}</span>
                </div>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono">{ticket.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{ticket.quantity} ticket(s)</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">
                    KSh {ticket.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <img
                  src={qrCodeDataUrl}
                  alt="Ticket QR Code"
                  className="w-40 h-40"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Show this QR code at the event entrance
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Ticket'}
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              variant="outline"
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingEmail ? 'Sending...' : 'Email Ticket'}
            </Button>
          </div>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Keep this ticket on your phone or print a copy</li>
              <li>• Arrive 30 minutes before the event starts</li>
              <li>• This ticket is non-transferable and non-refundable</li>
              <li>• Contact support if you have any issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
