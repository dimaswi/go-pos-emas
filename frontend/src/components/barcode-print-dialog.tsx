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

type LabelMode = 'large' | 'small';

const LABEL_CONFIGS = {
  large: {
    name: 'Label Besar',
    description: '88x27mm - Vertikal',
    paperWidth: 88,
    paperHeight: 27,
    margin: 2,
    marginTop: 5, // gap atas 5mm (samakan dengan kecil)
    marginLeft: 5, // gap kiri 5mm (2mm + 3mm extra)
    gapBetween: 34,
    cols: 2,
    get labelWidth() { return (this.paperWidth - this.marginLeft - this.margin - this.gapBetween) / this.cols; }, // 23.5mm
    get labelHeight() { return this.paperHeight - this.marginTop - this.margin; }, // 20mm
    qrSize: 12,
  },
  small: {
    name: 'Label Kecil',
    description: '74x23mm - Horizontal',
    paperWidth: 74,
    paperHeight: 23,
    margin: 2,
    marginTop: 5, // gap atas 5mm (3mm extra)
    marginLeft: 4,
    gapBetween: 4,
    cols: 2,
    get labelWidth() { return (this.paperWidth - this.marginLeft - this.margin - this.gapBetween) / this.cols; }, // 33mm
    get labelHeight() { return this.paperHeight - this.marginTop - this.margin; }, // 16mm
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
  const [labelMode, setLabelMode] = useState<LabelMode>('small');

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

    // Generate QR codes as data URLs first
    const qrDataUrls: Record<string, string> = {};
    const qrSizePx = Math.round(cfg.qrSize * 10); // higher resolution for print

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
      for (let i = 0; i < stocks.length; i += cfg.cols) {
        const rowLabels = [];

        for (let j = 0; j < cfg.cols; j++) {
          const stock = stocks[i + j];
          if (stock) {
            const { weight, purity } = getStockInfo(stock);
            const qrUrl = qrDataUrls[stock.serial_number] || '';

            if (labelMode === 'large') {
              // Mode A: Vertikal 50/50 - Berat+Kadar atas, QR bawah
              rowLabels.push(`
                <div class="label">
                  <div class="info-top">
                    <div class="info-text">${formatWeight(weight)}</div>
                    <div class="info-text">${formatKadar(purity)}</div>
                  </div>
                  <div class="qr-bottom">
                    <img src="${qrUrl}" class="qr-img"/>
                  </div>
                </div>
              `);
            } else {
              // Mode B: Horizontal - QR kiri, Berat+Kadar kanan
              rowLabels.push(`
                <div class="label">
                  <div class="qr-side">
                    <img src="${qrUrl}" class="qr-img"/>
                  </div>
                  <div class="info-side">
                    <div class="info-text">${formatWeight(weight)}</div>
                    <div class="info-text">${formatKadar(purity)}</div>
                  </div>
                </div>
              `);
            }
          }
        }

        rows.push(`<div class="row">${rowLabels.join('')}</div>`);
      }
      return rows.join('');
    };

    const totalRows = Math.ceil(stocks.length / cfg.cols);
    const totalHeight = totalRows * cfg.paperHeight;

    const halfHeight = cfg.labelHeight / 2;
    let labelStyles = '';
    if (labelMode === 'large') {
      labelStyles = `
.label{display:inline-flex;flex-direction:column;vertical-align:top;width:${cfg.labelWidth}mm;height:${cfg.labelHeight}mm;overflow:hidden}
.info-top{height:${halfHeight}mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.5mm;overflow:hidden}
.info-text{font-size:7pt;font-weight:900;color:#000;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${cfg.labelWidth - 1}mm;line-height:1.4}
.qr-bottom{height:${halfHeight}mm;display:flex;align-items:center;justify-content:center;padding:0.5mm}
.qr-img{display:block;width:${halfHeight - 2}mm;height:${halfHeight - 2}mm}`;
    } else {
      labelStyles = `
.label{display:inline-flex;flex-direction:row;vertical-align:top;width:${cfg.labelWidth}mm;height:${cfg.labelHeight}mm;overflow:hidden;align-items:center}
.qr-side{display:flex;align-items:center;justify-content:center;padding:0.5mm;padding-left:3mm;flex-shrink:0}
.qr-img{display:block;width:${cfg.qrSize}mm;height:${cfg.qrSize}mm}
.info-side{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.5mm;overflow:hidden}
.info-text{font-size:6pt;font-weight:900;color:#000;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${cfg.labelWidth - cfg.qrSize - 2}mm;line-height:1.4}`;
    }

    const printContent = `<!DOCTYPE html>
<html>
<head>
<title>Cetak Label</title>
<style>
@page{size:${cfg.paperWidth}mm ${totalHeight}mm;margin:0;padding:0}
*{margin:0;padding:0;box-sizing:border-box;line-height:1}
html,body{font-family:Arial,sans-serif;width:${cfg.paperWidth}mm;height:${totalHeight}mm;margin:0;padding:0;font-size:0}
.container{width:${cfg.paperWidth}mm;height:${totalHeight}mm;font-size:0}
.row{width:${cfg.paperWidth}mm;height:${cfg.paperHeight}mm;padding:${cfg.marginTop}mm ${cfg.margin}mm ${cfg.margin}mm ${cfg.marginLeft}mm;font-size:0;white-space:nowrap;overflow:hidden;display:flex;justify-content:space-between;align-items:center}
${labelStyles}
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

  const title = mode === 'box' ? `Cetak Label - ${boxName || 'Box'}` : `Cetak Label (${stocks.length} item)`;
  const printedCount = stocks.filter(s => s.barcode_printed).length;
  const notPrintedCount = stocks.length - printedCount;

  // Preview render for Mode A (large) - vertikal 50/50 layout (atas: info, bawah: QR)
  const renderLargePreviewLabel = (stock: Stock) => {
    const { weight, purity } = getStockInfo(stock);
    const halfHeight = cfg.labelHeight / 2;
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
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {stock.barcode_printed && (
          <div className="absolute top-0 right-0 bg-green-500 text-white p-0.5 rounded-bl">
            <Check className="h-2 w-2" />
          </div>
        )}
        {/* Berat dan Kadar (atas 50%) */}
        <div style={{
          height: `${halfHeight}mm`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5mm',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '6.5pt',
            fontWeight: 'bold',
            lineHeight: 1.4,
            textAlign: 'center',
          }}>
            {formatWeight(weight)}
          </div>
          <div style={{
            fontSize: '6.5pt',
            fontWeight: 'bold',
            lineHeight: 1.4,
            textAlign: 'center',
          }}>
            {formatKadar(purity)}
          </div>
        </div>
        {/* QR Code (bawah 50%) */}
        <div style={{
          height: `${halfHeight}mm`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5mm',
        }}>
          <canvas
            id={`qr-${stock.id}`}
            style={{ width: `${halfHeight - 2}mm`, height: `${halfHeight - 2}mm`, flexShrink: 0 }}
          />
        </div>
      </div>
    );
  };

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

        {/* Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={labelMode === 'small' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLabelMode('small')}
          >
            <span className="text-xs">Label Kecil (74x23mm)</span>
          </Button>
          <Button
            variant={labelMode === 'large' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLabelMode('large')}
          >
            <span className="text-xs">Label Besar (88x27mm)</span>
          </Button>
        </div>

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
                    labelMode === 'large'
                      ? renderLargePreviewLabel(stock)
                      : renderSmallPreviewLabel(stock)
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
