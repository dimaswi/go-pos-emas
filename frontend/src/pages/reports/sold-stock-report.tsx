import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { reportsApi, type SoldStockReport as SoldStockReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareSoldStockReportData,
  formatCurrency,
  formatDateTime,
  formatNumber
} from '@/lib/export-utils';

export default function SoldStockReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<SoldStockReportType[]>([]);
  const [summary, setSummary] = useState<{ total_items: number; total_sales: number; total_profit: number } | null>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getSoldStockReport(params);
      setStocks(response.data.data || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan stok terjual.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (stocks.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareSoldStockReportData(stocks);
    const summaryData = summary ? [
      { label: 'Total Item Terjual', value: formatNumber(summary.total_items) },
      { label: 'Total Penjualan', value: formatCurrency(summary.total_sales) },
      { label: 'Total Profit', value: formatCurrency(summary.total_profit) },
    ] : undefined;

    exportToPDF({
      title: 'Laporan Stok Terjual',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `laporan-stok-terjual-${startDate}-${endDate}`,
      orientation: 'landscape',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (stocks.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareSoldStockReportData(stocks);
    const summaryData = summary ? [
      { label: 'Total Item Terjual', value: summary.total_items },
      { label: 'Total Penjualan', value: summary.total_sales },
      { label: 'Total Profit', value: summary.total_profit },
    ] : undefined;

    exportToExcel({
      title: 'Laporan Stok Terjual',
      headers,
      data,
      filename: `laporan-stok-terjual-${startDate}-${endDate}`,
      sheetName: 'Stok Terjual',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Tanggal Mulai</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Tanggal Akhir</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
        </div>
        <div className="flex items-end">
          <Button onClick={loadReport} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
            Cari
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Terjual</div>
              <div className="text-lg font-bold">{formatNumber(summary.total_items)} item</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Penjualan</div>
              <div className="text-lg font-bold">{formatCurrency(summary.total_sales)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Profit</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(summary.total_profit)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
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
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Serial</TableHead>
                <TableHead className="text-xs">Produk</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs text-right">Berat (g)</TableHead>
                <TableHead className="text-xs text-right">Harga Beli</TableHead>
                <TableHead className="text-xs text-right">Harga Jual</TableHead>
                <TableHead className="text-xs text-right">Profit</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{s.serial_number}</TableCell>
                  <TableCell className="text-xs">{s.product_name}</TableCell>
                  <TableCell className="text-xs">{s.category_name}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(s.weight, 2)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(s.buy_price)}</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(s.sell_price)}</TableCell>
                  <TableCell className={`text-xs text-right font-medium ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(s.profit)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(s.sold_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
