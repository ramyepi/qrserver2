
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

// Helper to check MySQL as data source
const isMySQL = () => localStorage.getItem('useMySQL') === 'true';
const getMySQLConfig = () => ({
  host: localStorage.getItem('mysql_host') || 'localhost',
  port: localStorage.getItem('mysql_port') || '3306',
  database: localStorage.getItem('mysql_database') || '',
  user: localStorage.getItem('mysql_user') || '',
  password: localStorage.getItem('mysql_password') || ''
});
const getApiBaseUrl = () => localStorage.getItem('api_base_url') || '';

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      if (isMySQL()) {
        const config = getMySQLConfig();
        const params = new URLSearchParams(config).toString();
        const res = await fetch(`${getApiBaseUrl()}/api/mysql/site-settings?${params}`);
        if (!res.ok) throw new Error('فشل في جلب إعدادات الموقع من MySQL');
        return await res.json();
      }
      // Supabase fetch
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      if (error) {
        console.error('Error fetching site settings:', error);
        throw error;
      }
      return data as SiteSetting[];
    },
  });
};

export const useSiteSetting = (key: string) => {
  const { data: settings, isLoading, error } = useSiteSettings();
  
  const setting = settings?.find(s => s.key === key);
  
  return {
    value: setting?.value || null,
    isLoading,
    error
  };
};
