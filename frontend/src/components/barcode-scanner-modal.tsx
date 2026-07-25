import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { CameraScanner } from "@/components/camera-scanner";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full h-[100dvh] sm:h-auto max-w-full m-0 p-0 overflow-y-auto flex flex-col rounded-none sm:rounded-lg gap-0">
        <DialogHeader className="p-3 bg-background z-20 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm flex items-center gap-2 m-0">
            <Camera className="h-4 w-4" />
            Scan
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 bg-black p-0 sm:p-4 flex flex-col items-center justify-center relative">
          <div className="w-full h-full sm:max-w-sm mx-auto bg-black sm:bg-background sm:rounded-lg sm:shadow-sm overflow-hidden flex items-center justify-center">
            {open && (
              <CameraScanner
                onScan={(barcode) => {
                  onScan(barcode);
                  onOpenChange(false);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
