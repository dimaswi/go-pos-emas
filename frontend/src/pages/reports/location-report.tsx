import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { reportsApi, type LocationReport as LocationReportType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareLocationRevenueData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function LocationReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationReportType[]>([]);
  
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

      const response = await reportsApi.getLocationReport(params);
      setLocations(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan lokasi.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (locations.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareLocationRevenueData(locations);
    exportToPDF({
      title: 'Laporan Per Lokasi',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `laporan-lokasi-${startDate}-${endDate}`,
      orientation: 'landscape',
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (locations.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareLocationRevenueData(locations);
    exportToExcel({
      title: 'Laporan Per Lokasi',
      headers,
      data,
      filename: `laporan-lokasi-${startDate}-${endDate}`,
      sheetName: 'Per Lokasi',
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
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={locations.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={locations.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Lokasi</TableHead>
                <TableHead className="text-xs">Tipe</TableHead>
                <TableHead className="text-xs text-right">Total Transaksi</TableHead>
                <TableHead className="text-xs text-right">Penjualan</TableHead>
                <TableHead className="text-xs text-right">Pembelian</TableHead>
                <TableHead className="text-xs text-right">Pendapatan Bersih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc, idx) => (
                <TableRow key={loc.location_id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{loc.location_name}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={loc.location_type === 'toko' ? 'default' : 'secondary'}>
                      {loc.location_type === 'toko' ? 'Toko' : 'Gudang'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(loc.total_transactions)}</TableCell>
                  <TableCell className="text-xs text-right text-green-600">{formatCurrency(loc.total_sales)}</TableCell>
                  <TableCell className="text-xs text-right text-red-600">{formatCurrency(loc.total_purchases)}</TableCell>
                  <TableCell className={`text-xs text-right font-bold ${loc.net_revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(loc.net_revenue)}
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
