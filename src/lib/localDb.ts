import Dexie, { Table } from 'dexie';

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

export interface SiteSetting {
  key: string;
  value: string;
}

export interface SyncMeta {
  key: string;
  lastSynced: number;
}

class LocalDB extends Dexie {
  clinics!: Table<Clinic, string>;
  settings!: Table<SiteSetting, string>;
  syncMeta!: Table<SyncMeta, string>;
  governorates!: Table<{ id: string; name: string }, string>;
  cities!: Table<{ id: string; name: string; governorateId: string }, string>;

  constructor() {
    super('DentalVerifyLocalDB');
    this.version(1).stores({
      clinics: 'id, clinic_name, license_number, doctor_name, specialization, license_status, issue_date, expiry_date, phone, governorate, city, verification_count, created_at, updated_at',
      settings: 'key',
      syncMeta: 'key',
      governorates: 'id, name',
      cities: 'id, name, governorateId',
    });
  }
}

export const localDb = new LocalDB(); 