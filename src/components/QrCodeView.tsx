import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 64,
  className = '',
  label = 'QR code',
}) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: Math.max(48, size * 3),
      color: { dark: '#000000', light: '#ffffff' },
    }).then(url => {
      if (active) setDataUrl(url);
    }).catch(() => {
      if (active) setDataUrl('');
    });
    return () => {
      active = false;
    };
  }, [size, value]);

  if (!dataUrl) {
    return <div data-qr-loading="true" aria-label={label} className={`animate-pulse bg-stone-100 ${className}`} style={{ width: size, height: size }} />;
  }

  return <img data-qr-ready="true" src={dataUrl} alt={label} width={size} height={size} className={`object-contain ${className}`} />;
};
