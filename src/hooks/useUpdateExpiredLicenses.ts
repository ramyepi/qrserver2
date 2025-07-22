
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateResult {
  updated_count: number;
  total_expired: number;
  near_expiry_count: number;
  last_updated: string;
  success: boolean;
  error?: string;
}

export const useUpdateExpiredLicenses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<UpdateResult> => {
      console.log('Starting manual license update...');
      
      const { data, error } = await supabase
        .rpc('update_expired_licenses_manual' as any);

      if (error) {
        console.error('Manual update error:', error);
        throw error;
      }
      
      console.log('Manual update result:', data);
      return data;
    },
    onSuccess: (result) => {
      // Invalidate clinics data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      
      if (result.success) {
        toast({
          title: "تم تحديث التراخيص بنجاح",
          description: `
            تم تحديث ${result.updated_count} عيادة
            • المجموع المنتهي: ${result.total_expired}
            • قريب من الانتهاء: ${result.near_expiry_count}
          `,
        });
      } else {
        toast({
          title: "خطأ في التحديث",
          description: result.error || "حدث خطأ أثناء تحديث التراخيص",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to update expired licenses:', error);
      toast({
        title: "فشل في تحديث التراخيص",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
    retry: (failureCount, error) => {
      // Retry once on network errors
      if (failureCount < 1 && navigator.onLine !== false) {
        return true;
      }
      return false;
    },
    retryDelay: 2000,
  });
};
