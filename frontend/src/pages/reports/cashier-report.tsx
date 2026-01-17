import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportsApi, type CashierReport as CashierReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareCashierReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function CashierReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashiers, setCashiers] = useState<CashierReportType[]>([]);
  
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

      const response = await reportsApi.getCashierReport(params);
      setCashiers(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan kasir.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (cashiers.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareCashierReportData(cashiers);
    exportToPDF({
      title: 'Laporan Per Kasir',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `laporan-kasir-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (cashiers.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareCashierReportData(cashiers);
    exportToExcel({
      title: 'Laporan Per Kasir',
      headers,
      data,
      filename: `laporan-kasir-${startDate}-${endDate}`,
      sheetName: 'Per Kasir',
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

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={cashiers.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={cashiers.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : cashiers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Nama Kasir</TableHead>
                <TableHead className="text-xs text-right">Total Transaksi</TableHead>
                <TableHead className="text-xs text-right">Penjualan</TableHead>
                <TableHead className="text-xs text-right">Jml Jual</TableHead>
                <TableHead className="text-xs text-right">Pembelian</TableHead>
                <TableHead className="text-xs text-right">Jml Beli</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashiers.map((c, idx) => (
                <TableRow key={c.cashier_id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{c.cashier_name}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(c.total_transactions)}</TableCell>
                  <TableCell className="text-xs text-right text-green-600">{formatCurrency(c.total_sales)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(c.sale_count)}</TableCell>
                  <TableCell className="text-xs text-right text-red-600">{formatCurrency(c.total_purchases)}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(c.purchase_count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
