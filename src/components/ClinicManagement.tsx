import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinicData } from '@/hooks/useClinicData';
import { useClearAllClinics, useExportClinicsCSV } from '@/hooks/useClinicBulkOperations';
import { Search, Plus, Edit, Trash2, Eye, Phone, MapPin, Calendar, QrCode, Download, Database, Filter, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import ClinicDialog from './ClinicDialog';
import QRCodeGenerator from './QRCodeGenerator';
import { Clinic } from '@/types/clinic';
import { localDb } from '@/lib/localDb';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

const ClinicManagement: React.FC = () => {
  const { data: clinics = [], isLoading, error, addClinic, updateClinic, deleteClinic } = useClinicData();
  const clearAllMutation = useClearAllClinics();
  const { exportToCSV, downloadSampleCSV } = useExportClinicsCSV();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  
  const itemsPerPage = 10;

  const uniqueSpecializations = Array.from(new Set(
    clinics
      .map(clinic => clinic.specialization)
      .filter(spec => spec && spec.trim() !== '')
  )).sort();

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = clinic.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || clinic.license_status === statusFilter;
    const matchesSpecialization = specializationFilter === 'all' || clinic.specialization === specializationFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClinics = filteredClinics.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">صالح</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      case 'pending':
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSpecializationFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || specializationFilter !== 'all' || searchTerm !== '';

  const handleCreateClick = () => {
    setSelectedClinic(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditClick = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewClick = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setShowDetails(true);
  };

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteClinic(id);
    } catch (error) {
      console.error('Error deleting clinic:', error);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(clinics);
  };

  const handleClearAll = async () => {
    try {
      if (localStorage.getItem('useLocalDb') === 'true') {
        await localDb.clinics.clear();
        toast({ title: 'تم مسح جميع العيادات (محلياً)', description: 'تم حذف جميع العيادات من قاعدة البيانات المحلية.' });
      } else {
        // Supabase bulk delete
        await Promise.all(clinics.map(c => deleteClinic(c.id)));
        toast({ title: 'تم مسح جميع العيادات (سحابي)', description: 'تم حذف جميع العيادات من Supabase.' });
      }
    } catch (error) {
      toast({ title: 'خطأ في المسح', description: 'حدث خطأ أثناء مسح جميع العيادات', variant: 'destructive' });
      console.error('Error clearing all clinics:', error);
    }
  };

  // Bulk CSV import handler
  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          for (const row of rows) {
            // Map CSV fields to Clinic
            await addClinic({
              id: crypto.randomUUID(),
              clinic_name: row['اسم العيادة'] || '',
              license_number: row['رقم الترخيص'] || '',
              doctor_name: row['اسم الطبيب'] || '',
              specialization: row['التخصص'] || '',
              license_status: row['حالة الترخيص'] || 'active',
              phone: row['رقم الهاتف'] || '',
              governorate: row['المحافظة'] || '',
              city: row['المدينة'] || '',
              address_details: row['تفاصيل العنوان'] || '',
              address: row['العنوان الكامل'] || '',
              issue_date: row['تاريخ الإصدار'] || '',
              expiry_date: row['تاريخ الانتهاء'] || '',
              verification_count: parseInt(row['عدد التحقق'] || '0', 10),
              qr_code: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          toast({ title: 'تم استيراد العيادات بنجاح', description: `تم استيراد ${rows.length} عيادة من الملف.` });
        } catch (err) {
          toast({ title: 'خطأ في الاستيراد', description: 'حدث خطأ أثناء استيراد الملف', variant: 'destructive' });
        }
      },
      error: () => {
        toast({ title: 'خطأ في قراءة الملف', description: 'تعذر قراءة ملف CSV', variant: 'destructive' });
      }
    });
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  React.useEffect(() => {
    const addSampleClinics = async () => {
      const clinicsCount = await localDb.clinics.count();
      const govs = await localDb.governorates.toArray();
      const cts = await localDb.cities.toArray();
      if (clinicsCount === 0 && govs.length > 0 && cts.length > 0) {
        const samples = [
          {
            clinic_name: 'عيادة الابتسامة',
            license_number: 'JOR-DEN-001',
            doctor_name: 'د. أحمد علي',
            specialization: 'طب الأسنان العام',
            license_status: 'active' as 'active',
            phone: '0791234567',
            governorate: govs[0].name,
            city: cts.find(c => c.governorateId === govs[0].id)?.name || '',
            address_details: 'شارع الملكة رانيا، عمارة 10',
            address: `${govs[0].name}، ${cts.find(c => c.governorateId === govs[0].id)?.name || ''}، شارع الملكة رانيا، عمارة 10`,
            issue_date: '2023-01-01',
            expiry_date: '2025-01-01',
            verification_count: 0,
            qr_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: crypto.randomUUID(),
          },
          {
            clinic_name: 'عيادة الشفاء',
            license_number: 'JOR-DEN-002',
            doctor_name: 'د. سارة يوسف',
            specialization: 'تقويم الأسنان',
            license_status: 'expired' as 'expired',
            phone: '0789876543',
            governorate: govs[1]?.name || '',
            city: cts.find(c => c.governorateId === govs[1]?.id)?.name || '',
            address_details: 'مقابل مستشفى المدينة',
            address: `${govs[1]?.name || ''}، ${cts.find(c => c.governorateId === govs[1]?.id)?.name || ''}، مقابل مستشفى المدينة`,
            issue_date: '2022-05-10',
            expiry_date: '2024-05-10',
            verification_count: 2,
            qr_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: crypto.randomUUID(),
          },
          {
            clinic_name: 'عيادة النور',
            license_number: 'JOR-DEN-003',
            doctor_name: 'د. محمد عيسى',
            specialization: 'جراحة الفم والأسنان',
            license_status: 'pending' as 'pending',
            phone: '0775551234',
            governorate: govs[2]?.name || '',
            city: cts.find(c => c.governorateId === govs[2]?.id)?.name || '',
            address_details: 'قرب دوار الثقافة',
            address: `${govs[2]?.name || ''}، ${cts.find(c => c.governorateId === govs[2]?.id)?.name || ''}، قرب دوار الثقافة`,
            issue_date: '2023-03-15',
            expiry_date: '2026-03-15',
            verification_count: 1,
            qr_code: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: crypto.randomUUID(),
          },
        ];
        await localDb.clinics.bulkAdd(samples);
      }
      // Migration: update clinics with numeric governorate/city to names
      const allClinics = await localDb.clinics.toArray();
      let updated = false;
      for (const clinic of allClinics) {
        // If governorate or city is a number (string or number), map to name
        const govName = govs.find(g => g.id === clinic.governorate || g.name === clinic.governorate)?.name;
        const cityName = cts.find(c => c.id === clinic.city || c.name === clinic.city)?.name;
        if ((govName && clinic.governorate !== govName) || (cityName && clinic.city !== cityName)) {
          await localDb.clinics.update(clinic.id, {
            governorate: govName || clinic.governorate,
            city: cityName || clinic.city,
          });
          updated = true;
        }
      }
      if (updated) {
        // Optionally, show a toast or reload
      }
    };
    addSampleClinics();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <p>خطأ في تحميل البيانات</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showDetails && selectedClinic) {
    const handleEditFromDetails = () => {
      setDialogMode('edit');
      setSelectedClinic(selectedClinic);
      setDialogOpen(true);
      setShowDetails(false);
    };
    return (
      <Card className="w-full max-w-6xl mx-auto" dir="rtl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">تفاصيل العيادة</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditFromDetails}>
              <Edit className="h-4 w-4 ml-2" />
              تعديل
            </Button>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              العودة للقائمة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Main Info Section */}
            <div className="col-span-2 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-right mb-1">{selectedClinic.clinic_name}</h3>
                  <p className="text-lg text-gray-700 text-right font-medium">{selectedClinic.specialization}</p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <span className="text-lg"><span className="font-bold">اسم الطبيب:</span> {selectedClinic.doctor_name}</span>
                  <span className="text-lg flex items-center gap-1"><span className="font-bold">رقم الهاتف:</span> {selectedClinic.phone}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg space-y-3 border">
                  <h4 className="font-bold text-lg text-right mb-3 border-b pb-2">معلومات الترخيص</h4>
                  {selectedClinic.issue_date && (
                    <div className="flex items-center gap-2 justify-end text-base">
                      <span>
                        {new Date(selectedClinic.issue_date).toLocaleDateString('ar-JO')} :تاريخ الإصدار
                      </span>
                    </div>
                  )}
                  {selectedClinic.expiry_date && (
                    <div className="flex items-center gap-2 justify-end text-base">
                      <span>
                        {new Date(selectedClinic.expiry_date).toLocaleDateString('ar-JO')} :تاريخ الانتهاء
                      </span>
                    </div>
                  )}
                  <div className="text-base text-right">
                    <span>{selectedClinic.verification_count}</span>
                    <span className="font-bold"> :عدد مرات التحقق</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <h4 className="font-bold text-lg text-right mb-3 border-b pb-2">العنوان</h4>
                  <div className="flex flex-col gap-2 text-right mt-2">
                    <div className="flex flex-row-reverse items-center gap-2">
                      <span className="font-bold w-28">المحافظة:</span>
                      <span className="flex-1">{selectedClinic.governorate || <span className="text-gray-400">غير محددة</span>}</span>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2">
                      <span className="font-bold w-28">المدينة:</span>
                      <span className="flex-1">{selectedClinic.city || <span className="text-gray-400">غير محددة</span>}</span>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2">
                      <span className="font-bold w-28">تفاصيل العنوان:</span>
                      <span className="flex-1">{selectedClinic.address_details || <span className="text-gray-400">غير متوفر</span>}</span>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2 border-t pt-2 mt-2">
                      <span className="font-bold w-28">العنوان الكامل:</span>
                      <span className="flex-1">{selectedClinic.address || <span className="text-gray-400">غير متوفر</span>}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* QR & Status Section */}
            <div className="col-span-1 flex flex-col items-center gap-6 bg-gray-50 rounded-lg p-6 border">
              <QRCodeGenerator 
                value={JSON.stringify({ type: 'clinic', license: selectedClinic.license_number })}
                title="رمز QR للعيادة"
                showDownload={true}
              />
              <div className="flex flex-col items-center gap-2 mt-2">
                {getStatusBadge(selectedClinic.license_status)}
                <span className="text-base text-gray-500">حالة الترخيص</span>
              </div>
              <div className="text-center mt-2">
                <span className="block text-base text-gray-600 font-semibold">رقم الترخيص:</span>
                <span className="font-mono text-lg font-bold">{selectedClinic.license_number}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full" dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>إدارة العيادات</span>
            <div className="flex gap-2">
            <Button onClick={handleCreateClick} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة عيادة
            </Button>
              <Button variant="outline" onClick={() => exportToCSV(clinics)} className="gap-2" disabled={clinics.length === 0}>
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
              <Button variant="outline" onClick={downloadSampleCSV} className="gap-2">
                <Download className="h-4 w-4" />
                ملف عينة CSV
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Download className="h-4 w-4" />
                استيراد CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleBulkImport}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث عن العيادات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2"
                disabled={clinics.length === 0}
              >
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={clinics.length === 0 || clearAllMutation.isPending}
                  >
                    <Database className="h-4 w-4" />
                    مسح جميع البيانات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد مسح جميع البيانات</AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                      هل أنت متأكد من حذف جميع العيادات من قاعدة البيانات؟ 
                      سيتم حذف {clinics.length} عيادة وجميع البيانات المرتبطة بها.
                      <br /><br />
                      <strong>تحذير: لا يمكن التراجع عن هذا الإجراء!</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAll}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={clearAllMutation.isPending}
                    >
                      {clearAllMutation.isPending ? 'جاري المسح...' : 'مسح جميع البيانات'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Filters Row */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">فلترة:</span>
                <Filter className="h-4 w-4 text-gray-500" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="حالة الترخيص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">صالح</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="التخصص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التخصصات</SelectItem>
                  {uniqueSpecializations.map((specialization) => (
                    <SelectItem key={specialization} value={specialization}>
                      {specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-gray-600">الفلاتر المفعلة:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    الحالة: {statusFilter === 'active' ? 'صالح' : statusFilter === 'expired' ? 'منتهي' : statusFilter === 'suspended' ? 'معلق' : 'قيد المراجعة'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                {specializationFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    التخصص: {specializationFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSpecializationFilter('all')}
                    />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    البحث: {searchTerm}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Summary */}
            <div className="text-sm text-gray-600 text-right">
              عرض {filteredClinics.length} من أصل {clinics.length} عيادة
              {hasActiveFilters && ' (مفلترة)'}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم العيادة</TableHead>
                  <TableHead className="text-right">رقم الترخيص</TableHead>
                  <TableHead className="text-right">الطبيب</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">عدد التحقق</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentClinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium text-right">{clinic.clinic_name}</TableCell>
                    <TableCell className="font-mono text-right">{clinic.license_number}</TableCell>
                    <TableCell className="text-right">{clinic.doctor_name || '-'}</TableCell>
                    <TableCell className="text-right">{clinic.specialization}</TableCell>
                    <TableCell className="text-right">{getStatusBadge(clinic.license_status)}</TableCell>
                    <TableCell className="text-right">{clinic.verification_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(clinic)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditClick(clinic)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="حذف">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription className="text-right">
                                هل أنت متأكد من حذف عيادة "{clinic.clinic_name}"؟ 
                                لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteClick(clinic.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="text-sm text-gray-600 text-center">
            عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredClinics.length)} من أصل {filteredClinics.length} عيادة
          </div>
        </CardContent>
      </Card>

      <ClinicDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clinic={selectedClinic}
        mode={dialogMode}
        addClinic={addClinic}
        updateClinic={updateClinic}
      />
    </>
  );
};

export default ClinicManagement;
