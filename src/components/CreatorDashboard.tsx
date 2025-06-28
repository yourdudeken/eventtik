
import { useState } from "react";
import { CreateEventForm } from "./CreateEventForm";
import { EventsList } from "./EventsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar, BarChart3 } from "lucide-react";

interface CreatorDashboardProps {
  onBack: () => void;
  onEventCreated: () => void;
}

export const CreatorDashboard = ({ onBack, onEventCreated }: CreatorDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'events'>('overview');

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
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Tickets Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh 0</div>
              <p className="text-xs text-muted-foreground">+KSh 0 from last month</p>
            </CardContent>
          </Card>
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
