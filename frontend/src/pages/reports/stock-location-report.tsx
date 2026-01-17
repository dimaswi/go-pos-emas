import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { reportsApi, type StockLocationReport as StockLocationReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareStockLocationReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function StockLocationReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockLocationReportType[]>([]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getStockLocationReport();
      setStocks(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan stok.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportPDF = () => {
    if (stocks.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockLocationReportData(stocks);
    exportToPDF({
      title: 'Laporan Stok Per Lokasi',
      subtitle: `Per tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      headers,
      data,
      filename: `laporan-stok-lokasi-${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (stocks.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockLocationReportData(stocks);
    exportToExcel({
      title: 'Laporan Stok Per Lokasi',
      headers,
      data,
      filename: `laporan-stok-lokasi-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Stok Per Lokasi',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={loadReport} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={stocks.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={stocks.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada data stok</div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Lokasi</TableHead>
                <TableHead className="text-xs">Tipe</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
                <TableHead className="text-xs text-right">Tersedia</TableHead>
                <TableHead className="text-xs text-right">Terjual</TableHead>
                <TableHead className="text-xs text-right">Berat (g)</TableHead>
                <TableHead className="text-xs text-right">Nilai Beli</TableHead>
                <TableHead className="text-xs text-right">Nilai Jual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((s, idx) => (
                <TableRow key={s.location_id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{s.location_name}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={s.location_type === 'toko' ? 'default' : 'secondary'}>
                      {s.location_type === 'toko' ? 'Toko' : 'Gudang'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(s.total_stock)}</TableCell>
                  <TableCell className="text-xs text-right text-green-600">{formatNumber(s.available_stock)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{formatNumber(s.sold_stock)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(s.total_weight, 2)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(s.total_buy_value)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(s.total_sell_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
