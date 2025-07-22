-- Create enhanced function for manual license updates with detailed statistics
CREATE OR REPLACE FUNCTION public.update_expired_licenses_manual()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER := 0;
  near_expiry_count INTEGER := 0;
  total_expired INTEGER := 0;
  result jsonb;
BEGIN
  -- Update expired licenses and get count
  UPDATE public.clinics 
  SET license_status = 'expired',
      updated_at = now()
  WHERE expiry_date < CURRENT_DATE 
    AND license_status != 'expired';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Count total expired licenses
  SELECT COUNT(*) INTO total_expired
  FROM public.clinics 
  WHERE license_status = 'expired';
  
  -- Count licenses expiring within 30 days
  SELECT COUNT(*) INTO near_expiry_count
  FROM public.clinics 
  WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND license_status = 'active';
  
  -- Build result JSON
  result := jsonb_build_object(
    'updated_count', updated_count,
    'total_expired', total_expired,
    'near_expiry_count', near_expiry_count,
    'last_updated', now(),
    'success', true
  );
  
  -- Log the operation
  RAISE LOG 'Manual update completed: % licenses updated, % total expired, % near expiry', 
    updated_count, total_expired, near_expiry_count;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Handle errors gracefully
    RAISE LOG 'Manual update failed: %', SQLERRM;
    RETURN jsonb_build_object(
      'updated_count', 0,
      'total_expired', 0,
      'near_expiry_count', 0,
      'last_updated', now(),
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Create index for better performance on expiry_date queries
CREATE INDEX IF NOT EXISTS idx_clinics_expiry_date ON public.clinics(expiry_date);
CREATE INDEX IF NOT EXISTS idx_clinics_license_status ON public.clinics(license_status);