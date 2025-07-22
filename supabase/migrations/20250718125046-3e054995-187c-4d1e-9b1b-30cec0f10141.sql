
-- Ensure baraatel@gmail.com has admin role
INSERT INTO public.profiles (id, email, full_name, role) 
VALUES (
  '20f7d6af-1a8c-4efd-9fa2-28b19d3ce46c'::uuid,
  'baraatel@gmail.com',
  'Admin User',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'baraatel@gmail.com',
  full_name = 'Admin User';
