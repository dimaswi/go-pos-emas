import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportsApi, type StockCategoryReport as StockCategoryReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareStockCategoryReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function StockCategoryReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<StockCategoryReportType[]>([]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getStockCategoryReport();
      setCategories(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan stok per kategori.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportPDF = () => {
    if (categories.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockCategoryReportData(categories);
    exportToPDF({
      title: 'Laporan Stok Per Kategori Emas',
      subtitle: `Per tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      headers,
      data,
      filename: `laporan-stok-kategori-${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (categories.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockCategoryReportData(categories);
    exportToExcel({
      title: 'Laporan Stok Per Kategori Emas',
      headers,
      data,
      filename: `laporan-stok-kategori-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Stok Per Kategori',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={loadReport} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={categories.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={categories.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tidak ada data stok</div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Kode</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
                <TableHead className="text-xs text-right">Tersedia</TableHead>
                <TableHead className="text-xs text-right">Terjual</TableHead>
                <TableHead className="text-xs text-right">Berat (g)</TableHead>
                <TableHead className="text-xs text-right">Rata-rata Beli</TableHead>
                <TableHead className="text-xs text-right">Rata-rata Jual</TableHead>
                <TableHead className="text-xs text-right">Total Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c, idx) => (
                <TableRow key={c.category_id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{c.category_code}</TableCell>
                  <TableCell className="text-xs font-medium">{c.category_name}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(c.total_stock)}</TableCell>
                  <TableCell className="text-xs text-right text-green-600">{formatNumber(c.available_stock)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{formatNumber(c.sold_stock)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(c.total_weight, 2)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(c.avg_buy_price)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(c.avg_sell_price)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(c.total_sell_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
