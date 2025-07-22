
-- Create an admin user in the profiles table
-- First, let's make sure we can insert into profiles (temporarily disable RLS for this operation)
INSERT INTO public.profiles (id, email, full_name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@clinic-system.com',
  'System Administrator',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'admin@clinic-system.com',
  full_name = 'System Administrator';
