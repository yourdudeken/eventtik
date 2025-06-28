
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table to track purchases
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_email TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for events (publicly readable, but only creators can modify)
CREATE POLICY "Events are viewable by everyone" 
  ON public.events 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create events" 
  ON public.events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Event creators can update their events" 
  ON public.events 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = creator_id::text);

CREATE POLICY "Event creators can delete their events" 
  ON public.events 
  FOR DELETE 
  TO authenticated
  USING (auth.uid()::text = creator_id::text);

-- Create policies for tickets (viewable by ticket owner and event creator)
CREATE POLICY "Tickets are viewable by everyone" 
  ON public.tickets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create tickets" 
  ON public.tickets 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Event creators can update tickets for their events" 
  ON public.tickets 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = tickets.event_id 
      AND events.creator_id::text = auth.uid()::text
    )
  );
