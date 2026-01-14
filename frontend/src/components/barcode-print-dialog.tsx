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
 * KONFIGURASI LABEL PRINT - LP-T368 80mm Thermal Printer
 * 
 * Ukuran Kertas Fisik (diukur dengan penggaris):
 * - Lebar: 73mm (7.3 cm)
 * - Tinggi: 23mm (2.3 cm)
 * 
 * Setting Printer: Tinggi 300mm (continuous mode)
 * 
 * Perhitungan Label (2 kolom, gap 2mm semua sisi):
 * - Margin kiri: 2mm
 * - Gap antara kolom: 2mm
 * - Margin kanan: 2mm (implisit)
 * - Margin atas: 2mm
 * - Margin bawah: 2mm (implisit)
 * 
 * Lebar label = (73 - 2 - 2 - 2) / 2 = 33.5mm → 33mm
 * Tinggi label = 23 - 2 - 2 = 19mm
 */

const PAPER_WIDTH = 73;   // mm - lebar kertas fisik
const PAPER_HEIGHT = 23;  // mm - tinggi kertas fisik (per row)
const MARGIN_H = 2;       // mm - gap kiri kanan (horizontal)
const MARGIN_V = 1;       // mm - gap atas bawah (vertikal)
const GAP_BETWEEN = 2;    // mm - gap antara 2 kolom
const COLS = 2;

// Calculated values
const LABEL_WIDTH = Math.floor((PAPER_WIDTH - MARGIN_H - MARGIN_H - GAP_BETWEEN) / COLS); // 33mm
const LABEL_HEIGHT = PAPER_HEIGHT - MARGIN_V - MARGIN_V; // 21mm
const QR_SIZE = 12;       // mm - QR code size (max untuk tinggi 19mm)

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
    const qrSizePx = Math.round(QR_SIZE * 3.78); // mm to px at 96dpi
    
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
  }, []);

  useEffect(() => {
    if (stocks.length > 0) {
      setTimeout(() => generateQRCodes(stocks), 50);
    }
  }, [stocks, generateQRCodes]);

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

  // Format harga full
  const formatPrice = (price: number) => {
    return 'Rp.' + price.toLocaleString('id-ID');
  };

  const handlePrint = async () => {
    setPrinting(true);
    
    // Generate QR codes as data URLs first
    const qrDataUrls: Record<string, string> = {};
    const qrSizePx = Math.round(QR_SIZE * 10); // higher resolution for print
    
    for (const stock of stocks) {
      try {
        const dataUrl = await QRCode.toDataURL(stock.serial_number, {
          width: qrSizePx,
          margin: 0,
          errorCorrectionLevel: 'L',
        });
        qrDataUrls[stock.serial_number] = dataUrl;
      } catch (e) {
        console.error('QR Code error:', e);
      }
    }
    
    // Build rows - 2 labels per row
    const buildRows = () => {
      const rows = [];
      for (let i = 0; i < stocks.length; i += COLS) {
        const rowLabels = [];

        for (let j = 0; j < COLS; j++) {
          const stock = stocks[i + j];
          if (stock) {
            const name = (stock.product?.name || '-');
            const qrUrl = qrDataUrls[stock.serial_number] || '';
            rowLabels.push(`<div class="label"><div class="name">${name}</div><img src="${qrUrl}" class="qr-img"/></div>`);
          }
        }

        rows.push(`<div class="row">${rowLabels.join('')}</div>`);
      }
      return rows.join('');
    };

    const totalRows = Math.ceil(stocks.length / COLS);
    const totalHeight = totalRows * PAPER_HEIGHT;

    const printContent = `<!DOCTYPE html>
<html>
<head>
<title>Cetak Barcode</title>
<style>
@page{size:${PAPER_WIDTH}mm ${totalHeight}mm;margin:0;padding:0}
*{margin:0;padding:0;box-sizing:border-box;line-height:1}
html,body{font-family:Arial,sans-serif;width:${PAPER_WIDTH}mm;height:${totalHeight}mm;margin:0;padding:0;font-size:0}
.container{width:${PAPER_WIDTH}mm;height:${totalHeight}mm;font-size:0}
.row{width:${PAPER_WIDTH}mm;height:${PAPER_HEIGHT}mm;padding-left:${MARGIN_H}mm;font-size:0;white-space:nowrap;overflow:hidden}
.label{display:inline-block;vertical-align:top;width:${LABEL_WIDTH}mm;height:${PAPER_HEIGHT - 1}mm;text-align:center;padding-top:0.5mm}
.label:nth-child(2){margin-left:${GAP_BETWEEN}mm}
.qr-img{display:block;width:${QR_SIZE}mm;height:${QR_SIZE}mm;margin:0 auto}
.name{font-size:7pt;font-weight:900;color:#000;text-align:center;max-width:${LABEL_WIDTH}mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1mm}
</style>
</head>
<body><div class="container">${buildRows()}</div></body>
</html>`;

    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      setPrinting(false);
      return;
    }
    
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();
    
    // Wait for images to load then print
    setTimeout(() => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow) {
          iframeWindow.addEventListener('afterprint', () => {
            const confirmed = window.confirm('Tandai stok sebagai sudah dicetak?');
            if (confirmed) markStocksAsPrinted();
            setTimeout(() => {
              if (document.body.contains(iframe)) document.body.removeChild(iframe);
              setPrinting(false);
            }, 100);
          }, { once: true });
          
          iframeWindow.print();
        } else {
          setPrinting(false);
          document.body.removeChild(iframe);
        }
      } catch (error) {
        console.error('Print error:', error);
        setPrinting(false);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }
    }, 500);
  };

  const title = mode === 'box' ? `Cetak Barcode - ${boxName || 'Box'}` : `Cetak Barcode (${stocks.length} item)`;
  const printedCount = stocks.filter(s => s.barcode_printed).length;
  const notPrintedCount = stocks.length - printedCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>{stocks.length} item</span>
            <span>•</span>
            <span>Kertas {PAPER_WIDTH}x{PAPER_HEIGHT}mm</span>
            <span>•</span>
            <span>Label {LABEL_WIDTH}x{LABEL_HEIGHT}mm</span>
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
              {Array.from({ length: Math.ceil(stocks.length / COLS) }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="bg-white shadow border"
                  style={{
                    width: `${PAPER_WIDTH}mm`,
                    height: `${PAPER_HEIGHT}mm`,
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    padding: `${MARGIN_V}mm ${MARGIN_H}mm`,
                    gap: `${GAP_BETWEEN}mm`,
                  }}
                >
                  {stocks.slice(rowIndex * COLS, rowIndex * COLS + COLS).map((stock) => {
                    const productName = stock.product?.name || '-';
                    const shortName = productName.length > 10 ? productName.substring(0, 10) + '..' : productName;
                    const price = formatPrice(stock.product?.gold_category?.sell_price || 0);
                    
                    return (
                      <div
                        key={stock.id}
                        className={`border overflow-hidden ${
                          stock.barcode_printed 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-dashed border-gray-300'
                        }`}
                        style={{
                          width: `${LABEL_WIDTH}mm`,
                          height: `${LABEL_HEIGHT}mm`,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '1mm',
                          position: 'relative',
                        }}
                      >
                        {stock.barcode_printed && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white p-0.5 rounded-bl">
                            <Check className="h-2 w-2" />
                          </div>
                        )}
                        <canvas 
                          id={`qr-${stock.id}`} 
                          style={{ width: `${QR_SIZE}mm`, height: `${QR_SIZE}mm`, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '6pt', fontWeight: 'bold', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {shortName}
                          </div>
                          <div style={{ fontSize: '8pt', fontWeight: 'bold', lineHeight: 1.3 }}>
                            {price}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
