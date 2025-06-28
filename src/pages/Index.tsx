
import { useState } from "react";
import { EventCard } from "../components/EventCard";
import { TicketPurchase } from "../components/TicketPurchase";
import { DigitalTicket } from "../components/DigitalTicket";
import { QRScanner } from "../components/QRScanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Ticket, Users } from "lucide-react";

// Mock event data
const mockEvents = [
  {
    id: "event1",
    title: "Tech Conference 2024",
    date: "2024-07-15",
    time: "09:00",
    venue: "Nairobi Convention Center",
    price: 2500,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    description: "Join industry leaders for the biggest tech conference in East Africa"
  },
  {
    id: "event2", 
    title: "Music Festival",
    date: "2024-07-20",
    time: "18:00",
    venue: "Uhuru Gardens",
    price: 1500,
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400",
    description: "Live performances from top local and international artists"
  },
  {
    id: "event3",
    title: "Food & Wine Expo",
    date: "2024-07-25", 
    time: "12:00",
    venue: "Sarit Center",
    price: 800,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400",
    description: "Taste the finest cuisine and wines from around the world"
  }
];

const Index = () => {
  const [currentView, setCurrentView] = useState<'events' | 'purchase' | 'ticket' | 'scanner'>('events');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [purchasedTicket, setPurchasedTicket] = useState<any>(null);

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    setCurrentView('purchase');
  };

  const handlePurchaseSuccess = (ticketData: any) => {
    setPurchasedTicket(ticketData);
    setCurrentView('ticket');
  };

  const handleBackToEvents = () => {
    setCurrentView('events');
    setSelectedEvent(null);
    setPurchasedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EventTix</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'events' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('events')}
              >
                Events
              </Button>
              <Button
                variant={currentView === 'scanner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('scanner')}
              >
                <QrCode className="h-4 w-4 mr-1" />
                Scan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {currentView === 'events' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Amazing Events
              </h2>
              <p className="text-gray-600">
                Buy tickets instantly with M-Pesa. No account required!
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={handleEventSelect}
                />
              ))}
            </div>

            {/* Stats Section */}
            <Card className="mt-12 p-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-blue-100">Tickets Sold</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">200+</div>
                  <div className="text-blue-100">Events</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">99%</div>
                  <div className="text-blue-100">Success Rate</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'purchase' && selectedEvent && (
          <TicketPurchase
            event={selectedEvent}
            onSuccess={handlePurchaseSuccess}
            onBack={handleBackToEvents}
          />
        )}

        {currentView === 'ticket' && purchasedTicket && (
          <DigitalTicket
            ticket={purchasedTicket}
            onBack={handleBackToEvents}
          />
        )}

        {currentView === 'scanner' && (
          <QRScanner onBack={() => setCurrentView('events')} />
        )}
      </div>
    </div>
  );
};

export default Index;
