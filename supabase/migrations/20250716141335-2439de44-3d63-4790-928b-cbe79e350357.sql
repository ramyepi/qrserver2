
-- Update the QR code generation function to create proper JSON format
CREATE OR REPLACE FUNCTION generate_clinic_qr(license_num TEXT, clinic_id_param UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN json_build_object(
    'type', 'clinic',
    'license', license_num,
    'id', clinic_id_param,
    'issued', CURRENT_DATE
  )::text;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate QR codes
CREATE OR REPLACE FUNCTION auto_generate_qr_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate QR code if not provided
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code = generate_clinic_qr(NEW.license_number, NEW.id);
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto QR generation on insert and update
DROP TRIGGER IF EXISTS trigger_auto_generate_qr ON public.clinics;
CREATE TRIGGER trigger_auto_generate_qr
  BEFORE INSERT OR UPDATE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_qr_trigger();

-- Update existing clinics to have proper QR codes
UPDATE public.clinics 
SET qr_code = generate_clinic_qr(license_number, id)
WHERE qr_code IS NULL OR qr_code = license_number;

-- Add policies for CRUD operations on clinics (for admin functionality)
CREATE POLICY "Enable all operations for clinics" 
  ON public.clinics 
  FOR ALL
  USING (true)
  WITH CHECK (true);
