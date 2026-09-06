import React, { useRef, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, Upload, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (itemImageBase64: string, customerImageBase64: string) => void;
  title?: string;
}

export function ValidationCameraModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Validasi Transaksi",
}: ValidationCameraModalProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"item" | "customer">("item");
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [customerImage, setCustomerImage] = useState<string | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: step === "item" ? "environment" : "user" }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Kamera tidak dapat diakses. Silakan gunakan tombol upload.");
    }
  }, [step, stream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Effect to handle modal open/close and step changes
  useEffect(() => {
    if (open) {
      const isCurrentStepTaken = step === "item" ? itemImage : customerImage;
      if (!isCurrentStepTaken) {
        startCamera();
      }
    } else {
      stopCamera();
      // Reset state on close
      setTimeout(() => {
        setStep("item");
        setItemImage(null);
        setCustomerImage(null);
        setCameraError(null);
      }, 300);
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // Compress and get Base64
  const compressImage = (dataUrl: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality jpeg
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const compressedUrl = await compressImage(dataUrl);
        
        if (step === "item") {
          setItemImage(compressedUrl);
        } else {
          setCustomerImage(compressedUrl);
        }
        stopCamera();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak didukung",
        description: "Harap upload file gambar (jpg/png).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const compressedUrl = await compressImage(event.target.result as string);
        if (step === "item") {
          setItemImage(compressedUrl);
        } else {
          setCustomerImage(compressedUrl);
        }
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    if (step === "item") {
      setItemImage(null);
    } else {
      setCustomerImage(null);
    }
    startCamera();
  };

  const handleNext = () => {
    if (step === "item" && itemImage) {
      setStep("customer");
    }
  };

  const handleSubmit = () => {
    if (itemImage && customerImage) {
      onConfirm(itemImage, customerImage);
    }
  };

  const currentImage = step === "item" ? itemImage : customerImage;
  const stepTitle = step === "item" ? "Foto Barang/Emas" : "Foto Pelanggan";
  const stepDesc = step === "item" ? "Pastikan barang terlihat jelas." : "Pastikan wajah pelanggan terlihat jelas.";

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title} - {stepTitle}</DialogTitle>
          <DialogDescription>{stepDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 mt-2">
          {/* Viewfinder or Captured Image */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {currentImage ? (
              <img src={currentImage} alt="Captured" className="w-full h-full object-contain" />
            ) : cameraError ? (
              <div className="text-white text-center p-4">
                <p className="text-sm text-red-400 mb-2">{cameraError}</p>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Foto
                </Button>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <input 
            type="file" 
            accept="image/*" 
            capture={step === "item" ? "environment" : "user"}
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          {/* Controls */}
          <div className="flex w-full justify-between items-center mt-2 gap-2">
            {!currentImage ? (
              <>
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
                <Button type="button" onClick={takePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!!cameraError}>
                  <Camera className="h-4 w-4 mr-2" /> Ambil Foto
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" type="button" onClick={retake} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" /> Foto Ulang
                </Button>
                {step === "item" ? (
                  <Button type="button" onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
                    Selanjutnya <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4 mr-2" /> Selesai & Kirim
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-2">
          <div className={`h-2 flex-1 rounded-full ${step === "item" ? "bg-primary" : "bg-primary/30"}`} />
          <div className={`h-2 flex-1 rounded-full ${step === "customer" ? "bg-primary" : "bg-primary/30"}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
