-- Add category column to events table
ALTER TABLE public.events ADD COLUMN category TEXT DEFAULT 'general';

-- Update existing events with sample categories
UPDATE public.events SET category = CASE 
  WHEN RANDOM() < 0.2 THEN 'business'
  WHEN RANDOM() < 0.4 THEN 'education' 
  WHEN RANDOM() < 0.6 THEN 'music'
  WHEN RANDOM() < 0.8 THEN 'entertainment'
  ELSE 'vacation'
END;

-- Create email subscriptions table
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for email subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.email_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Subscriptions are viewable by admins only" 
ON public.email_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_subscriptions_updated_at
BEFORE UPDATE ON public.email_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();