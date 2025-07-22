import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const qrCodeRegionId = "qr-reader";
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const parseQRData = (qrText: string) => {
    try {
      const qrData = JSON.parse(qrText);
      if (qrData.type === 'clinic' && qrData.license) {
        return qrData.license;
      }
    } catch {
      return qrText;
    }
    return qrText;
  };

  const handleQRDetection = async (qrText: string) => {
    const licenseNumber = parseQRData(qrText);
    console.log("QR Code detected:", qrText, "License:", licenseNumber);
    
    try {
      // إيقاف المسح فوراً عند الاكتشاف
      await stopScanning();
      
      // إرسال النتيجة للمكونة الأب
      onScan(licenseNumber);
      
      toast({
        title: "تم مسح الكود بنجاح",
        description: `رقم الترخيص: ${licenseNumber}`,
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "خطأ في التحقق",
        description: "حدث خطأ أثناء التحقق من البيانات",
        variant: "destructive",
      });
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately as we just want to check permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Camera permission error:", error);
      setCameraError("تم رفض الوصول للكاميرا. يرجى السماح بالوصول للكاميرا في إعدادات المتصفح.");
      return false;
    }
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);

      // Check camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      // Clean up any existing scanner
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.log("Scanner cleanup error (expected):", e);
        }
      }

      // Create new scanner instance
      html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      };

      // Get available cameras and select the best one
      let cameraId: string | { facingMode: string } = { facingMode: "environment" };
      
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        if (devices.length > 0) {
          // Try to find back camera first
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          
          if (backCamera) {
            cameraId = backCamera.id;
          } else {
            // Use first available camera
            cameraId = devices[0].id;
          }
        }
      } catch (deviceError) {
        console.log("Could not get camera list, using default:", deviceError);
        // Keep the default facingMode fallback
      }

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        handleQRDetection,
        (errorMessage) => {
          // Ignore frequent scan errors
          if (!errorMessage.includes('NotFoundException')) {
            console.log("QR scan error:", errorMessage);
          }
        }
      );

      toast({
        title: "الكاميرا جاهزة",
        description: "وجه الكاميرا نحو رمز QR للمسح",
      });

    } catch (err: any) {
      console.error("خطأ في بدء المسح:", err);
      setIsScanning(false);
      
      let errorMessage = "تأكد من منح الإذن للوصول للكاميرا";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "تم رفض الوصول للكاميرا. يرجى السماح بالوصول في إعدادات المتصفح.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "لم يتم العثور على كاميرا. تأكد من وجود كاميرا متصلة بالجهاز.";
      } else if (err.name === 'NotSupportedError') {
        errorMessage = "المتصفح لا يدعم الوصول للكاميرا. جرب متصفح آخر.";
      }
      
      setCameraError(errorMessage);
      toast({
        title: "خطأ في الكاميرا",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error("خطأ في إيقاف المسح:", err);
    }
    setIsScanning(false);
    setCameraError(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            await handleQRDetection(code.data);
          } else {
            toast({
              title: "لم يتم العثور على رمز QR",
              description: "تأكد من وضوح الصورة ووجود رمز QR صالح",
              variant: "destructive",
            });
          }
        }
      };
      
      img.onerror = () => {
        toast({
          title: "خطأ في قراءة الصورة",
          description: "تأكد من أن الملف صورة صالحة",
          variant: "destructive",
        });
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error("خطأ في قراءة الصورة:", error);
      toast({
        title: "خطأ في قراءة الصورة",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">مسح رمز QR</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={qrCodeRegionId}
          className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
        >
          {!isScanning && !cameraError && (
            <div className="text-center text-gray-500 p-4">
              <Camera className="mx-auto h-12 w-12 mb-2" />
              <p>اضغط على "بدء المسح" لتشغيل الكاميرا</p>
            </div>
          )}
          {cameraError && (
            <div className="text-center text-red-500 p-4">
              <AlertCircle className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm">{cameraError}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1" disabled={!!cameraError}>
              <Camera className="mr-2 h-4 w-4" />
              بدء المسح
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1">
              إيقاف المسح
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            رفع صورة
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {selectedFile && (
          <p className="text-sm text-gray-600 text-center">
            تم تحديد: {selectedFile.name}
          </p>
        )}

        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-red-800 mb-1">نصائح لحل مشكلة الكاميرا:</p>
            <ul className="text-red-700 space-y-1 text-xs">
              <li>• تأكد من السماح للموقع بالوصول للكاميرا</li>
              <li>• أعد تحميل الصفحة وجرب مرة أخرى</li>
              <li>• تأكد من عدم استخدام تطبيق آخر للكاميرا</li>
              <li>• يمكنك رفع صورة للرمز بدلاً من المسح المباشر</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;
