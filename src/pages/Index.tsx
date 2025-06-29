import { useState, useEffect } from "react";
import { EventCard } from "../components/EventCard";
import { TicketPurchase } from "../components/TicketPurchase";
import { DigitalTicket } from "../components/DigitalTicket";
import { QRScanner } from "../components/QRScanner";
import { CreatorDashboard } from "../components/CreatorDashboard";
import { AuthModal } from "../components/AuthModal";
import { AppSidebar } from "../components/AppSidebar";
import { Footer } from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Ticket, Users, Plus, User, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Index = () => {
  const [currentView, setCurrentView] = useState<'events' | 'purchase' | 'ticket' | 'scanner' | 'creator'>('events');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [purchasedTicket, setPurchasedTicket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch events from Supabase
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleEventSelect = (event: any) => {
    // No authentication required for ticket purchase
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

  const handleCreatorAccess = () => {
    if (user) {
      setCurrentView('creator');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleScannerAccess = () => {
    // Always require authentication for scanner access
    if (user) {
      setCurrentView('scanner');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (currentView === 'scanner') {
      setCurrentView('scanner');
    } else {
      setCurrentView('creator');
    }
  };

  const handleNavigation = (view: string) => {
    if (view === 'events') {
      setCurrentView('events');
    } else if (view === 'creator') {
      handleCreatorAccess();
    } else if (view === 'scanner') {
      handleScannerAccess();
    } else if (view === 'auth') {
      setShowAuthModal(true);
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AppSidebar 
                user={user} 
                onNavigate={handleNavigation}
                onSignOut={handleSignOut}
              />
              <div className="flex items-center gap-2">
                <Ticket className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">EventTix</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'events' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('events')}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy Tickets
              </Button>
              <Button
                variant={currentView === 'creator' ? 'default' : 'outline'}
                size="sm"
                onClick={handleCreatorAccess}
                title="Account required to create events"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
              <Button
                variant={currentView === 'scanner' ? 'default' : 'outline'}
                size="sm"
                onClick={handleScannerAccess}
                title="Staff login required"
              >
                <QrCode className="h-4 w-4 mr-1" />
                Staff Scanner
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => supabase.auth.signOut()}
                >
                  <User className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
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
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
                  <p className="text-gray-600 mb-4">Be the first to create an event!</p>
                  <Button onClick={handleCreatorAccess}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={{
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        time: event.time,
                        venue: event.venue,
                        price: Number(event.price),
                        image: event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
                        description: event.description || ""
                      }}
                      onSelect={handleEventSelect}
                    />
                  ))}
                </div>
              )}

              {/* Stats Section */}
              <Card className="mt-12 p-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">50K+</div>
                    <div className="text-blue-100">Tickets Sold</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{events.length}</div>
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

          {currentView === 'creator' && user && (
            <CreatorDashboard 
              onBack={() => setCurrentView('events')}
              onEventCreated={() => refetch()}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Index;
