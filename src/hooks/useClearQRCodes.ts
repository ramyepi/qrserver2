
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useClearAllQRCodes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Clearing all QR codes...');
      
      const { error } = await supabase
        .from('clinics')
        .update({ qr_code: null })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

      if (error) {
        console.error('Error clearing QR codes:', error);
        throw error;
      }

      console.log('QR codes cleared successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast({
        title: "تم مسح رموز QR بنجاح",
        description: "تم مسح جميع رموز QR للعيادات",
      });
    },
    onError: (error: any) => {
      console.error('Error in clear QR codes mutation:', error);
      toast({
        title: "خطأ في مسح رموز QR",
        description: error.message || "حدث خطأ أثناء مسح رموز QR",
        variant: "destructive",
      });
    },
  });
};
