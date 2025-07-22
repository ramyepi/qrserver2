-- Add Supabase configuration settings
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('supabase_url', '', 'Supabase project URL (SUPABASE_URL)'),
  ('supabase_anon_key', '', 'Supabase anonymous API key (SUPABASE_ANON_KEY)')
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

-- Add RLS policy for Supabase settings
CREATE POLICY "Only admins can manage Supabase settings"
  ON public.site_settings
  FOR ALL
  USING (key LIKE 'supabase_%' AND (SELECT is_admin()))
  WITH CHECK (key LIKE 'supabase_%' AND (SELECT is_admin()));