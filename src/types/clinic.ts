
export interface Clinic {
  id: string;
  clinic_name: string;
  license_number: string;
  doctor_name?: string;
  specialization: string;
  license_status: 'active' | 'expired' | 'suspended' | 'pending';
  issue_date?: string;
  expiry_date?: string;
  phone?: string;
  contact_info?: any;
  governorate: string;
  city: string;
  address_details?: string;
  address?: string;
  coordinates?: any;
  verification_count: number;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  clinic_id?: string;
  license_number: string;
  verification_method: 'qr_scan' | 'manual_entry' | 'image_upload';
  verification_status: 'success' | 'failed' | 'not_found';
  ip_address?: string;
  user_agent?: string;
  location_data?: any;
  created_at: string;
}

export interface VerificationResult {
  clinic: Clinic | null;
  status: 'success' | 'failed' | 'not_found';
  licenseNumber: string;
}
