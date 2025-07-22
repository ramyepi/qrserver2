
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useClearAllClinics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Clearing all clinics...');
      
      const { error } = await supabase
        .from('clinics')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error clearing clinics:', error);
        throw error;
      }

      console.log('All clinics cleared successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast({
        title: "تم مسح جميع العيادات بنجاح",
        description: "تم حذف جميع بيانات العيادات من قاعدة البيانات",
      });
    },
    onError: (error: any) => {
      console.error('Error in clear all clinics mutation:', error);
      toast({
        title: "خطأ في مسح البيانات",
        description: error.message || "حدث خطأ أثناء مسح جميع العيادات",
        variant: "destructive",
      });
    },
  });
};

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

export const useExportClinicsCSV = () => {
  const exportToCSV = (clinics: any[]) => {
    if (!clinics || clinics.length === 0) {
      console.log('No clinics data to export');
      return;
    }

    // Define CSV headers in Arabic (matching ClinicForm)
    const headers = [
      'اسم العيادة',
      'رقم الترخيص',
      'اسم الطبيب',
      'التخصص',
      'حالة الترخيص',
      'رقم الهاتف',
      'المحافظة',
      'المدينة',
      'تفاصيل العنوان',
      'العنوان الكامل',
      'تاريخ الإصدار',
      'تاريخ الانتهاء',
      'عدد التحقق'
    ];

    // Convert clinics data to CSV format
    const csvContent = [
      headers.join(','),
      ...clinics.map(clinic => [
        `"${clinic.clinic_name || ''}"`,
        `"${clinic.license_number || ''}"`,
        `"${clinic.doctor_name || ''}"`,
        `"${clinic.specialization || ''}"`,
        `"${clinic.license_status || ''}"`,
        `"${clinic.phone || ''}"`,
        `"${clinic.governorate || ''}"`,
        `"${clinic.city || ''}"`,
        `"${clinic.address_details || ''}"`,
        `"${clinic.address || ''}"`,
        `"${clinic.issue_date || ''}"`,
        `"${clinic.expiry_date || ''}"`,
        `"${clinic.verification_count || 0}"`
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clinics_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample CSV generator
  const downloadSampleCSV = () => {
    const headers = [
      'اسم العيادة',
      'رقم الترخيص',
      'اسم الطبيب',
      'التخصص',
      'حالة الترخيص',
      'رقم الهاتف',
      'المحافظة',
      'المدينة',
      'تفاصيل العنوان',
      'العنوان الكامل',
      'تاريخ الإصدار',
      'تاريخ الانتهاء',
      'عدد التحقق'
    ];
    const sample = [
      'عيادة الابتسامة',
      'JOR-DEN-001',
      'د. أحمد علي',
      'طب الأسنان العام',
      'active',
      '0791234567',
      'عمان',
      'تلاع العلي',
      'شارع الملكة رانيا، عمارة 10',
      'عمان، تلاع العلي، شارع الملكة رانيا، عمارة 10',
      '2023-01-01',
      '2025-01-01',
      '0'
    ];
    const csvContent = [headers.join(','), sample.map(x => `"${x}"`).join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'clinics_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { exportToCSV, downloadSampleCSV };
};
