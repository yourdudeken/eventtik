
-- Insert test promo codes for different scenarios
INSERT INTO public.promo_codes (code, discount_type, discount_value, is_active, max_uses, current_uses, valid_from, valid_until) VALUES
('WELCOME10', 'percentage', 10, true, 100, 0, now(), now() + interval '6 months'),
('SAVE50', 'fixed', 50, true, 50, 0, now(), now() + interval '3 months'),
('EARLY20', 'percentage', 20, true, 200, 0, now(), now() + interval '2 months'),
('STUDENT25', 'percentage', 25, true, 150, 0, now(), now() + interval '1 year'),
('FLASH100', 'fixed', 100, true, 25, 0, now(), now() + interval '1 month');

-- Add some admin and staff users for testing (you can change these user IDs to actual ones from your auth.users table)
-- Note: Replace these UUIDs with actual user IDs from your Supabase auth.users table
INSERT INTO public.user_roles (user_id, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin'),
('00000000-0000-0000-0000-000000000002', 'staff')
ON CONFLICT (user_id, role) DO NOTHING;
