import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, Files, Printer, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotaPrintMode = "single" | "per-item";

interface NotaPrintOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  onConfirm: (mode: NotaPrintMode) => void;
  isLoading?: boolean;
}

export function NotaPrintOptionsModal({
  open,
  onOpenChange,
  itemCount,
  onConfirm,
  isLoading = false,
}: NotaPrintOptionsModalProps) {
  const [selectedMode, setSelectedMode] = useState<NotaPrintMode>("single");

  const handleConfirm = () => {
    onConfirm(selectedMode);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in-0 zoom-in-95">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Printer className="h-5 w-5 text-amber-600" />
            Pilihan Cetak Nota
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih cara pencetakan surat nota untuk {itemCount} item perhiasan
          </p>
        </div>

        {/* Options */}
        <div className="py-4">
          <RadioGroup
            value={selectedMode}
            onValueChange={(value) => setSelectedMode(value as NotaPrintMode)}
            className="space-y-3"
          >
            {/* Option 1: Single Nota */}
            <div
              className={cn(
                "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedMode === "single"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-muted hover:border-amber-200 hover:bg-muted/50"
              )}
              onClick={() => setSelectedMode("single")}
            >
              <RadioGroupItem value="single" id="single" className="mt-1" />
              <Label
                htmlFor="single"
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Satu Nota untuk Semua</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Semua {itemCount} item perhiasan akan dicetak dalam satu lembar nota
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                    1 lembar nota
                  </span>
                </div>
              </Label>
            </div>

            {/* Option 2: Per Item */}
            <div
              className={cn(
                "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedMode === "per-item"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-muted hover:border-amber-200 hover:bg-muted/50"
              )}
              onClick={() => setSelectedMode("per-item")}
            >
              <RadioGroupItem value="per-item" id="per-item" className="mt-1" />
              <Label
                htmlFor="per-item"
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Files className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Satu Nota per Perhiasan</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Setiap item perhiasan akan dicetak di lembar nota terpisah
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                    {itemCount} lembar nota
                  </span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Cetak Nota
          </Button>
        </div>
      </div>
    </div>
  );
}
