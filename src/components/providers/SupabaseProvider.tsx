import { ReactNode, useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { updateSupabaseConfig } from '@/integrations/supabase/client';

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    const supabaseUrl = settings.find(s => s.key === 'supabase_url')?.value;
    const supabaseKey = settings.find(s => s.key === 'supabase_anon_key')?.value;

    if (supabaseUrl && supabaseKey) {
      updateSupabaseConfig(supabaseUrl, supabaseKey);
    }
  }, [settings]);

  return <>{children}</>;
}