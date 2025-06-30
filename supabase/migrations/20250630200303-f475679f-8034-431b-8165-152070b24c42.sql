
-- Add ticket management columns to events table
ALTER TABLE public.events 
ADD COLUMN ticket_type TEXT DEFAULT 'open' CHECK (ticket_type IN ('fixed', 'open')),
ADD COLUMN max_tickets INTEGER,
ADD COLUMN tickets_sold INTEGER DEFAULT 0,
ADD COLUMN ticket_deadline TIMESTAMP WITH TIME ZONE;

-- Create function to update tickets sold count
CREATE OR REPLACE FUNCTION update_tickets_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE public.events 
    SET tickets_sold = COALESCE(tickets_sold, 0) + 1
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tickets sold
CREATE TRIGGER trigger_update_tickets_sold
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_sold();

-- Create trigger for new ticket purchases
CREATE OR REPLACE FUNCTION increment_tickets_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' THEN
    UPDATE public.events 
    SET tickets_sold = COALESCE(tickets_sold, 0) + 1
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_tickets_sold
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION increment_tickets_sold();
