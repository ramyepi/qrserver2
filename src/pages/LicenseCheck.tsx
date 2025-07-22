
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVerifyLicense } from '@/hooks/useClinicData';
import LicenseVerificationResult from '@/components/LicenseVerificationResult';
import Footer from '@/components/Footer';

const LicenseCheck = () => {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    clinic: any;
    status: 'success' | 'failed' | 'not_found';
    licenseNumber: string;
  } | null>(null);
  const { toast } = useToast();
  const { verifyLicense } = useVerifyLicense();

  const handleVerification = async () => {
    if (!licenseNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الترخيص",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);

    try {
      const result = await verifyLicense(licenseNumber.trim(), 'manual_entry');
      setVerificationResult({
        clinic: result.clinic,
        status: result.status,
        licenseNumber: licenseNumber.trim()
      });
      
      toast({
        title: "تم التحقق",
        description: result.clinic ? "تم العثور على العيادة" : "لم يتم العثور على الترخيص",
      });
    } catch (error) {
      console.error('خطأ في التحقق:', error);
      toast({
        title: "خطأ في التحقق",
        description: "حدث خطأ أثناء التحقق من الترخيص",
        variant: "destructive",
      });
      setVerificationResult({
        clinic: null,
        status: 'failed',
        licenseNumber: licenseNumber.trim()
      });
    }

    setIsChecking(false);
  };

  const resetSearch = () => {
    setLicenseNumber('');
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التحقق من الترخيص</h1>
            <p className="text-gray-600 mt-2">
              أدخل رقم الترخيص للتحقق من صحته وحالته
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة للرئيسية
            </a>
          </Button>
        </div>

        {/* نموذج التحقق */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                التحقق من رقم الترخيص
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الترخيص</label>
                <Input
                  placeholder="أدخل رقم الترخيص (مثال: JOR-DEN-001)"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="text-center font-mono text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
                />
                <p className="text-xs text-gray-500 text-center">
                  يجب أن يكون رقم الترخيص بالصيغة: JOR-DEN-XXX
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleVerification}
                  disabled={isChecking}
                  className="flex-1"
                >
                  {isChecking ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري التحقق...
                    </div>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      التحقق من الترخيص
                    </>
                  )}
                </Button>
                
                {verificationResult && (
                  <Button 
                    variant="outline"
                    onClick={resetSearch}
                  >
                    بحث جديد
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* نتائج التحقق */}
        {verificationResult && (
          <div className="max-w-4xl mx-auto mb-8">
            <LicenseVerificationResult
              clinic={verificationResult.clinic}
              status={verificationResult.status}
              licenseNumber={verificationResult.licenseNumber}
            />
          </div>
        )}

        {/* أمثلة على أرقام التراخيص */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">أمثلة على أرقام التراخيص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">تراخيص صالحة:</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <p>JOR-DEN-001</p>
                    <p>JOR-DEN-002</p>
                    <p>JOR-DEN-003</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">تراخيص منتهية:</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <p>JOR-DEN-004</p>
                    <p>JOR-DEN-015</p>
                    <p>JOR-DEN-025</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * يمكنك تجربة هذه الأرقام لاختبار النظام
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LicenseCheck;
