
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditEventForm } from "./EditEventForm";
import { useState } from "react";

export const EventsList = () => {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['creator-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your event has been deleted successfully."
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    refetch();
  };

  if (editingEvent) {
    return (
      <EditEventForm
        event={editingEvent}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingEvent(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-600">Create your first event to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingEvent(event)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteEvent(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>
                  {new Date(event.date).toLocaleDateString()} at {event.time}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{event.venue}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{event.tickets_sold || 0} tickets sold</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Badge variant="secondary">
                KSh {Number(event.price).toLocaleString()}
              </Badge>
              <div className="text-xs text-gray-500">
                Created {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
