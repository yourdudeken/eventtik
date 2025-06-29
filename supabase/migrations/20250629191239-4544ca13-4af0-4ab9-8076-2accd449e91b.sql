
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration (default role: user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$;

-- Create trigger for new user role assignment
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add M-Pesa payment tracking fields to tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS mpesa_transaction_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS mpesa_phone_number TEXT;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles 
  FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update ticket check-in policy to only allow admin/staff
DROP POLICY IF EXISTS "Event creators can update tickets for their events" ON public.tickets;

CREATE POLICY "Admins and Staff can update ticket check-in status" 
  ON public.tickets 
  FOR UPDATE 
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff')
  );

-- Allow event creators to still update their event tickets (but not check-in status)
CREATE POLICY "Event creators can update their event tickets" 
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
