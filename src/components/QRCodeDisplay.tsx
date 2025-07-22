
import React from "react";
import QRCodeGenerator from "./QRCodeGenerator";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 200, className = "" }) => {
  return (
    <div className={className}>
      <QRCodeGenerator 
        value={value} 
        size={size} 
        title="QR Code"
        showDownload={true}
      />
    </div>
  );
};

export default QRCodeDisplay;
