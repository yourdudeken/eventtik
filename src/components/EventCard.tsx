
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Event = Tables<'events'>;

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
}

export const EventCard = ({ event, onSelect }: EventCardProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isSoldOut = event.ticket_type === 'fixed' && 
    event.max_tickets !== undefined && 
    event.tickets_sold !== undefined && 
    event.tickets_sold >= event.max_tickets;

  const formatCategory = (category?: string) => {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
      <div className="relative">
        <img
          src={event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
          KSh {event.price.toLocaleString()}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">
            {event.title}
          </h3>
          {event.category && (
            <Badge variant="outline" className="text-xs ml-2">
              {formatCategory(event.category)}
            </Badge>
          )}
        </div>
        
        {isSoldOut && (
          <Badge className="bg-red-500 hover:bg-red-600 mb-2">
            SOLD OUT
          </Badge>
        )}
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>{formatDate(event.date)} at {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>{event.venue}</span>
          </div>
          {event.ticket_type === 'fixed' && event.max_tickets && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Tickets remaining:
              </span>
              <span className="font-medium">
                {Math.max(0, event.max_tickets - (event.tickets_sold || 0))} / {event.max_tickets}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onSelect(event)}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          disabled={isSoldOut}
        >
          {isSoldOut ? 'Sold Out' : 'Buy Ticket'}
        </Button>
      </CardFooter>
    </Card>
  );
};
