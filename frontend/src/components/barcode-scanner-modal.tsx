import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to safely cleanup scanner, even if it's currently in the middle of starting
  const cleanupScanner = (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    const attemptStop = () => {
      // If it's starting, wait for it to finish before stopping, 
      // otherwise it will throw an uncatchable error or leave the camera on.
      if (isStartingRef.current) {
        setTimeout(attemptStop, 100);
        return;
      }
      try {
        const isScanning = (scanner as any).isScanning || (typeof scanner.getState === 'function' && scanner.getState() === 2);
        if (isScanning) {
          scanner.stop().then(() => {
            try { scanner.clear(); } catch(e) {}
          }).catch(() => {
            try { scanner.clear(); } catch(e) {}
          });
        } else {
          try { scanner.clear(); } catch(e) {}
        }
      } catch (e) {
        try { scanner.clear(); } catch(err) {}
      }
    };
    attemptStop();
  };

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        cleanupScanner(scanner);
      }
      return;
    }

    const startScanner = async () => {
      try {
        setError(null);
        // Clean up previous instance if any
        if (scannerRef.current) {
            const oldScanner = scannerRef.current;
            scannerRef.current = null;
            cleanupScanner(oldScanner);
        }

        const scanner = new Html5Qrcode("pos-barcode-reader");
        scannerRef.current = scanner;
        
        isStartingRef.current = true;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (navigator.vibrate) navigator.vibrate(100);
            
            if (scannerRef.current) {
                const s = scannerRef.current;
                scannerRef.current = null;
                cleanupScanner(s);
                onScan(decodedText);
                onOpenChange(false);
            }
          },
          (_errorMessage) => {
            // ignore continuous scan failures
          }
        );
        isStartingRef.current = false;
      } catch (err) {
        isStartingRef.current = false;
        console.error("Scanner error:", err);
        setError("Gagal mengakses kamera. Pastikan izin kamera diberikan (Klik Allow/Izinkan) dan website diakses via HTTPS.");
      }
    };

    // Slight delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        const s = scannerRef.current;
        scannerRef.current = null;
        cleanupScanner(s);
      }
    };
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 overflow-hidden flex flex-col rounded-none sm:rounded-lg gap-0 border-0">
        <DialogHeader className="p-3 bg-background z-20 shrink-0 flex flex-row items-center justify-between border-b">
          <DialogTitle className="text-sm flex items-center gap-2 m-0">
            <Camera className="h-4 w-4" />
            Scan QR / Barcode
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="relative flex-1 bg-black w-full h-full flex flex-col">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center gap-4">
                <span className="text-red-500 font-bold">ERROR</span>
                <span>{error}</span>
                <Button variant="outline" className="text-black mt-4" onClick={() => onOpenChange(false)}>
                    Tutup
                </Button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <div id="pos-barcode-reader" className="w-full h-full sm:w-[400px] sm:h-[400px] bg-black" />
            </div>
          )}

          {/* Controls Overlay */}
          {!error && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20 px-4">
                <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 border-white/20"
                onClick={() => onOpenChange(false)}
                >
                <X className="h-6 w-6" />
                </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
