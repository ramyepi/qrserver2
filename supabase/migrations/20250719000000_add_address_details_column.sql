-- Add address_details column to clinics table
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS address_details TEXT;

-- Update the database types cache
COMMENT ON TABLE public.clinics IS 'Dental clinics information';

-- Create a function to extract address components
CREATE OR REPLACE FUNCTION extract_address_components()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  clinic_record RECORD;
BEGIN
  -- Loop through all clinics
  FOR clinic_record IN SELECT id, address FROM public.clinics WHERE address IS NOT NULL LOOP
    -- Extract components from address
    -- Format is typically: 'Governorate، City، Details'
    BEGIN
      -- Split the address by '،' (Arabic comma)
      WITH address_parts AS (
        SELECT 
          id,
          string_to_array(address, '،') as parts
        FROM (VALUES (clinic_record.id, clinic_record.address)) as t(id, address)
      )
      UPDATE public.clinics
      SET 
        governorate = CASE 
          WHEN array_length(parts, 1) >= 1 THEN trim(parts[1])
          ELSE NULL
        END,
        city = CASE 
          WHEN array_length(parts, 1) >= 2 THEN trim(parts[2])
          ELSE NULL
        END,
        address_details = CASE 
          WHEN array_length(parts, 1) >= 3 THEN trim(parts[3])
          ELSE NULL
        END
      FROM address_parts
      WHERE clinics.id = address_parts.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- If there's an error processing this record, just continue to the next
        RAISE NOTICE 'Error processing address for clinic %: %', clinic_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Address components extraction completed';
END;
$$;

-- Run the function to populate the new columns
SELECT extract_address_components();