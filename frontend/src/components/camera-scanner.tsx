import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create instance
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 100 }, // Wider box for barcodes
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      onScan(decodedText);
    };

    const onScanFailure = (err: any) => {
      // Ignored
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup when component unmounts
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScan]);

  return (
    <div className="flex flex-col space-y-4">
      <div id="reader" className="w-full max-w-md mx-auto overflow-hidden rounded-lg border"></div>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
