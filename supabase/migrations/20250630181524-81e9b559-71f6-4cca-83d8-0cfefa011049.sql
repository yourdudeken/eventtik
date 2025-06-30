
-- Add ticket verification status and transfer functionality
ALTER TABLE public.tickets 
ADD COLUMN status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'checked_in', 'revoked', 'transferred')),
ADD COLUMN transfer_token TEXT UNIQUE,
ADD COLUMN transferred_to_email TEXT,
ADD COLUMN transferred_at TIMESTAMP WITH TIME ZONE;

-- Add promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add event feedback table
CREATE TABLE public.event_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_id TEXT REFERENCES public.tickets(ticket_id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add event reminders table
CREATE TABLE public.event_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT REFERENCES public.tickets(ticket_id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_transfer_token ON public.tickets(transfer_token);
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_event_id ON public.promo_codes(event_id);
CREATE INDEX idx_event_reminders_scheduled ON public.event_reminders(scheduled_for);
CREATE INDEX idx_event_reminders_status ON public.event_reminders(status);

-- Enable RLS on new tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes
CREATE POLICY "Anyone can view active promo codes" 
  ON public.promo_codes 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Event creators can manage promo codes" 
  ON public.promo_codes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = promo_codes.event_id 
      AND events.creator_id::uuid = auth.uid()
    )
  );

-- RLS policies for event_feedback
CREATE POLICY "Users can view feedback for events they created" 
  ON public.event_feedback 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = event_feedback.event_id 
      AND events.creator_id::uuid = auth.uid()
    )
  );

CREATE POLICY "Ticket holders can submit feedback" 
  ON public.event_feedback 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE tickets.ticket_id = event_feedback.ticket_id 
      AND tickets.payment_status = 'completed'
    )
  );

-- RLS policies for event_reminders
CREATE POLICY "Users can view their own reminders" 
  ON public.event_reminders 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE tickets.ticket_id = event_reminders.ticket_id 
      AND tickets.buyer_email = auth.jwt()->>'email'
    )
  );

-- Add receipt number to tickets
ALTER TABLE public.tickets 
ADD COLUMN receipt_number TEXT UNIQUE DEFAULT ('RCP-' || EXTRACT(epoch FROM now())::bigint || '-' || substring(gen_random_uuid()::text, 1, 8));
