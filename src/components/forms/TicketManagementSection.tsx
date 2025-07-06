import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock } from "lucide-react";

interface TicketManagementSectionProps {
  ticketType: string;
  maxTickets: string;
  ticketDeadline: string;
  onTicketTypeChange: (value: string) => void;
  onMaxTicketsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTicketDeadlineChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TicketManagementSection = ({
  ticketType,
  maxTickets,
  ticketDeadline,
  onTicketTypeChange,
  onMaxTicketsChange,
  onTicketDeadlineChange
}: TicketManagementSectionProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Users className="h-5 w-5" />
        Ticket Management
      </h3>
      
      <div>
        <Label htmlFor="ticket_type">Ticket Type *</Label>
        <Select value={ticketType} onValueChange={onTicketTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select ticket type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open Tickets (No limit)</SelectItem>
            <SelectItem value="fixed">Fixed Number of Tickets</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Choose whether to limit the number of tickets or keep it open
        </p>
      </div>

      {ticketType === 'fixed' && (
        <div>
          <Label htmlFor="max_tickets">Maximum Tickets *</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="max_tickets"
              name="max_tickets"
              type="number"
              min="1"
              placeholder="100"
              value={maxTickets}
              onChange={onMaxTicketsChange}
              className="pl-10"
              required={ticketType === 'fixed'}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Set the maximum number of tickets available for this event
          </p>
        </div>
      )}

      {ticketType === 'open' && (
        <div>
          <Label htmlFor="ticket_deadline">Ticket Sales Deadline (Optional)</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="ticket_deadline"
              name="ticket_deadline"
              type="datetime-local"
              value={ticketDeadline}
              onChange={onTicketDeadlineChange}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Set when ticket sales should stop (must be before event date)
          </p>
        </div>
      )}
    </div>
  );
};