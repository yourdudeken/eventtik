import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  // Fetch all tickets and events for admin analytics
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            title,
            price,
            creator_id,
            date
          )
        `)
        .eq('payment_status', 'completed');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate admin revenue (10% of each ticket)
  const adminRevenue = tickets.reduce((total, ticket) => {
    if (ticket.events && ticket.events.price) {
      return total + (Number(ticket.events.price) * 0.1);
    }
    return total;
  }, 0);

  const totalTicketsSold = tickets.length;
  const totalGrossRevenue = tickets.reduce((total, ticket) => {
    if (ticket.events && ticket.events.price) {
      return total + Number(ticket.events.price);
    }
    return total;
  }, 0);

  const activeEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= new Date();
  }).length;

  // Monthly analytics
  const currentMonth = new Date();
  const monthlyTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.created_at);
    return ticketDate.getMonth() === currentMonth.getMonth() && 
           ticketDate.getFullYear() === currentMonth.getFullYear();
  });

  const monthlyAdminRevenue = monthlyTickets.reduce((total, ticket) => {
    if (ticket.events && ticket.events.price) {
      return total + (Number(ticket.events.price) * 0.1);
    }
    return total;
  }, 0);

  if (ticketsLoading || eventsLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Platform Revenue (10%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSh {adminRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">KSh {monthlyAdminRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{monthlyTickets.length} tickets sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTicketsSold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gross Revenue:</span>
              <span className="font-semibold">KSh {totalGrossRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Creator Revenue (90%):</span>
              <span className="font-semibold">KSh {(totalGrossRevenue * 0.9).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm text-gray-600">Platform Revenue (10%):</span>
              <span className="font-bold text-green-600">KSh {adminRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Events:</span>
              <span className="font-semibold">{events.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Ticket Price:</span>
              <span className="font-semibold">
                KSh {totalTicketsSold > 0 ? Math.round(totalGrossRevenue / totalTicketsSold).toLocaleString() : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Per Event:</span>
              <span className="font-semibold">
                KSh {events.length > 0 ? Math.round(adminRevenue / events.length).toLocaleString() : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tickets.slice(0, 10).map((ticket) => (
              <div key={ticket.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <div className="font-medium">{ticket.events?.title || 'Unknown Event'}</div>
                  <div className="text-sm text-gray-600">{ticket.buyer_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">KSh {ticket.events?.price ? Number(ticket.events.price).toLocaleString() : 0}</div>
                  <div className="text-sm text-green-600">
                    +KSh {ticket.events?.price ? (Number(ticket.events.price) * 0.1).toLocaleString() : 0} platform fee
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};