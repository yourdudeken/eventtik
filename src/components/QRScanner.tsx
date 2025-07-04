import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, CheckCircle, XCircle, User, Calendar, MapPin, Ticket } from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onBack: () => void;
}

export const QRScanner = ({ onBack }: QRScannerProps) => {
  const [scanResult, setScanResult] = useState<string>('');
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [useCamera, setUseCamera] = useState(true);
  const { toast } = useToast();

  const handleScan = async (ticketId: string) => {
    if (!ticketId) return;
    
    setLoading(true);
    try {
      // Query ticket with event information
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            date,
            time,
            venue,
            description
          )
        `)
        .eq('ticket_id', ticketId)
        .single();

      if (error || !ticket) {
        toast({
          title: "Ticket Not Found",
          description: "Invalid ticket ID or ticket does not exist.",
          variant: "destructive"
        });
        return;
      }

      setTicketInfo(ticket);
      setScanResult(ticketId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to validate ticket.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!ticketInfo) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          checked_in: true, 
          checked_in_at: new Date().toISOString() 
        })
        .eq('ticket_id', ticketInfo.ticket_id);

      if (error) throw error;

      setTicketInfo({
        ...ticketInfo,
        checked_in: true,
        checked_in_at: new Date().toISOString()
      });

      toast({
        title: "Check-in Successful",
        description: `${ticketInfo.buyer_name} has been checked in successfully.`
      });
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult('');
    setTicketInfo(null);
    setManualCode('');
  };

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {!scanResult && (
            <>
              {/* Scanner Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={useCamera ? "default" : "outline"}
                  onClick={() => setUseCamera(true)}
                  size="sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
                <Button
                  variant={!useCamera ? "default" : "outline"}
                  onClick={() => setUseCamera(false)}
                  size="sm"
                >
                  Manual Entry
                </Button>
              </div>

              {useCamera ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <Scanner
                      onScan={(result) => handleScan(result[0]?.rawValue || '')}
                      onError={(error) => console.log(error)}
                      constraints={{ 
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                      }}
                      styles={{
                        container: {
                          width: '100%',
                          height: '400px'
                        }
                      }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600">
                    Position the QR code within the camera view to scan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter Ticket ID manually</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter ticket ID"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                      />
                      <Button 
                        onClick={handleManualEntry}
                        disabled={!manualCode.trim() || loading}
                      >
                        {loading ? "Validating..." : "Validate"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {ticketInfo && (
            <div className="space-y-6">
              {/* Ticket Status */}
              <div className="text-center">
                {ticketInfo.checked_in ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-8 w-8" />
                    <span className="text-xl font-semibold">Already Checked In</span>
                  </div>
                ) : ticketInfo.payment_status === 'completed' ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Ticket className="h-8 w-8" />
                    <span className="text-xl font-semibold">Valid Ticket</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="h-8 w-8" />
                    <span className="text-xl font-semibold">Invalid Ticket</span>
                  </div>
                )}
              </div>

              {/* Event Information */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-3">{ticketInfo.events.title}</h3>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Date & Time</div>
                        <div className="font-medium">
                          {new Date(ticketInfo.events.date).toLocaleDateString()} at {ticketInfo.events.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Venue</div>
                        <div className="font-medium">{ticketInfo.events.venue}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Ticket Holder</div>
                        <div className="font-medium">{ticketInfo.buyer_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Ticket ID</div>
                        <div className="font-mono text-sm">{ticketInfo.ticket_id}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Badges */}
              <div className="flex gap-2 justify-center">
                <Badge variant={ticketInfo.payment_status === 'completed' ? 'default' : 'destructive'}>
                  Payment: {ticketInfo.payment_status}
                </Badge>
                <Badge variant={ticketInfo.checked_in ? 'default' : 'secondary'}>
                  {ticketInfo.checked_in ? 'Checked In' : 'Not Checked In'}
                </Badge>
              </div>

              {/* Check-in Time */}
              {ticketInfo.checked_in && (
                <div className="text-center text-sm text-gray-600">
                  Checked in: {new Date(ticketInfo.checked_in_at).toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetScanner}
                  className="flex-1"
                >
                  Scan Another
                </Button>
                
                {!ticketInfo.checked_in && ticketInfo.payment_status === 'completed' && (
                  <Button 
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Checking In..." : "Check In"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};