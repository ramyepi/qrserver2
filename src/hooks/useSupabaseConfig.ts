import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSiteSettings } from './useSiteSettings';
import type { Database } from '@/integrations/supabase/types';

export const useSupabaseConfig = () => {
  const { data: settings } = useSiteSettings();
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient<Database>> | null>(null);

  useEffect(() => {
    if (!settings) return;

    const supabaseUrl = settings.find(s => s.key === 'supabase_url')?.value;
    const supabaseKey = settings.find(s => s.key === 'supabase_anon_key')?.value;

    if (supabaseUrl && supabaseKey) {
      const client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      setSupabaseClient(client);
    }
  }, [settings]);

  return supabaseClient;
};