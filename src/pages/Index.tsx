
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QrCode, Search, Shield, Smartphone, Database, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVerifyLicense } from '@/hooks/useClinicData';
import QRScanner from '@/components/QRScanner';
import LicenseVerificationResult from '@/components/LicenseVerificationResult';
import Footer from '@/components/Footer';
import VerificationResultDialog from '@/components/VerificationResultDialog';
import { useClinicData } from '@/hooks/useClinicData';

const Index = () => {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    clinic: any;
    status: 'success' | 'failed' | 'not_found';
    licenseNumber: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const { toast } = useToast();
  const { verifyLicense } = useVerifyLicense();
  const { data: clinics = [] } = useClinicData();

  const handleManualVerification = async () => {
    if (!licenseNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الترخيص",
        variant: "destructive",
      });
      return;
    }

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
    }
  };

  const handleQRScan = async (result: string) => {
    try {
      const verificationResult = await verifyLicense(result, 'qr_scan');
      setVerificationResult({
        clinic: verificationResult.clinic,
        status: verificationResult.status,
        licenseNumber: result
      });
      setShowResultDialog(true);
      setShowQRScanner(false);
    } catch (error) {
      console.error('خطأ في التحقق:', error);
      toast({
        title: "خطأ في التحقق",
        description: "حدث خطأ أثناء التحقق من الترخيص",
        variant: "destructive",
      });
    }
  };
  const handleScanAgain = () => {
    setShowResultDialog(false);
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4">
            <Shield className="h-16 w-16 text-blue-600 ml-0 sm:ml-4" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                نظام التحقق من تراخيص العيادات
              </h1>
              <p className="text-lg sm:text-xl text-gray-600">
                التحقق السريع والآمن من تراخيص عيادات الأسنان في الأردن
              </p>
            </div>
          </div>
        </div>

        {/* الإجراءات الرئيسية */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
          {!showQRScanner ? (
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* التحقق اليدوي */}
              <Card className="bg-white shadow-lg w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    التحقق اليدوي من الترخيص
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رقم الترخيص</label>
                    <Input
                      placeholder="أدخل رقم الترخيص (مثال: JOR-DEN-001)"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="text-center font-mono"
                      onKeyPress={(e) => e.key === 'Enter' && handleManualVerification()}
                    />
                  </div>
                  <Button 
                    onClick={handleManualVerification}
                    className="w-full"
                  >
                    التحقق من الترخيص
                  </Button>
                </CardContent>
              </Card>

              {/* مسح QR */}
              <Card className="bg-white shadow-lg w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-green-600" />
                    مسح رمز QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    استخدم كاميرا الجهاز لمسح رمز QR الخاص بالعيادة للتحقق السريع
                  </p>
                  <Button 
                    onClick={() => setShowQRScanner(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    بدء مسح QR
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
            <QRScanner 
              onScan={handleQRScan}
              onClose={() => setShowQRScanner(false)}
            />
            </div>
          )}
        </div>

        {/* نتائج التحقق */}
        <VerificationResultDialog
          open={showResultDialog}
          onOpenChange={setShowResultDialog}
          clinic={verificationResult?.clinic || null}
          status={verificationResult?.status || 'not_found'}
          licenseNumber={verificationResult?.licenseNumber || ''}
          onScanAgain={handleScanAgain}
            />

        {/* الميزات */}
        <div className="max-w-6xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">ميزات النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">مسح QR سريع</h3>
                <p className="text-sm text-gray-600">
                  تحقق فوري من التراخيص باستخدام كاميرا الجهاز
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">متوافق مع الجوال</h3>
                <p className="text-sm text-gray-600">
                  يعمل بسلاسة على جميع الأجهزة المحمولة
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Database className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">قاعدة بيانات شاملة</h3>
                <p className="text-sm text-gray-600">
                  تحتوي على جميع عيادات الأسنان المرخصة في الأردن
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <FileSpreadsheet className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">إدارة متقدمة</h3>
                <p className="text-sm text-gray-600">
                  رفع البيانات والإدارة الشاملة للعيادات
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="bg-blue-600 text-white rounded-lg p-4 sm:p-8 text-center mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">إحصائيات النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{clinics.length}</div>
              <div className="text-blue-200">عيادة مسجلة</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">100%</div>
              <div className="text-blue-200">دقة التحقق</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">24/7</div>
              <div className="text-blue-200">متاح دائماً</div>
            </div>
          </div>
        </div>

        {/* روابط سريعة مخفية بناءً على طلب المستخدم */}
      </div>

      <Footer />
    </div>
  );
};

export default Index;
