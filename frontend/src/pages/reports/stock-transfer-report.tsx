import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { reportsApi, type StockTransferReport as StockTransferReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareStockTransferReportData,
  formatDateTime
} from '@/lib/export-utils';

export default function StockTransferReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<StockTransferReportType[]>([]);
  
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

      const response = await reportsApi.getStockTransferReport(params);
      setTransfers(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan transfer stok.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (transfers.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockTransferReportData(transfers);
    exportToPDF({
      title: 'Laporan Transfer Stok',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `laporan-transfer-stok-${startDate}-${endDate}`,
      orientation: 'landscape',
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (transfers.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareStockTransferReportData(transfers);
    exportToExcel({
      title: 'Laporan Transfer Stok',
      headers,
      data,
      filename: `laporan-transfer-stok-${startDate}-${endDate}`,
      sheetName: 'Transfer Stok',
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
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={transfers.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={transfers.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">No. Transfer</TableHead>
                <TableHead className="text-xs">Serial</TableHead>
                <TableHead className="text-xs">Produk</TableHead>
                <TableHead className="text-xs">Dari</TableHead>
                <TableHead className="text-xs">Ke</TableHead>
                <TableHead className="text-xs">Ditransfer Oleh</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((t, idx) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{t.transfer_number}</TableCell>
                  <TableCell className="text-xs font-mono">{t.stock_serial}</TableCell>
                  <TableCell className="text-xs">{t.product_name}</TableCell>
                  <TableCell className="text-xs">{t.from_location_name}</TableCell>
                  <TableCell className="text-xs">{t.to_location_name}</TableCell>
                  <TableCell className="text-xs">{t.transferred_by_name}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(t.transferred_at)}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
