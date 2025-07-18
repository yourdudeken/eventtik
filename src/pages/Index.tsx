import { useState, useEffect, useMemo } from "react";
import { EventCard } from "../components/EventCard";
import { TicketPurchase } from "../components/TicketPurchase";
import { DigitalTicket } from "../components/DigitalTicket";
import { QRScanner } from "../components/QRScanner";
import { CreatorDashboard } from "../components/CreatorDashboard";
import { AdminDashboard } from "../components/AdminDashboard";
import { AuthModal } from "../components/AuthModal";
import { AppSidebar } from "../components/AppSidebar";
import { FloatingChatbot } from "../components/FloatingChatbot";
import { SearchAndFilters } from "../components/SearchAndFilters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Ticket, Plus, ShoppingCart, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { User } from "@supabase/supabase-js";

type Event = Tables<'events'>;
type Ticket = Tables<'tickets'>;

const Index = () => {
  const [currentView, setCurrentView] = useState<'events' | 'purchase' | 'ticket' | 'scanner' | 'creator' | 'admin'>('events');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [purchasedTicket, setPurchasedTicket] = useState<Ticket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceFilter, setPriceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch events from Supabase with tickets_sold data
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

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setUserRole('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for event query parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setCurrentView('purchase');
      }
    }
  }, [events]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
    } catch (error) {
      console.error('Role check error:', error);
      setUserRole('');
    }
  };

  // Filter and sort events based on search and filter criteria
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Filter out expired events first
    const now = new Date();
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now;
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(event => {
        const price = Number(event.price);
        switch (priceFilter) {
          case 'free':
            return price === 0;
          case '0-1000':
            return price >= 0 && price <= 1000;
          case '1000-3000':
            return price > 1000 && price <= 3000;
          case '3000-5000':
            return price > 3000 && price <= 5000;
          case '5000+':
            return price > 5000;
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const thisYearStart = new Date(now.getFullYear(), 0, 1);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        switch (dateFilter) {
          case 'today':
            return eventDate.toDateString() === today.toDateString();
          case 'this-week':
            return eventDate >= thisWeekStart && eventDate < new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          case 'this-month':
            return eventDate >= thisMonthStart && eventDate < nextMonthStart;
          case 'next-month':
            return eventDate >= nextMonthStart && eventDate < new Date(now.getFullYear(), now.getMonth() + 2, 1);
          case 'this-year':
            return eventDate >= thisYearStart;
          default:
            return true;
        }
      });
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.tickets_sold || 0) - (a.tickets_sold || 0);
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [events, searchQuery, sortBy, priceFilter, dateFilter, categoryFilter]);

  // Get upcoming events (next 24 hours)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= twentyFourHoursFromNow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [events]);

  // Get most popular events
  const popularEvents = useMemo(() => {
    return [...events]
      .filter(event => event.ticket_type === 'fixed' || (event.tickets_sold || 0) > 0)
      .sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
      .slice(0, 6);
  }, [events]);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setCurrentView('purchase');
  };

  const handlePurchaseSuccess = (ticketData: Ticket) => {
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
    // Only allow staff and admin users
    if (user && (userRole === 'staff' || userRole === 'admin')) {
      setCurrentView('scanner');
    } else if (user) {
      // User is logged in but not staff/admin
      return;
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

  // Check if user has staff privileges
  const isStaffUser = userRole === 'staff' || userRole === 'admin';
  
  // Check if user is the admin
  const isAdmin = user?.email === 'kenmwendwamuthengi@gmail.com';

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
              {/* Only show Staff Scanner for staff/admin users */}
              {isStaffUser && (
                <Button
                  variant={currentView === 'scanner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleScannerAccess}
                  title="Staff access required"
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  Staff Scanner
                </Button>
              )}
              {/* Only show Admin Dashboard for specific admin user */}
              {isAdmin && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('admin')}
                  title="Admin access"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
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

              {/* Search and Filters */}
              <SearchAndFilters
                onSearch={setSearchQuery}
                onSort={setSortBy}
                onFilterByPrice={setPriceFilter}
                onFilterByDate={setDateFilter}
                onFilterByCategory={setCategoryFilter}
                searchQuery={searchQuery}
                sortBy={sortBy}
                priceFilter={priceFilter}
                dateFilter={dateFilter}
                categoryFilter={categoryFilter}
              />

              {/* Upcoming Events Section (Next 24 hours) */}
              {upcomingEvents.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events (Next 24 Hours)</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onSelect={handleEventSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Most Popular Events Section */}
              {popularEvents.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Most Popular Events</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {popularEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onSelect={handleEventSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* More Events Section */}
              <h3 className="text-2xl font-bold text-gray-900 mb-6">More Events</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading events...</p>
                </div>
              ) : filteredAndSortedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  {searchQuery || priceFilter !== 'all' || dateFilter !== 'all' || categoryFilter !== 'all' ? (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filters to find more events.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to create an event!</p>
                    </>
                  )}
                  <Button onClick={handleCreatorAccess}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
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

          {currentView === 'admin' && isAdmin && (
            <AdminDashboard 
              onBack={() => setCurrentView('events')}
            />
          )}
        </div>
      </div>

      {/* Floating Chatbot */}
      <FloatingChatbot />

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
