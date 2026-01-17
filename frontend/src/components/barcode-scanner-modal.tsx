import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, RotateCcw, X, Loader2 } from "lucide-react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  // Dynamically load BarcodeDetector or fallback
  const [detector, setDetector] = useState<BarcodeDetector | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      setIsLoading(false);
    }
  }, [facingMode, stopCamera]);

  // Initialize barcode detector
  useEffect(() => {
    if ("BarcodeDetector" in window) {
      // Use native BarcodeDetector API
      const barcodeDetector = new BarcodeDetector({
        formats: [
          // 1D Barcodes
          "code_128",    // High-density 1D (paling umum)
          "code_39",
          "code_93",     // High-density 1D
          "codabar",
          "ean_13",
          "ean_8",
          "itf",
          "upc_a",
          "upc_e",
          // 2D Barcodes (High-density)
          "qr_code",     // High-density 2D
          "data_matrix", // Very high-density 2D (untuk barcode kecil/padat)
          "pdf417",      // High-density 2D (sering di ID card)
          "aztec",       // High-density 2D (sering di tiket)
        ],
      });
      setDetector(barcodeDetector);
    } else {
      setError("Browser tidak mendukung barcode scanner. Gunakan Chrome atau Edge terbaru.");
    }
  }, []);

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (open && detector) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, detector, startCamera, stopCamera]);

  // Scan loop
  useEffect(() => {
    if (!open || !detector || !videoRef.current || isLoading || error) return;

    const scan = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      try {
        const barcodes = await detector.detect(videoRef.current);

        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          const now = Date.now();

          // Debounce: prevent same barcode within 2 seconds
          if (barcode !== lastScannedRef.current || now - lastScanTimeRef.current > 2000) {
            lastScannedRef.current = barcode;
            lastScanTimeRef.current = now;

            // Vibrate on successful scan (if supported)
            if (navigator.vibrate) {
              navigator.vibrate(100);
            }

            onScan(barcode);
            onOpenChange(false);
            return;
          }
        }
      } catch (err) {
        // Ignore detection errors, continue scanning
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open, detector, isLoading, error, onScan, onOpenChange]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Restart camera when facingMode changes
  useEffect(() => {
    if (open && detector) {
      startCamera();
    }
  }, [facingMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-3 pb-0">
          <DialogTitle className="text-sm flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[4/3] bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Memuat kamera...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="flex flex-col items-center gap-3 text-white p-4 text-center">
                <CameraOff className="h-12 w-12 text-red-400" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="text-white border-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scan overlay */}
          {!isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay with cut-out */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Scan area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-32 border-2 border-white rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                  <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />

                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-2 right-2 h-0.5 bg-primary animate-pulse"
                    style={{ animation: "scan 2s ease-in-out infinite" }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  Arahkan kamera ke barcode
                </span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            disabled={isLoading || !!error}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Ganti Kamera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>

        <style>{`
          @keyframes scan {
            0%, 100% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(120px); opacity: 0.5; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
