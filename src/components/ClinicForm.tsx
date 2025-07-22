
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Form } from '@/components/ui/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpecializations } from '@/hooks/useSpecializations';
import { ClinicFormData } from '@/hooks/useClinicCRUD';
import { Clinic } from '@/types/clinic';
import { localDb } from '@/lib/localDb';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  clinic_name: z.string().min(1, 'اسم العيادة مطلوب'),
  doctor_name: z.string().optional(),
  license_number: z.string().min(1, 'رقم الترخيص مطلوب'),
  specialization: z.string().min(1, 'التخصص مطلوب'),
  phone: z.string().optional(),
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  address_details: z.string().optional(),
  address: z.string().optional(), // Added to match ClinicFormData
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  license_status: z.enum(['active', 'expired', 'suspended', 'pending']).default('active'),
});

interface ClinicFormProps {
  clinic?: Clinic;
  onSubmit: (data: ClinicFormData) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const ClinicForm: React.FC<ClinicFormProps> = ({
  clinic,
  onSubmit,
  isLoading = false,
  mode,
}) => {
  const { toast } = useToast();
  const { data: specializations, isLoading: specializationsLoading } = useSpecializations();
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; governorateId: string }[]>([]);
  const [qrCodeData, setQRCodeData] = useState<string>('');

  const form = useForm<ClinicFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clinic_name: clinic?.clinic_name || '',
      doctor_name: clinic?.doctor_name || '',
      license_number: clinic?.license_number || '',
      specialization: clinic?.specialization || '',
      phone: clinic?.phone || '',
      governorate: clinic?.governorate || '',
      city: clinic?.city || '',
      address_details: clinic?.address_details || '',
      issue_date: clinic?.issue_date || '',
      expiry_date: clinic?.expiry_date || '',
      license_status: clinic?.license_status || 'active',
    },
  });

  useEffect(() => {
    if (clinic?.address) {
      // تحليل العنوان المخزن وتعيين القيم
      const addressParts = clinic.address.split('،');
      if (addressParts.length >= 3) {
        form.setValue('governorate', addressParts[0].trim());
        form.setValue('city', addressParts[1].trim());
        form.setValue('address_details', addressParts[2].trim());
        setSelectedGovernorate(addressParts[0].trim());
      }
    }
  }, [clinic]);

  // Load governorates and cities from localDb
  useEffect(() => {
    const load = async () => {
      setGovernorates(await localDb.governorates.toArray());
      setCities(await localDb.cities.toArray());
    };
    load();
  }, []);

  useEffect(() => {
    const formData = form.getValues();
    if (formData.license_number) {
      const qrData = JSON.stringify({
        type: 'clinic',
        license: formData.license_number
      });
      setQRCodeData(qrData);
    }
  }, [form.watch('license_number')]);

  const handleSubmit = (data: ClinicFormData) => {
    // تجميع العنوان الكامل
    // governorate and city are IDs, map to names
    const govName = governorates.find(g => g.id === data.governorate)?.name || '';
    const cityName = cities.find(c => c.id === data.city)?.name || '';
    const fullAddress = `${govName}، ${cityName}${data.address_details ? '، ' + data.address_details : ''}`;
    const submissionData = {
      ...data,
      governorate: govName,
      city: cityName,
      address: fullAddress
    };
    console.log('Form submitted with data:', submissionData);
    onSubmit(submissionData);
  };

  const availableCities = cities.filter(city => city.governorateId === selectedGovernorate);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col lg:flex-row-reverse gap-6 relative w-full px-0 py-4">
        <div className="lg:sticky lg:top-4 lg:h-fit w-full lg:w-1/5 flex flex-col items-center p-4 border rounded-lg bg-white shadow-md z-10">
          <h3 className="text-lg font-semibold mb-4">معاينة رمز QR</h3>
          {qrCodeData ? (
            <>
              <QRCodeGenerator
                value={qrCodeData}
                size={200}
                showDownload={true}
              />
              <p className="text-sm text-gray-500 mt-2 text-center">يتم تحديث رمز QR تلقائياً عند تغيير رقم الترخيص</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-[200px] h-[200px] border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500 text-center">أدخل رقم الترخيص لإنشاء رمز QR</p>
            </div>
          )}
        </div>
        <div className="w-full lg:w-4/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clinic_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم العيادة *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم العيادة" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctor_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الطبيب</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم الطبيب" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الترخيص *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل رقم الترخيص" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>التخصص *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={specializationsLoading ? "جاري التحميل..." : "اختر التخصص"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {specializations?.map((spec) => (
                      <SelectItem key={spec.id} value={spec.name_ar}>
                        {spec.name_ar}
                        {spec.name_en && <span className="text-gray-500 text-sm"> ({spec.name_en})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل رقم الهاتف" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حالة الترخيص</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حالة الترخيص" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الإصدار</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="governorate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المحافظة *</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedGovernorate(value);
                    form.setValue('city', ''); // إعادة تعيين المدينة عند تغيير المحافظة
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {governorates.map((gov) => (
                      <SelectItem key={gov.id} value={gov.id}>
                        {gov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المدينة *</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedGovernorate}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address_details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تفاصيل العنوان</FormLabel>
              <FormControl>
                <Input placeholder="تفاصيل إضافية للعنوان (الشارع، المبنى، الخ)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="submit" disabled={isLoading || specializationsLoading}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </form>
      </Form>
    </>
  );
};

export default ClinicForm;
