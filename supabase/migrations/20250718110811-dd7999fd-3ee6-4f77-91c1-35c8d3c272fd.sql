-- Create function to automatically update expired licenses
CREATE OR REPLACE FUNCTION public.update_expired_licenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update clinics where expiry_date has passed and status is not already expired
  UPDATE public.clinics 
  SET license_status = 'expired',
      updated_at = now()
  WHERE expiry_date < CURRENT_DATE 
    AND license_status != 'expired';
    
  -- Log how many records were updated
  RAISE LOG 'Updated % expired licenses', ROW_COUNT;
END;
$$;

-- Create a trigger function to check expiry on each update/insert
CREATE OR REPLACE FUNCTION public.check_license_expiry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If expiry_date is in the past, automatically set status to expired
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.license_status = 'expired';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to check expiry on insert/update
DROP TRIGGER IF EXISTS trigger_check_license_expiry ON public.clinics;
CREATE TRIGGER trigger_check_license_expiry
  BEFORE INSERT OR UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION check_license_expiry();

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run daily at 2 AM to update expired licenses
SELECT cron.schedule(
  'update-expired-licenses',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT public.update_expired_licenses();'
);