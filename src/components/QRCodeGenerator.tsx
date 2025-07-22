
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  title?: string;
  showDownload?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  title = "QR Code",
  showDownload = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgData, setSvgData] = React.useState<string>('');

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('Error generating QR code:', error);
      });
    }
    // Generate SVG string
    QRCode.toString(value, { type: 'svg', width: size, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }, (err, svg) => {
      if (!err && svg) setSvgData(svg);
    });
  }, [value, size]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const downloadSVG = () => {
    if (svgData) {
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && svgData) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Code</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;">${svgData}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  if (!value) {
    return (
      <Card className="w-fit">
        <CardContent className="p-6 text-center">
          <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">لا يوجد بيانات لإنشاء رمز QR</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <canvas 
            ref={canvasRef}
            className="border border-gray-200 rounded"
          />
          {/* Hidden SVG for download/print */}
          <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: svgData }} />
          {showDownload && (
            <div className="flex gap-2 flex-wrap justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadQR}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل PNG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSVG}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                تحميل SVG
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={printQR}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
