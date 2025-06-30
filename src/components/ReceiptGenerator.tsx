
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Receipt, Calendar, MapPin, User, CreditCard } from "lucide-react";

interface ReceiptGeneratorProps {
  ticket: any;
  onDownload?: () => void;
}

export const ReceiptGenerator = ({ ticket, onDownload }: ReceiptGeneratorProps) => {
  const handleDownload = () => {
    const receiptContent = generateReceiptHTML(ticket);
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${ticket.ticketId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (onDownload) onDownload();
  };

  const handlePrint = () => {
    const receiptContent = generateReceiptHTML(ticket);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment Receipt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Receipt Header */}
          <div className="text-center pb-4 border-b">
            <h2 className="text-xl font-bold">EventTix</h2>
            <p className="text-sm text-gray-600">Official Payment Receipt</p>
          </div>

          {/* Transaction Details */}
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Receipt Number:</span>
              <span className="text-sm font-mono">{ticket.receiptNumber || `RCP-${ticket.ticketId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Transaction ID:</span>
              <span className="text-sm font-mono">{ticket.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm">{new Date(ticket.purchaseDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Payment Method:</span>
              <Badge variant="secondary">
                <CreditCard className="h-3 w-3 mr-1" />
                M-Pesa
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Event Details</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{ticket.event.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{ticket.event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  {new Date(ticket.event.date).toLocaleDateString()} at {ticket.event.time}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Buyer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Buyer Information</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{ticket.buyer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Email:</span>
                <span className="text-sm">{ticket.buyer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Phone:</span>
                <span className="text-sm">{ticket.buyer.phone}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold">Payment Summary</h3>
            <div className="flex justify-between">
              <span className="text-sm">Quantity:</span>
              <span className="text-sm">{ticket.quantity} ticket(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Unit Price:</span>
              <span className="text-sm">KSh {(ticket.totalAmount / ticket.quantity).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">KSh {ticket.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function generateReceiptHTML(ticket: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Receipt - ${ticket.ticketId}</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .flex { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 18px; }
            .badge { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>EventTix</h1>
            <p>Official Payment Receipt</p>
        </div>
        
        <div class="section">
            <h3>Transaction Details</h3>
            <div class="flex"><span>Receipt Number:</span><span>${ticket.receiptNumber || `RCP-${ticket.ticketId}`}</span></div>
            <div class="flex"><span>Transaction ID:</span><span>${ticket.ticketId}</span></div>
            <div class="flex"><span>Date:</span><span>${new Date(ticket.purchaseDate).toLocaleDateString()}</span></div>
            <div class="flex"><span>Payment Method:</span><span class="badge">M-Pesa</span></div>
        </div>
        
        <div class="section">
            <h3>Event Details</h3>
            <div class="flex"><span>Event:</span><span>${ticket.event.title}</span></div>
            <div class="flex"><span>Venue:</span><span>${ticket.event.venue}</span></div>
            <div class="flex"><span>Date & Time:</span><span>${new Date(ticket.event.date).toLocaleDateString()} at ${ticket.event.time}</span></div>
        </div>
        
        <div class="section">
            <h3>Buyer Information</h3>
            <div class="flex"><span>Name:</span><span>${ticket.buyer.name}</span></div>
            <div class="flex"><span>Email:</span><span>${ticket.buyer.email}</span></div>
            <div class="flex"><span>Phone:</span><span>${ticket.buyer.phone}</span></div>
        </div>
        
        <div class="section">
            <h3>Payment Summary</h3>
            <div class="flex"><span>Quantity:</span><span>${ticket.quantity} ticket(s)</span></div>
            <div class="flex"><span>Unit Price:</span><span>KSh ${(ticket.totalAmount / ticket.quantity).toLocaleString()}</span></div>
            <div class="flex total"><span>Total Amount:</span><span>KSh ${ticket.totalAmount.toLocaleString()}</span></div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
            <p>Thank you for using EventTix!</p>
            <p>This is an official receipt for your transaction.</p>
        </div>
    </body>
    </html>
  `;
}
