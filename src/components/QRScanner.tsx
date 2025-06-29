import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, User, Calendar, MapPin, CheckCircle, XCircle, Camera, CameraOff } from "lucide-react";
import QrScanner from 'react-qr-scanner';
import { supabase } from "@/integrations/supabase/client";

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        toast({
          title: "Authentication Required",
          description: "Please log in with your staff credentials to access the scanner",
          variant: "destructive"
        });
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData && (roleData.role === 'admin' || roleData.role === 'staff')) {
        setUserRole(roleData.role);
        setIsAuthorized(true);
      } else {
        toast({
          title: "Access Denied",
          description: "Only admin and staff can access the QR scanner for ticket validation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Role check error:', error);
      toast({
        title: "Error",
        description: "Failed to verify staff credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

      const formattedTicket = {
        ticketId: ticket.ticket_id,
        userId: ticket.user_id,
        eventId: ticket.event_id,
        isCheckedIn: ticket.checked_in,
        checkedInAt: ticket.checked_in_at,
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
      
      toast({
        title: "Ticket Found",
        description: `Ticket for ${ticket.buyer_name} verified`,
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
    if (!scannedTicket || !isAuthorized) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tickets')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('ticket_id', scannedTicket.ticketId);

      if (error) throw error;

      const updatedTicket = { 
        ...scannedTicket, 
        isCheckedIn: true,
        checkedInAt: new Date().toISOString()
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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying staff credentials...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Staff Access Required</h3>
            <p className="text-gray-600 mb-4">
              This scanner is restricted to authorized staff members only. 
              Please log in with your staff credentials to validate tickets at the entrance.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>For Staff:</strong> Contact your administrator to get your staff account credentials.
                You need to be logged in with a staff or admin account to access this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Card className={`border-2 ${scannedTicket.isCheckedIn ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Ticket Details</h3>
                  <Badge 
                    variant={scannedTicket.isCheckedIn ? "secondary" : "default"}
                    className={scannedTicket.isCheckedIn ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}
                  >
                    {scannedTicket.isCheckedIn ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Already Checked In
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid Ticket
                      </>
                    )}
                  </Badge>
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
                      <span>User ID:</span>
                      <span className="font-mono">{scannedTicket.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event ID:</span>
                      <span className="font-mono">{scannedTicket.eventId}</span>
                    </div>
                    {scannedTicket.checkedInAt && (
                      <div className="flex justify-between">
                        <span>Checked In:</span>
                        <span className="text-xs">{new Date(scannedTicket.checkedInAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!scannedTicket.isCheckedIn && (
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
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">This ticket has already been used</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
