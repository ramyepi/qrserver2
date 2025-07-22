
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Phone, MapPin, Calendar, User } from 'lucide-react';
import { Clinic } from '@/types/clinic';

interface LicenseVerificationResultProps {
  clinic: Clinic | null;
  status: 'success' | 'failed' | 'not_found';
  licenseNumber: string;
}

const LicenseVerificationResult: React.FC<LicenseVerificationResultProps> = ({
  clinic,
  status,
  licenseNumber
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'not_found':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusBadge = (licenseStatus?: string) => {
    switch (licenseStatus) {
      case 'active':
        return <Badge className="bg-green-500">صالح</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي الصلاحية</Badge>;
      case 'suspended':
        return <Badge variant="destructive">معلق</Badge>;
      case 'pending':
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (status === 'not_found') {
      return {
        title: "الترخيص غير موجود",
        description: "رقم الترخيص المدخل غير مسجل في النظام",
        color: "text-red-600"
      };
    }
    
    if (clinic) {
      if (clinic.license_status === 'active') {
        return {
          title: "ترخيص صالح",
          description: "العيادة مرخصة وصالحة للعمل",
          color: "text-green-600"
        };
      } else {
        return {
          title: "مشكلة في الترخيص",
          description: "العيادة موجودة لكن الترخيص غير صالح",
          color: "text-red-600"
        };
      }
    }

    return {
      title: "خطأ في التحقق",
      description: "حدث خطأ أثناء التحقق من الترخيص",
      color: "text-yellow-600"
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          <span>نتيجة التحقق</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className={`text-xl font-bold ${statusMessage.color}`}>
            {statusMessage.title}
          </h3>
          <p className="text-gray-600">{statusMessage.description}</p>
          <p className="text-sm text-gray-500">
            رقم الترخيص: <span className="font-mono">{licenseNumber}</span>
          </p>
        </div>

        {clinic && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{clinic.clinic_name}</h4>
                <p className="text-gray-600">{clinic.specialization}</p>
              </div>
              {getStatusBadge(clinic.license_status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinic.doctor_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{clinic.doctor_name}</span>
                </div>
              )}

              {clinic.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{clinic.phone}</span>
                </div>
              )}

              {clinic.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{clinic.address}</span>
                </div>
              )}

              {clinic.expiry_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    انتهاء الصلاحية: {new Date(clinic.expiry_date).toLocaleDateString('ar-JO')}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                عدد مرات التحقق: <span className="font-semibold">{clinic.verification_count}</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LicenseVerificationResult;
