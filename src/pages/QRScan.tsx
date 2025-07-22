
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import VerificationResultDialog from '@/components/VerificationResultDialog';
import { useVerifyLicense } from '@/hooks/useClinicData';
import Footer from '@/components/Footer';

const QRScan = () => {
  const [verificationResult, setVerificationResult] = useState<{
    clinic: any;
    status: 'success' | 'failed' | 'not_found';
    licenseNumber: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const { verifyLicense } = useVerifyLicense();

  const handleQRScan = async (result: string) => {
    try {
      const verificationResult = await verifyLicense(result, 'qr_scan');
      setVerificationResult({
        clinic: verificationResult.clinic,
        status: verificationResult.status,
        licenseNumber: result
      });
      setShowResultDialog(true);
    } catch (error) {
      setVerificationResult({
        clinic: null,
        status: 'failed',
        licenseNumber: result
      });
      setShowResultDialog(true);
    }
  };

  const handleScanAgain = () => {
    setShowResultDialog(false);
    setVerificationResult(null);
  };

  // Ensure dialog closes and scanner resets
  const handleDialogOpenChange = (open: boolean) => {
    setShowResultDialog(open);
    if (!open) setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مسح رمز QR</h1>
            <p className="text-gray-600 mt-2">
              وجه الكاميرا نحو رمز QR للتحقق الفوري من الترخيص
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة للرئيسية
            </a>
          </Button>
        </div>

        {/* QR Scanner */}
        <div className="max-w-md mx-auto mb-8">
          <QRScanner onScan={handleQRScan} />
        </div>

        {/* تعليمات الاستخدام */}
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">تعليمات الاستخدام</h2>
          <div className="space-y-3 text-gray-600">
            <p>• تأكد من وضوح رمز QR أمام الكاميرا</p>
            <p>• حافظ على ثبات الجهاز أثناء المسح</p>
            <p>• تأكد من وجود إضاءة كافية</p>
            <p>• في حالة عدم نجاح المسح، يمكنك رفع صورة للرمز</p>
            <p>• يمكنك أيضاً استخدام التحقق اليدوي من الرئيسية</p>
          </div>
        </div>
      </div>

      {/* نافذة النتائج المنبثقة */}
      <VerificationResultDialog
        open={showResultDialog}
        onOpenChange={handleDialogOpenChange}
        clinic={verificationResult?.clinic || null}
        status={verificationResult?.status || 'not_found'}
        licenseNumber={verificationResult?.licenseNumber || ''}
        onScanAgain={handleScanAgain}
      />

      <Footer />
    </div>
  );
};

export default QRScan;
