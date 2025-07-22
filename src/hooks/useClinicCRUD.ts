
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clinic } from "@/types/clinic";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { jordanGovernorates } from "@/data/jordan-locations";

export interface ClinicFormData {
  clinic_name: string;
  doctor_name?: string;
  license_number: string;
  specialization: string;
  phone?: string;
  governorate: string;
  city: string;
  address_details?: string;
  address: string;
  license_status: 'active' | 'expired' | 'pending' | 'suspended';
  issue_date?: string;
  expiry_date?: string;
}

export const useCreateClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ClinicFormData) => {
      // Extract address components for database
      const { address_details, ...restData } = data;
      
      // Create a data object with governorate, city and address fields
      const dataToInsert = {
        ...restData,
        governorate: data.governorate,
        city: data.city,
        address_details: data.address_details
      };
      
      // Ensure address is properly set
      if (data.governorate && data.city) {
        const fullAddress = `${data.governorate}، ${data.city}${data.address_details ? '، ' + data.address_details : ''}`;
        dataToInsert.address = fullAddress;
      }
      
      const { error } = await supabase
        .from("clinics")
        .insert([dataToInsert]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast({
        title: "تم إضافة العيادة",
        description: "تم إضافة العيادة بنجاح",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "خطأ في إضافة العيادة",
        description: "حدث خطأ أثناء إضافة العيادة",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateRandomAddresses = async () => {
    try {
      // Fetch all clinics
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*');

      if (error) throw error;
      if (!clinics) return;

      // Update each clinic with random governorate and city
      const updatePromises = clinics.map(clinic => {
        const randomGovernorateIndex = Math.floor(Math.random() * jordanGovernorates.length);
        const governorate = jordanGovernorates[randomGovernorateIndex];
        const randomCityIndex = Math.floor(Math.random() * governorate.cities.length);
        const city = governorate.cities[randomCityIndex];

        // Construct new address
        const address = `${clinic.address_details || ''}, ${city}, ${governorate.name}`;

        return supabase
          .from('clinics')
          .update({
            governorate: governorate.name,
            city: city,
            address: address.replace(/^,\s*/, '') // Remove leading comma and space if address_details is empty
          })
          .eq('id', clinic.id);
      });

      await Promise.all(updatePromises);

      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['clinics'] });

      toast({
        title: "تم تحديث العناوين",
        description: "تم تحديث عناوين العيادات بنجاح",
      });
    } catch (error) {
      console.error('Error updating addresses:', error);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<ClinicFormData>) => {
      const { id, ...updateData } = data;
      
      // Create a data object with governorate, city and address_details fields
      const dataToUpdate = {
        ...updateData,
        governorate: data.governorate,
        city: data.city,
        address_details: data.address_details
      };
      
      // Ensure address is properly set if governorate and city are provided
      if (data.governorate && data.city) {
        const fullAddress = `${data.governorate}، ${data.city}${data.address_details ? '، ' + data.address_details : ''}`;
        dataToUpdate.address = fullAddress;
      }
      
      const { error } = await supabase
        .from("clinics")
        .update(dataToUpdate)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast({
        title: "تم تحديث العيادة",
        description: "تم تحديث العيادة بنجاح",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "خطأ في تحديث العيادة",
        description: "حدث خطأ أثناء تحديث العيادة",
        variant: "destructive",
      });
    },
  });

  return {
    ...mutation,
    updateRandomAddresses,
  };
};

export const useDeleteClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clinics")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast({
        title: "تم حذف العيادة",
        description: "تم حذف العيادة بنجاح",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "خطأ في حذف العيادة",
        description: "حدث خطأ أثناء حذف العيادة",
        variant: "destructive",
      });
    },
  });
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
