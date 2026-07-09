import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api, type Stock } from '@/lib/api';
import QRCode from 'qrcode';

/**
 * KONFIGURASI LABEL PRINT - 2 Mode
 *
 * === Mode A: Label Besar (88x27mm) ===
 * - Lebar: 88mm, Tinggi: 27mm
 * - Gap semua sisi: 2mm
 * - Jarak antar label: 34mm
 * - Lebar label = (88 - 2 - 2 - 34) / 2 = 25mm
 * - Tinggi label = 27 - 2 - 2 = 23mm
 * - Layout horizontal 50/50: Berat+Kadar (kiri), Barcode (kanan)
 *
 * === Mode B: Label Kecil (74x23mm) ===
 * - Lebar: 74mm, Tinggi: 23mm
 * - Gap semua sisi: 2mm
 * - Gap antar label: 4mm
 * - Lebar label = (74 - 2 - 2 - 4) / 2 = 33mm
 * - Tinggi label = 23 - 2 - 2 = 19mm
 * - Layout: QR/Barcode (kiri), Berat+Kadar (kanan)
 */

type LabelMode = 'small';

const LABEL_CONFIGS = {
  small: {
    name: 'Label Stok',
    description: '74x23mm - Horizontal',
    paperWidth: 74,
    paperHeight: 23,
    margin: 2,
    marginTop: 5,
    marginLeft: 4,
    gapBetween: 4,
    cols: 2,
    get labelWidth() { return (this.paperWidth - this.marginLeft - this.margin - this.gapBetween) / this.cols; },
    get labelHeight() { return this.paperHeight - this.marginTop - this.margin; },
    qrSize: 12,
  },
} as const;

interface BarcodePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxId?: number | null;
  boxName?: string;
  stocks?: Stock[];
  mode?: 'box' | 'selected';
  onPrintComplete?: () => void;
}

export function BarcodePrintDialog({
  open,
  onOpenChange,
  boxId,
  boxName,
  stocks: selectedStocks,
  mode = 'box',
  onPrintComplete
}: BarcodePrintDialogProps) {
  const { toast } = useToast();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const labelMode: LabelMode = 'small';

  const cfg = LABEL_CONFIGS[labelMode];

  useEffect(() => {
    if (open) {
      if (mode === 'selected' && selectedStocks) {
        setStocks(selectedStocks);
        setTimeout(() => generateQRCodes(selectedStocks), 100);
      } else if (mode === 'box' && boxId) {
        loadStocks();
      }
    }
  }, [open, boxId, mode, selectedStocks]);

  const loadStocks = async () => {
    if (!boxId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/stocks/box/${boxId}/items`);
      const data = response.data.data || [];
      setStocks(data);
      setTimeout(() => generateQRCodes(data), 100);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memuat data stok.",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = useCallback(async (stockList: Stock[]) => {
    const qrSizePx = Math.round(cfg.qrSize * 3.78); // mm to px at 96dpi

    for (const stock of stockList) {
      const canvas = document.getElementById(`qr-${stock.id}`) as HTMLCanvasElement;
      if (canvas) {
        try {
          await QRCode.toCanvas(canvas, stock.serial_number, {
            width: qrSizePx,
            margin: 0,
            errorCorrectionLevel: 'L',
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    }
  }, [cfg.qrSize]);

  useEffect(() => {
    if (stocks.length > 0) {
      setTimeout(() => generateQRCodes(stocks), 50);
    }
  }, [stocks, generateQRCodes, labelMode]);

  const markStocksAsPrinted = async () => {
    try {
      const stockIds = stocks.map(s => s.id);
      await api.post('/stocks-mark-printed', { stock_ids: stockIds });
      toast({
        variant: "success",
        title: "Berhasil!",
        description: `${stockIds.length} stok ditandai sudah dicetak.`,
      });
      if (onPrintComplete) {
        onPrintComplete();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menandai stok sudah dicetak.",
      });
    }
  };

  // Format berat
  const formatWeight = (weight: number) => {
    return weight.toFixed(2) + 'g';
  };

  // Format kadar
  const formatKadar = (purity: number) => {
    return (purity * 100).toFixed(1) + '%';
  };

  const getStockInfo = (stock: Stock) => {
    const weight = stock.product?.weight || 0;
    const purity = stock.product?.gold_category?.purity || 0;
    const kadarCode = stock.product?.gold_category?.code || '-';
    return { weight, purity, kadarCode };
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const stockIds = stocks.map(s => s.id);
      const { printApi } = await import('@/lib/api');
      const url = await printApi.getLabelPdf(stockIds, 'small');
      window.open(url, '_blank');

      const confirmed = window.confirm('Tandai stok sebagai sudah dicetak?');
      if (confirmed) {
        markStocksAsPrinted();
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal mencetak label melalui backend.",
      });
    } finally {
      setPrinting(false);
    }
  };

  const title = mode === 'box' ? `Cetak Label - ${boxName || 'Box'}` : `Cetak Label (${stocks.length} item)`;
  const printedCount = stocks.filter(s => s.barcode_printed).length;
  const notPrintedCount = stocks.length - printedCount;

  // Preview render for Mode B (small) - horizontal layout
  const renderSmallPreviewLabel = (stock: Stock) => {
    const { weight, purity } = getStockInfo(stock);
    return (
      <div
        key={stock.id}
        className={`overflow-hidden ${
          stock.barcode_printed ? 'bg-green-50' : ''
        }`}
        style={{
          width: `${cfg.labelWidth}mm`,
          height: `${cfg.labelHeight}mm`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {stock.barcode_printed && (
          <div className="absolute top-0 right-0 bg-green-500 text-white p-0.5 rounded-bl">
            <Check className="h-2 w-2" />
          </div>
        )}
        {/* QR Code / Barcode (kiri, geser 3mm ke kanan) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5mm',
          paddingLeft: '3mm',
          flexShrink: 0,
        }}>
          <canvas
            id={`qr-${stock.id}`}
            style={{ width: `${cfg.qrSize}mm`, height: `${cfg.qrSize}mm`, flexShrink: 0 }}
          />
        </div>
        {/* Berat dan Kadar (kanan) */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5mm',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '6pt',
            fontWeight: 'bold',
            lineHeight: 1.4,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {formatWeight(weight)}
          </div>
          <div style={{
            fontSize: '6pt',
            fontWeight: 'bold',
            lineHeight: 1.4,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {formatKadar(purity)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>{stocks.length} item</span>
            <span>•</span>
            <span>Kertas {cfg.paperWidth}x{cfg.paperHeight}mm</span>
            <span>•</span>
            <span>Label {cfg.labelWidth.toFixed(0)}x{cfg.labelHeight}mm</span>
            {stocks.length > 0 && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  {printedCount} sudah cetak
                </Badge>
                {notPrintedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notPrintedCount} belum cetak
                  </Badge>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        

        {/* Preview Area */}
        <div className="flex-1 border rounded-lg p-4 bg-gray-100 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Tidak ada stok tersedia untuk dicetak
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Preview per row */}
              {Array.from({ length: Math.ceil(stocks.length / cfg.cols) }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="bg-white shadow border"
                  style={{
                    width: `${cfg.paperWidth}mm`,
                    height: `${cfg.paperHeight}mm`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${cfg.marginTop}mm ${cfg.margin}mm ${cfg.margin}mm ${cfg.marginLeft}mm`,
                  }}
                >
                  {stocks.slice(rowIndex * cfg.cols, rowIndex * cfg.cols + cfg.cols).map((stock) =>
                    renderSmallPreviewLabel(stock)
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
          <Button
            onClick={handlePrint}
            disabled={loading || printing || stocks.length === 0}
          >
            {printing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            {printing ? 'Mencetak...' : `Cetak (${stocks.length} Label)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
