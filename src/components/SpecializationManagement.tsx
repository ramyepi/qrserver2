
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Specialization } from '@/hooks/useSpecializations';

const SpecializationManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSpecialization, setNewSpecialization] = useState({ name_ar: '', name_en: '' });
  const [editData, setEditData] = useState({ name_ar: '', name_en: '' });

  // Fetch all specializations (including inactive ones for admin)
  const { data: specializations, isLoading } = useQuery({
    queryKey: ['all-specializations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specializations')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Specialization[];
    },
  });

  // Add specialization mutation
  const addMutation = useMutation({
    mutationFn: async (data: { name_ar: string; name_en: string }) => {
      const maxSortOrder = Math.max(...(specializations?.map(s => s.sort_order) || [0]));
      
      const { error } = await supabase
        .from('specializations')
        .insert({
          name_ar: data.name_ar,
          name_en: data.name_en || null,
          sort_order: maxSortOrder + 1
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-specializations'] });
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setNewSpecialization({ name_ar: '', name_en: '' });
      toast({
        title: "تم إضافة التخصص بنجاح",
        description: "تم حفظ التخصص الجديد في النظام",
      });
    },
    onError: (error) => {
      console.error('Error adding specialization:', error);
      toast({
        title: "خطأ في إضافة التخصص",
        description: "حدث خطأ أثناء حفظ التخصص",
        variant: "destructive",
      });
    },
  });

  // Update specialization mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name_ar: string; name_en: string } }) => {
      const { error } = await supabase
        .from('specializations')
        .update({
          name_ar: data.name_ar,
          name_en: data.name_en || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-specializations'] });
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      setEditingId(null);
      toast({
        title: "تم تحديث التخصص بنجاح",
        description: "تم حفظ التغييرات",
      });
    },
    onError: (error) => {
      console.error('Error updating specialization:', error);
      toast({
        title: "خطأ في تحديث التخصص",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive",
      });
    },
  });

  // Delete specialization mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check if this specialization is used by any clinics
      const { data: clinicsWithSpec, error: checkError } = await supabase
        .from('clinics')
        .select('id, clinic_name')
        .eq('specialization', specializations?.find(s => s.id === id)?.name_ar);

      if (checkError) throw checkError;

      if (clinicsWithSpec && clinicsWithSpec.length > 0) {
        throw new Error(`لا يمكن حذف هذا التخصص لأنه مستخدم في ${clinicsWithSpec.length} عيادة. يرجى تغيير تخصص هذه العيادات أولاً.`);
      }

      const { error } = await supabase
        .from('specializations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-specializations'] });
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      toast({
        title: "تم حذف التخصص بنجاح",
        description: "تم حذف التخصص من النظام",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting specialization:', error);
      toast({
        title: "خطأ في حذف التخصص",
        description: error.message || "حدث خطأ أثناء حذف التخصص",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('specializations')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-specializations'] });
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      toast({
        title: "تم تحديث حالة التخصص",
        description: "تم تغيير حالة التفعيل للتخصص",
      });
    },
  });

  const handleAdd = () => {
    if (!newSpecialization.name_ar.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم التخصص بالعربية",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate(newSpecialization);
  };

  const handleEdit = (specialization: Specialization) => {
    setEditingId(specialization.id);
    setEditData({
      name_ar: specialization.name_ar,
      name_en: specialization.name_en || ''
    });
  };

  const handleUpdate = () => {
    if (!editData.name_ar.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم التخصص بالعربية",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingId!,
      data: editData
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name_ar: '', name_en: '' });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>إدارة التخصصات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">جاري تحميل التخصصات...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إدارة التخصصات
        </CardTitle>
        <CardDescription className="text-right">
          إضافة وتعديل التخصصات الطبية المتاحة في النظام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new specialization */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3 text-right">إضافة تخصص جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="اسم التخصص بالعربية *"
              value={newSpecialization.name_ar}
              onChange={(e) => setNewSpecialization(prev => ({ ...prev, name_ar: e.target.value }))}
              className="text-right"
            />
            <Input
              placeholder="اسم التخصص بالإنجليزية"
              value={newSpecialization.name_en}
              onChange={(e) => setNewSpecialization(prev => ({ ...prev, name_en: e.target.value }))}
              className="text-right"
            />
          </div>
          <div className="flex justify-end mt-3">
            <Button 
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة التخصص'}
            </Button>
          </div>
        </div>

        {/* Specializations list */}
        <div className="space-y-3">
          <h3 className="font-medium text-right">التخصصات الحالية ({specializations?.length || 0})</h3>
          
          {specializations?.map((specialization) => (
            <div
              key={specialization.id}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              {editingId === specialization.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  <Input
                    value={editData.name_ar}
                    onChange={(e) => setEditData(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="اسم التخصص بالعربية"
                    className="text-right"
                  />
                  <Input
                    value={editData.name_en}
                    onChange={(e) => setEditData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="اسم التخصص بالإنجليزية"
                    className="text-right"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={specialization.is_active ? "default" : "secondary"}>
                        {specialization.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{specialization.name_ar}</p>
                      {specialization.name_en && (
                        <p className="text-sm text-gray-600">{specialization.name_en}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === specialization.id ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                      title="حفظ"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      title="إلغاء"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(specialization)}
                      title="تعديل"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={specialization.is_active ? "secondary" : "default"}
                      onClick={() => toggleActiveMutation.mutate({
                        id: specialization.id,
                        isActive: specialization.is_active
                      })}
                      disabled={toggleActiveMutation.isPending}
                      title={specialization.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                    >
                      {specialization.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="حذف"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد حذف التخصص</AlertDialogTitle>
                          <AlertDialogDescription className="text-right">
                            هل أنت متأكد من حذف تخصص "{specialization.name_ar}"؟
                            <br />
                            <strong>تحذير: سيتم التحقق من عدم استخدام هذا التخصص في أي عيادة قبل الحذف.</strong>
                            <br />
                            لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(specialization.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          ))}

          {!specializations?.length && (
            <div className="text-center py-8 text-gray-500">
              لا توجد تخصصات مضافة بعد
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpecializationManagement;
