import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, User, Calendar, MapPin, CheckCircle, XCircle, Camera, CameraOff, AlertTriangle } from "lucide-react";
import QrScanner from 'react-qr-scanner';
import { supabase } from "@/integrations/supabase/client";
import { StaffRoute } from "./StaffRoute";

interface QRScannerProps {
  onBack: () => void;
}

export const QRScanner = ({ onBack }: QRScannerProps) => {
  const [scanInput, setScanInput] = useState('');
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error('Role fetch error:', error);
    }
  };

  const processTicketScan = async (ticketData: string) => {
    console.log("Processing ticket:", ticketData);

    try {
      // Extract ticket ID from QR code or use direct input
      const ticketId = ticketData.includes('TKT-') ? 
        ticketData.split('-')[0] + '-' + ticketData.split('-')[1] : 
        ticketData;

      // Look up ticket in database
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            date,
            time,
            venue
          )
        `)
        .eq('ticket_id', ticketId)
        .single();
      
      if (error || !ticket) {
        toast({
          title: "Invalid Ticket",
          description: "Ticket not found or invalid QR code",
          variant: "destructive"
        });
        setScannedTicket(null);
        return;
      }

      if (ticket.payment_status !== 'completed') {
        toast({
          title: "Invalid Ticket",
          description: "Ticket payment not completed",
          variant: "destructive"
        });
        setScannedTicket(null);
        return;
      }

      // Check ticket status
      if (ticket.status === 'revoked') {
        toast({
          title: "Revoked Ticket",
          description: "This ticket has been revoked and is no longer valid",
          variant: "destructive"
        });
      } else if (ticket.status === 'transferred') {
        toast({
          title: "Transferred Ticket",
          description: "This ticket has been transferred to another person",
          variant: "destructive"
        });
      }

      const formattedTicket = {
        ticketId: ticket.ticket_id,
        userId: ticket.user_id,
        eventId: ticket.event_id,
        isCheckedIn: ticket.checked_in,
        checkedInAt: ticket.checked_in_at,
        status: ticket.status,
        transferredTo: ticket.transferred_to_email,
        transferredAt: ticket.transferred_at,
        buyer: {
          name: ticket.buyer_name,
          email: ticket.buyer_email,
          phone: ticket.buyer_phone
        },
        event: {
          title: ticket.events?.title,
          date: ticket.events?.date,
          time: ticket.events?.time,
          venue: ticket.events?.venue
        }
      };

      setScannedTicket(formattedTicket);
      setShowCamera(false);
      
      const statusMessage = ticket.status === 'valid' ? 
        `Valid ticket for ${ticket.buyer_name}` :
        `Ticket status: ${ticket.status}`;
      
      toast({
        title: "Ticket Scanned",
        description: statusMessage,
        variant: ticket.status === 'valid' ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Ticket processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process ticket",
        variant: "destructive"
      });
      setScannedTicket(null);
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) {
      toast({
        title: "No Input",
        description: "Please enter a ticket ID or QR code data",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      processTicketScan(scanInput);
      setIsScanning(false);
    }, 1500);
  };

  const handleQrScan = (data: any) => {
    if (data) {
      processTicketScan(data.text || data);
    }
  };

  const handleQrError = (err: any) => {
    console.error('QR Scanner error:', err);
    setCameraError('Failed to access camera. Please check permissions.');
    setShowCamera(false);
  };

  const handleCheckIn = async () => {
    if (!scannedTicket) return;

    if (scannedTicket.status !== 'valid') {
      toast({
        title: "Cannot Check In",
        description: `Ticket status is ${scannedTicket.status}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tickets')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          status: 'checked_in'
        })
        .eq('ticket_id', scannedTicket.ticketId);

      if (error) throw error;

      const updatedTicket = { 
        ...scannedTicket, 
        isCheckedIn: true,
        checkedInAt: new Date().toISOString(),
        status: 'checked_in'
      };
      setScannedTicket(updatedTicket);
      
      toast({
        title: "Check-in Successful",
        description: `${scannedTicket.buyer.name} has been checked in`,
      });
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in attendee",
        variant: "destructive"
      });
    }
  };

  const handleNewScan = () => {
    setScanInput('');
    setScannedTicket(null);
    setShowCamera(false);
    setCameraError('');
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
    setCameraError('');
  };

  const getTicketStatusBadge = (status: string, isCheckedIn: boolean) => {
    if (isCheckedIn) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Already Checked In
        </Badge>
      );
    }

    switch (status) {
      case 'valid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid Ticket
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      case 'transferred':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Transferred
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <StaffRoute onBack={onBack}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            QR Code Scanner
            <Badge variant="secondary" className="ml-auto">
              {userRole === 'admin' ? 'Admin' : 'Staff'}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Scan ticket QR codes to verify and check-in attendees
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Options */}
          <div className="flex gap-2">
            <Button
              onClick={toggleCamera}
              variant={showCamera ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              {showCamera ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {showCamera ? 'Close Camera' : 'Open Camera'}
            </Button>
          </div>

          {/* Camera Scanner */}
          {showCamera && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Camera Scanner</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Point your camera at the QR code on the ticket
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <QrScanner
                      delay={300}
                      style={{ width: '100%', height: '100%' }}
                      onError={handleQrError}
                      onScan={handleQrScan}
                    />
                  </div>
                </div>

                {cameraError && (
                  <div className="text-center text-red-600 text-sm">
                    {cameraError}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Manual Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="scanInput">Or Enter Ticket ID Manually</Label>
              <Input
                id="scanInput"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="TKT-001 or scan QR code data"
                disabled={isScanning}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="flex-1"
              >
                {isScanning ? 'Scanning...' : 'Scan Ticket'}
              </Button>
              
              {scannedTicket && (
                <Button
                  onClick={handleNewScan}
                  variant="outline"
                >
                  New Scan
                </Button>
              )}
            </div>
          </div>

          {/* Scanned Ticket Details */}
          {scannedTicket && (
            <Card className={`border-2 ${
              scannedTicket.status === 'valid' && !scannedTicket.isCheckedIn ? 'border-green-200 bg-green-50' :
              scannedTicket.isCheckedIn ? 'border-orange-200 bg-orange-50' :
              'border-red-200 bg-red-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Ticket Details</h3>
                  {getTicketStatusBadge(scannedTicket.status, scannedTicket.isCheckedIn)}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{scannedTicket.buyer.name}</div>
                        <div className="text-sm text-gray-600">{scannedTicket.buyer.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{scannedTicket.event.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{scannedTicket.event.venue}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ticket ID:</span>
                      <span className="font-mono">{scannedTicket.ticketId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{scannedTicket.status}</span>
                    </div>
                    {scannedTicket.checkedInAt && (
                      <div className="flex justify-between">
                        <span>Checked In:</span>
                        <span className="text-xs">{new Date(scannedTicket.checkedInAt).toLocaleString()}</span>
                      </div>
                    )}
                    {scannedTicket.transferredTo && (
                      <div className="flex justify-between">
                        <span>Transferred To:</span>
                        <span className="text-xs">{scannedTicket.transferredTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {scannedTicket.status === 'valid' && !scannedTicket.isCheckedIn && (
                  <Button
                    onClick={handleCheckIn}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check In Attendee
                  </Button>
                )}

                {scannedTicket.isCheckedIn && (
                  <div className="mt-4 p-3 bg-orange-100 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">This attendee has been checked in</span>
                    </div>
                  </div>
                )}

                {(scannedTicket.status === 'revoked' || scannedTicket.status === 'transferred') && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-red-800">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">
                        This ticket is {scannedTicket.status} and cannot be used for entry
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </StaffRoute>
  );
};
