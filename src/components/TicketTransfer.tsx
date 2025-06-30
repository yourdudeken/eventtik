
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TicketTransferProps {
  ticket: any;
  onBack: () => void;
  onTransferComplete: () => void;
}

export const TicketTransfer = ({ ticket, onBack, onTransferComplete }: TicketTransferProps) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const { toast } = useToast();

  const handleTransfer = async () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the recipient's email address",
        variant: "destructive"
      });
      return;
    }

    if (recipientEmail === ticket.buyer.email) {
      toast({
        title: "Invalid Email",
        description: "You cannot transfer a ticket to yourself",
        variant: "destructive"
      });
      return;
    }

    setIsTransferring(true);

    try {
      const transferToken = `TXF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'transferred',
          transfer_token: transferToken,
          transferred_to_email: recipientEmail,
          transferred_at: new Date().toISOString()
        })
        .eq('ticket_id', ticket.ticketId);

      if (error) throw error;

      // Send transfer notification email (you could implement this with an edge function)
      console.log('Transfer notification should be sent to:', recipientEmail);

      setTransferComplete(true);
      toast({
        title: "Transfer Successful!",
        description: `Ticket has been transferred to ${recipientEmail}`,
      });

      setTimeout(() => {
        onTransferComplete();
      }, 3000);

    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer ticket",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (transferComplete) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Transfer Complete!</h3>
          <p className="text-gray-600 mb-4">
            Your ticket has been successfully transferred to {recipientEmail}
          </p>
          <p className="text-sm text-gray-500">
            The recipient will receive an email with the ticket details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Ticket
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Ticket
          </CardTitle>
          <p className="text-sm text-gray-600">
            Transfer your ticket to someone else. They will receive full access to the event.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Ticket Details</h3>
            <div className="text-sm space-y-1">
              <p><strong>Event:</strong> {ticket.event.title}</p>
              <p><strong>Date:</strong> {new Date(ticket.event.date).toLocaleDateString()}</p>
              <p><strong>Venue:</strong> {ticket.event.venue}</p>
              <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientEmail">Recipient's Email Address</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={isTransferring}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Once transferred, you will lose access to this ticket</li>
                <li>• The recipient will receive the ticket via email</li>
                <li>• This action cannot be undone</li>
                <li>• Make sure the email address is correct</li>
              </ul>
            </div>

            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !recipientEmail.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isTransferring ? 'Transferring...' : 'Transfer Ticket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
