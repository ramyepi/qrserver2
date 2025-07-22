
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clinic, VerificationResult } from "@/types/clinic";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { localDb } from "@/lib/localDb";

// Helper to check data source
const isLocalDb = () => localStorage.getItem('useLocalDb') === 'true';

// Helper to check MySQL as data source
const isMySQL = () => localStorage.getItem('useMySQL') === 'true';

// Helper to get MySQL config from localStorage
const getMySQLConfig = () => ({
  host: localStorage.getItem('mysql_host') || 'localhost',
  port: localStorage.getItem('mysql_port') || '3306',
  database: localStorage.getItem('mysql_database') || '',
  user: localStorage.getItem('mysql_user') || '',
  password: localStorage.getItem('mysql_password') || ''
});

// Helper to get API base URL
const getApiBaseUrl = () => localStorage.getItem('api_base_url') || '';

// Fetch clinics from local IndexedDB
const fetchLocalClinics = async (): Promise<Clinic[]> => {
  return await localDb.clinics.toArray();
};

// Fetch clinics from MySQL
const fetchMySQLClinics = async (): Promise<Clinic[]> => {
  const config = getMySQLConfig();
  const params = new URLSearchParams(config).toString();
  const res = await fetch(`${getApiBaseUrl()}/api/mysql/clinics?${params}`);
  if (!res.ok) throw new Error('فشل في جلب بيانات العيادات من MySQL');
  return await res.json();
};

// Sync clinics from Supabase to IndexedDB
export const syncWithSupabase = async () => {
  const { data, error } = await supabase
    .from("clinics")
    .select("*");
  if (error) throw new Error(error.message);
  if (data) {
    await localDb.clinics.clear();
    await localDb.clinics.bulkAdd(data.map((c: any) => ({
      id: c.id,
      clinic_name: c.clinic_name,
      license_number: c.license_number,
      doctor_name: c.doctor_name,
      specialization: c.specialization,
      license_status: c.license_status as 'active' | 'expired' | 'suspended' | 'pending',
      issue_date: c.issue_date,
      expiry_date: c.expiry_date,
      phone: c.phone,
      contact_info: c.contact_info,
      governorate: c.governorate,
      city: c.city,
      address_details: c.address_details,
      address: c.address,
      coordinates: c.coordinates,
      verification_count: c.verification_count || 0,
      qr_code: c.qr_code,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })));
  }
};

export const useClinicData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query clinics from the selected data source
  const query = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      if (isMySQL()) return fetchMySQLClinics();
      if (isLocalDb()) return fetchLocalClinics();
      // Supabase fetch
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Clinic[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Real-time updates from Supabase (cloud mode only)
  useEffect(() => {
    if (!isLocalDb() && !isMySQL()) {
      const channel = supabase
        .channel('clinics-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clinics'
          },
          async (payload) => {
            queryClient.invalidateQueries({ queryKey: ["clinics"] });
            if (payload.eventType === 'INSERT') {
              toast({ title: "عيادة جديدة", description: "تم إضافة عيادة جديدة" });
            } else if (payload.eventType === 'UPDATE') {
              toast({ title: "تحديث عيادة", description: "تم تحديث بيانات عيادة" });
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [queryClient, toast]);

  // Manual sync function for UI
  const manualSync = async () => {
    await syncWithSupabase();
    queryClient.invalidateQueries({ queryKey: ["clinics"] });
  };

  // --- CRUD Operations ---
  // Add clinic
  const addClinic = async (clinic: Clinic) => {
    if (isMySQL()) {
      const config = getMySQLConfig();
      const res = await fetch(`${getApiBaseUrl()}/api/mysql/clinics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...clinic, ...config })
      });
      if (!res.ok) throw new Error('فشل في إضافة العيادة إلى MySQL');
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    if (isLocalDb()) {
      await localDb.clinics.add(clinic);
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    const { error } = await supabase.from("clinics").insert([clinic]);
    if (error) throw new Error(error.message);
    queryClient.invalidateQueries({ queryKey: ["clinics"] });
  };

  // Update clinic
  const updateClinic = async (id: string, updates: Partial<Clinic>) => {
    if (isMySQL()) {
      const config = getMySQLConfig();
      const res = await fetch(`${getApiBaseUrl()}/api/mysql/clinics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, ...config })
      });
      if (!res.ok) throw new Error('فشل في تحديث بيانات العيادة في MySQL');
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    if (isLocalDb()) {
      await localDb.clinics.update(id, updates);
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    const { error } = await supabase.from("clinics").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    queryClient.invalidateQueries({ queryKey: ["clinics"] });
  };

  // Delete clinic
  const deleteClinic = async (id: string) => {
    if (isMySQL()) {
      const config = getMySQLConfig();
      const params = new URLSearchParams(config).toString();
      const res = await fetch(`${getApiBaseUrl()}/api/mysql/clinics/${id}?${params}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف العيادة من MySQL');
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    if (isLocalDb()) {
      await localDb.clinics.delete(id);
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      return;
    }
    const { error } = await supabase.from("clinics").delete().eq("id", id);
    if (error) throw new Error(error.message);
    queryClient.invalidateQueries({ queryKey: ["clinics"] });
  };

  return {
    ...query,
    syncWithSupabase: manualSync,
    addClinic,
    updateClinic,
    deleteClinic,
  };
};

// License verification remains Supabase-based for now
export const useVerifyLicense = () => {
  const verifyLicense = async (
    licenseNumber: string,
    method: 'qr_scan' | 'manual_entry' | 'image_upload'
  ): Promise<VerificationResult> => {
    // البحث عن العيادة
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("license_number", licenseNumber)
      .maybeSingle();
    const verificationStatus = clinic ? 'success' : 'not_found';
    // تسجيل محاولة التحقق
    const { error: verificationError } = await supabase
      .from("verifications")
      .insert({
        clinic_id: clinic?.id,
        license_number: licenseNumber,
        verification_method: method,
        verification_status: verificationStatus,
        user_agent: navigator.userAgent,
      });
    if (verificationError) {
      console.error("Error recording verification:", verificationError);
    }
    const typedClinic = clinic ? {
      ...clinic,
      license_status: clinic.license_status as 'active' | 'expired' | 'suspended' | 'pending'
    } : null;
    return {
      clinic: typedClinic,
      status: verificationStatus as 'success' | 'failed' | 'not_found',
      licenseNumber
    };
  };
  return { verifyLicense };
};
