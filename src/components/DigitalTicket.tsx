
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Calendar, MapPin, User, Share2, MessageSquare, Receipt, Send } from "lucide-react";
import QRCode from 'react-qr-code';
import { TicketTransfer } from "./TicketTransfer";
import { EventFeedback } from "./EventFeedback";
import { ReceiptGenerator } from "./ReceiptGenerator";

interface DigitalTicketProps {
  ticket: any;
  onBack: () => void;
}

export const DigitalTicket = ({ ticket, onBack }: DigitalTicketProps) => {
  const [currentView, setCurrentView] = useState<'ticket' | 'transfer' | 'feedback' | 'receipt'>('ticket');
  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadTicket = () => {
    if (ticketRef.current) {
      // Create a printable version
      const printContent = ticketRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ticket - ${ticket.ticketId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .ticket { max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
              .qr-code { text-align: center; margin: 20px 0; }
              .details { margin: 10px 0; }
              .bold { font-weight: bold; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="ticket">
              ${printContent}
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const shareTicket = async () => {
    const shareData = {
      title: `Ticket for ${ticket.event.title}`,
      text: `I have a ticket for ${ticket.event.title} on ${new Date(ticket.event.date).toLocaleDateString()}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
    }
  };

  if (currentView === 'transfer') {
    return (
      <TicketTransfer
        ticket={ticket}
        onBack={() => setCurrentView('ticket')}
        onTransferComplete={onBack}
      />
    );
  }

  if (currentView === 'feedback') {
    return (
      <EventFeedback
        ticket={ticket}
        onFeedbackSubmitted={() => setCurrentView('ticket')}
      />
    );
  }

  if (currentView === 'receipt') {
    return (
      <div>
        <Button variant="ghost" onClick={() => setCurrentView('ticket')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Ticket
        </Button>
        <ReceiptGenerator ticket={ticket} />
      </div>
    );
  }

  // Check if event has passed for feedback
  const eventDate = new Date(ticket.event.date);
  const now = new Date();
  const hasEventPassed = eventDate < now;

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      <Card className="overflow-hidden" ref={ticketRef}>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white">
          <CardTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-6 w-6" />
              <span>Digital Ticket</span>
            </div>
            <Badge variant="secondary" className="bg-white text-blue-600">
              {ticket.status === 'valid' ? 'Valid' : ticket.status}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* QR Code Section */}
          <div className="text-center mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
              <QRCode
                value={ticket.qrCode}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Show this QR code at the event entrance
            </p>
          </div>

          {/* Event Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-center mb-4">{ticket.event.title}</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Date & Time</div>
                  <div className="text-sm text-gray-600">
                    {new Date(ticket.event.date).toLocaleDateString()} at {ticket.event.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Venue</div>
                  <div className="text-sm text-gray-600">{ticket.event.venue}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Ticket Holder</div>
                  <div className="text-sm text-gray-600">{ticket.buyer.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Ticket ID</div>
                  <div className="text-sm text-gray-600 font-mono">{ticket.ticketId}</div>
                </div>
              </div>
            </div>

            {ticket.quantity > 1 && (
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {ticket.quantity} Tickets
                </Badge>
              </div>
            )}

            <Separator />

            {/* Payment Information */}
            <div className="space-y-2">
              <h3 className="font-semibold">Payment Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">KSh {ticket.totalAmount.toLocaleString()}</span>
                </div>
                {ticket.discount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Applied:</span>
                    <span>KSh {(ticket.originalAmount - ticket.totalAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Purchase Date:</span>
                  <span>{new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                </div>
                {ticket.receiptNumber && (
                  <div className="flex justify-between">
                    <span>Receipt Number:</span>
                    <span className="font-mono">{ticket.receiptNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="grid gap-2 md:grid-cols-2">
              <Button onClick={downloadTicket} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download/Print
              </Button>
              
              <Button onClick={shareTicket} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button 
                onClick={() => setCurrentView('receipt')} 
                variant="outline" 
                className="w-full"
              >
                <Receipt className="h-4 w-4 mr-2" />
                View Receipt
              </Button>

              {ticket.status === 'valid' && (
                <Button 
                  onClick={() => setCurrentView('transfer')} 
                  variant="outline" 
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transfer Ticket
                </Button>
              )}
            </div>

            {/* Post-event feedback */}
            {hasEventPassed && (
              <div className="mt-4">
                <Button 
                  onClick={() => setCurrentView('feedback')} 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Rate Your Experience
                </Button>
              </div>
            )}

            {/* Important Notice */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Keep this ticket safe and accessible on your phone</li>
                <li>• Arrive early to avoid queues at the entrance</li>
                <li>• This ticket is valid for one-time entry only</li>
                <li>• Contact support if you face any issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
