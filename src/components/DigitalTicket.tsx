import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Calendar, MapPin, User, Share2, MessageSquare, Receipt, Send, Mail, Facebook, Twitter, Instagram } from "lucide-react";
import QRCode from 'react-qr-code';
import { TicketTransfer } from "./TicketTransfer";
import { EventFeedback } from "./EventFeedback";
import { ReceiptGenerator } from "./ReceiptGenerator";
import { SocialShare } from "./SocialShare";
import { useToast } from "@/hooks/use-toast";

interface DigitalTicketProps {
  ticket: any;
  onBack: () => void;
}

export const DigitalTicket = ({ ticket, onBack }: DigitalTicketProps) => {
  const [currentView, setCurrentView] = useState<'ticket' | 'transfer' | 'feedback' | 'receipt' | 'share'>('ticket');
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const downloadTicket = () => {
    if (ticketRef.current) {
      // Create a more professional printable version
      const printContent = generateProfessionalTicketHTML(ticket);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const shareViaEmail = async () => {
    try {
      const subject = encodeURIComponent(`Ticket for ${ticket.event.title}`);
      const body = encodeURIComponent(`
Hello!

I'd like to share my ticket details for ${ticket.event.title}:

Event: ${ticket.event.title}
Date: ${new Date(ticket.event.date).toLocaleDateString()}
Time: ${ticket.event.time}
Venue: ${ticket.event.venue}
Ticket ID: ${ticket.ticketId}

Looking forward to seeing you there!

Best regards
      `);
      
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;
      
      toast({
        title: "Email Client Opened",
        description: "Your email client has been opened with the ticket details."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open email client.",
        variant: "destructive"
      });
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

  if (currentView === 'share') {
    return (
      <div>
        <Button variant="ghost" onClick={() => setCurrentView('ticket')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Ticket
        </Button>
        <SocialShare ticket={ticket} />
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
        <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white print:bg-white print:text-black">
          <CardTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-6 w-6" />
              <span>Digital Ticket</span>
            </div>
            <Badge variant="secondary" className="bg-white text-blue-600 print:bg-gray-100 print:text-black">
              {ticket.status === 'valid' ? 'Valid' : ticket.status}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* QR Code Section - Enhanced for printing */}
          <div className="text-center mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm inline-block border-2 border-gray-200 print:shadow-none print:border-black">
              <QRCode
                value={ticket.qrCode}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                fgColor="#000000"
                bgColor="#ffffff"
              />
              <div className="mt-4 text-xs text-gray-600 print:text-black">
                <p className="font-semibold">Ticket ID: {ticket.ticketId}</p>
                <p>Scan at venue entrance</p>
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-center mb-4 print:text-black">{ticket.event.title}</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 print:text-black" />
                <div>
                  <div className="font-medium">Date & Time</div>
                  <div className="text-sm text-gray-600 print:text-black">
                    {new Date(ticket.event.date).toLocaleDateString()} at {ticket.event.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600 print:text-black" />
                <div>
                  <div className="font-medium">Venue</div>
                  <div className="text-sm text-gray-600 print:text-black">{ticket.event.venue}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 print:text-black" />
                <div>
                  <div className="font-medium">Ticket Holder</div>
                  <div className="text-sm text-gray-600 print:text-black">{ticket.buyer.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600 print:text-black" />
                <div>
                  <div className="font-medium">Ticket ID</div>
                  <div className="text-sm text-gray-600 print:text-black font-mono">{ticket.ticketId}</div>
                </div>
              </div>
            </div>

            {ticket.quantity > 1 && (
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2 print:border-black print:text-black">
                  {ticket.quantity} Tickets
                </Badge>
              </div>
            )}

            <Separator className="print:border-black" />

            {/* Payment Information */}
            <div className="space-y-2">
              <h3 className="font-semibold print:text-black">Payment Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">KSh {ticket.totalAmount.toLocaleString()}</span>
                </div>
                {ticket.discount && (
                  <div className="flex justify-between text-green-600 print:text-black">
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

            <Separator className="print:border-black" />

            {/* Action Buttons - Hidden in print */}
            <div className="grid gap-2 md:grid-cols-2 print:hidden">
              <Button onClick={downloadTicket} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download/Print
              </Button>
              
              <Button onClick={shareViaEmail} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </Button>

              <Button 
                onClick={() => setCurrentView('share')} 
                variant="outline" 
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Social Media
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
                  className="w-full md:col-span-2"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transfer Ticket
                </Button>
              )}
            </div>

            {/* Post-event feedback */}
            {hasEventPassed && (
              <div className="mt-4 print:hidden">
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
            <div className="bg-yellow-50 p-4 rounded-lg print:bg-white print:border print:border-black">
              <h4 className="font-semibold text-yellow-800 mb-2 print:text-black">Important Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1 print:text-black">
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

// Professional ticket HTML generator
function generateProfessionalTicketHTML(ticket: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Event Ticket - ${ticket.event.title}</title>
        <style>
            @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
            }
            body { 
                font-family: 'Arial', sans-serif; 
                margin: 20px; 
                background: #f5f5f5;
            }
            .ticket-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border: 3px solid #2563eb;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .ticket-header {
                background: linear-gradient(135deg, #2563eb, #14b8a6);
                color: white;
                padding: 30px;
                text-align: center;
                position: relative;
            }
            .ticket-header::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 20px solid transparent;
                border-right: 20px solid transparent;
                border-top: 20px solid #14b8a6;
            }
            .event-title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .ticket-status {
                background: white;
                color: #2563eb;
                padding: 8px 20px;
                border-radius: 25px;
                font-weight: bold;
                display: inline-block;
                margin-top: 10px;
            }
            .ticket-body {
                padding: 40px;
            }
            .qr-section {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 2px dashed #cbd5e1;
            }
            .qr-code {
                display: inline-block;
                padding: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .event-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
            }
            .detail-item {
                display: flex;
                align-items: center;
                padding: 15px;
                background: #f1f5f9;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
            }
            .detail-icon {
                width: 24px;
                height: 24px;
                margin-right: 12px;
                color: #2563eb;
            }
            .detail-label {
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 4px;
            }
            .detail-value {
                color: #475569;
                font-size: 14px;
            }
            .payment-section {
                background: #ecfdf5;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #d1fae5;
                margin: 20px 0;
            }
            .important-notice {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 10px;
                padding: 20px;
                margin-top: 30px;
            }
            .notice-title {
                font-weight: bold;
                color: #92400e;
                margin-bottom: 10px;
            }
            .notice-list {
                color: #92400e;
                font-size: 14px;
                line-height: 1.6;
            }
            .ticket-footer {
                text-align: center;
                padding: 20px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #64748b;
            }
            .separator {
                height: 1px;
                background: #e2e8f0;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="ticket-container">
            <div class="ticket-header">
                <div class="event-title">${ticket.event.title}</div>
                <div class="ticket-status">${ticket.status === 'valid' ? 'Valid Ticket' : ticket.status}</div>
            </div>
            
            <div class="ticket-body">
                <div class="qr-section">
                    <div class="qr-code">
                        <div style="width: 200px; height: 200px; background: url('data:image/svg+xml;base64,${btoa(generateQRSVG(ticket.qrCode))}') no-repeat center; background-size: contain;"></div>
                    </div>
                    <div style="margin-top: 15px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">Ticket ID: ${ticket.ticketId}</div>
                        <div style="color: #64748b; font-size: 14px;">Scan this QR code at the venue entrance</div>
                    </div>
                </div>
                
                <div class="event-details">
                    <div class="detail-item">
                        <div>
                            <div class="detail-label">Date & Time</div>
                            <div class="detail-value">${new Date(ticket.event.date).toLocaleDateString()} at ${ticket.event.time}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div>
                            <div class="detail-label">Venue</div>
                            <div class="detail-value">${ticket.event.venue}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div>
                            <div class="detail-label">Ticket Holder</div>
                            <div class="detail-value">${ticket.buyer.name}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div>
                            <div class="detail-label">Contact</div>
                            <div class="detail-value">${ticket.buyer.email}</div>
                        </div>
                    </div>
                </div>
                
                ${ticket.quantity > 1 ? `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="background: #dbeafe; color: #1e40af; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold;">
                        ${ticket.quantity} Tickets
                    </div>
                </div>
                ` : ''}
                
                <div class="separator"></div>
                
                <div class="payment-section">
                    <h3 style="margin: 0 0 15px 0; color: #065f46;">Payment Details</h3>
                    <div style="display: grid; gap: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Amount Paid:</span>
                            <span style="font-weight: bold;">KSh ${ticket.totalAmount.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Purchase Date:</span>
                            <span>${new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                        </div>
                        ${ticket.receiptNumber ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Receipt Number:</span>
                            <span style="font-family: monospace;">${ticket.receiptNumber}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="important-notice">
                    <div class="notice-title">Important Information</div>
                    <ul class="notice-list" style="margin: 0; padding-left: 20px;">
                        <li>Keep this ticket safe and accessible</li>
                        <li>Arrive 30 minutes before event start time</li>
                        <li>This ticket is valid for one-time entry only</li>
                        <li>Contact event organizer for any issues</li>
                        <li>No refunds or exchanges allowed</li>
                    </ul>
                </div>
            </div>
            
            <div class="ticket-footer">
                <p>Generated by EventTix • Secure Digital Ticketing Platform</p>
                <p>For support, contact: support@eventtix.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Simple QR SVG generator function
function generateQRSVG(text: string): string {
  // This is a simplified version - in production, you'd use a proper QR code library
  return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="white"/>
    <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">${text}</text>
  </svg>`;
}
