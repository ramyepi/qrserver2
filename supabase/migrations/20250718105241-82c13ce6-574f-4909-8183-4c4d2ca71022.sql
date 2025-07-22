
-- Phase 1: Database Security & Performance Fixes

-- Enable RLS on verification_rate_limits table
ALTER TABLE public.verification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for verification_rate_limits
CREATE POLICY "Anyone can insert rate limits" 
  ON public.verification_rate_limits 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can manage rate limits" 
  ON public.verification_rate_limits 
  FOR ALL 
  USING (true);

-- Fix database function security by updating search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.get_current_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.check_verification_rate_limit(client_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean old entries (older than 1 hour)
  DELETE FROM public.verification_rate_limits 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  -- Check current requests in the last hour
  SELECT COUNT(*) INTO current_count
  FROM public.verification_rate_limits
  WHERE ip_address = client_ip
    AND window_start > now() - INTERVAL '1 hour';
  
  -- Allow up to 100 requests per hour per IP
  IF current_count >= 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Log this request
  INSERT INTO public.verification_rate_limits (ip_address)
  VALUES (client_ip);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and allow request to continue
    RAISE LOG 'Rate limit check failed: %', SQLERRM;
    RETURN TRUE;
END;
$$;

-- Enable realtime for clinics table
ALTER TABLE public.clinics REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.clinics;

-- Add better error handling to auto_generate_qr_trigger
CREATE OR REPLACE FUNCTION public.auto_generate_qr_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate QR code if not provided
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    BEGIN
      NEW.qr_code = generate_clinic_qr(NEW.license_number, NEW.id);
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the insert/update
        RAISE LOG 'QR generation failed: %', SQLERRM;
        NEW.qr_code = NEW.license_number; -- Fallback to license number
    END;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to auto-generate QR codes
DROP TRIGGER IF EXISTS trigger_auto_generate_qr ON public.clinics;
CREATE TRIGGER trigger_auto_generate_qr
  BEFORE INSERT OR UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_qr_trigger();
