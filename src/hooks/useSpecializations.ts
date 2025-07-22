
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Specialization {
  id: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
  sort_order: number;
}

export const useSpecializations = () => {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: async () => {
      console.log('Fetching specializations from database');
      
      const { data, error } = await supabase
        .from('specializations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching specializations:', error);
        throw error;
      }

      console.log('Fetched specializations:', data);
      return data as Specialization[];
    },
  });
};
