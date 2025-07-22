
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clinic } from '@/types/clinic';
import { ClinicFormData, useCreateClinic, useUpdateClinic } from '@/hooks/useClinicCRUD';
import ClinicForm from './ClinicForm';
import { Form } from '@/components/ui/form';

interface ClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: Clinic;
  mode: 'create' | 'edit';
  addClinic: (clinic: Clinic) => Promise<void>;
  updateClinic: (id: string, updates: Partial<Clinic>) => Promise<void>;
}

const ClinicDialog: React.FC<ClinicDialogProps> = ({
  open,
  onOpenChange,
  clinic,
  mode,
  addClinic,
  updateClinic
}) => {
  const handleSubmit = async (data: ClinicFormData) => {
    try {
      if (mode === 'create') {
        // Convert ClinicFormData to Clinic (add default fields as needed)
        await addClinic({
          ...data,
          id: crypto.randomUUID(),
          verification_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Clinic);
      } else if (clinic) {
        await updateClinic(clinic.id, { ...data, updated_at: new Date().toISOString() });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving clinic:', error);
    }
  };

  const isLoading = false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'إضافة عيادة جديدة' : 'تعديل بيانات العيادة'}
          </DialogTitle>
        </DialogHeader>
        
          <ClinicForm
            clinic={clinic}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode={mode}
          />
      </DialogContent>
    </Dialog>
  );
};

export default ClinicDialog;
