
import { useState, useEffect } from "react";
import { CreateEventForm } from "./CreateEventForm";
import { EventsList } from "./EventsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CreatorDashboardProps {
  onBack: () => void;
  onEventCreated: () => void;
}

export const CreatorDashboard = ({ onBack, onEventCreated }: CreatorDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'events'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch creator's events and ticket sales data
  const { data: creatorEvents = [], isLoading } = useQuery({
    queryKey: ['creator-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          tickets!inner(
            payment_status,
            events(price)
          )
        `)
        .eq('creator_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Calculate statistics
  const totalEvents = creatorEvents.length;
  const totalTicketsSold = creatorEvents.reduce((total, event) => {
    return total + (event.tickets_sold || 0);
  }, 0);
  
  const totalRevenue = creatorEvents.reduce((total, event) => {
    const completedTickets = event.tickets?.filter(t => t.payment_status === 'completed') || [];
    return total + (completedTickets.length * Number(event.price));
  }, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'create' ? 'default' : 'outline'}
          onClick={() => setActiveTab('create')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
        <Button
          variant={activeTab === 'events' ? 'default' : 'outline'}
          onClick={() => setActiveTab('events')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          My Events
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEvents}</div>
                    <p className="text-xs text-muted-foreground">Events created</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Tickets Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalTicketsSold}</div>
                    <p className="text-xs text-muted-foreground">Across all events</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">KSh {totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total earnings (90% after platform fee)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Event Performance */}
              {creatorEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {creatorEvents.slice(0, 5).map((event) => {
                        const soldTickets = event.tickets_sold || 0;
                        const revenue = soldTickets * Number(event.price);
                        return (
                          <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{soldTickets} tickets sold</div>
                              <div className="text-sm text-green-600">KSh {revenue.toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <CreateEventForm 
          onSuccess={() => {
            onEventCreated();
            setActiveTab('events');
          }}
        />
      )}

      {activeTab === 'events' && (
        <EventsList />
      )}
    </div>
  );
};
