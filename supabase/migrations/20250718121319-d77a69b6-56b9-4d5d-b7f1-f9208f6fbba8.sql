
-- First, let's make sure we have proper admin policies for the clinics table
-- Drop existing conflicting policies and recreate them properly

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert clinics" ON public.clinics;
DROP POLICY IF EXISTS "Admins can update clinics" ON public.clinics;
DROP POLICY IF EXISTS "Admins can delete clinics" ON public.clinics;
DROP POLICY IF EXISTS "Admins can view all clinics" ON public.clinics;

-- Create comprehensive admin policies that allow all operations
CREATE POLICY "Admins can manage all clinics" 
  ON public.clinics 
  FOR ALL 
  USING (is_admin()) 
  WITH CHECK (is_admin());

-- Also ensure the is_admin function works correctly by updating it
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin',
    false
  );
$$;

-- Make sure we also have a policy for public viewing (for license verification)
CREATE POLICY "Public can view active clinics" 
  ON public.clinics 
  FOR SELECT 
  USING (license_status = 'active');

-- Create a comprehensive policy for anyone to view clinics (needed for verification)
CREATE POLICY "Anyone can view clinics for verification" 
  ON public.clinics 
  FOR SELECT 
  USING (true);
