import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportsApi, type LocationRevenue } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, MapPin, TrendingUp, Building2 } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareLocationRevenueData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function LocationRevenueReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LocationRevenue[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getLocationRevenue(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan pendapatan per lokasi.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareLocationRevenueData(data);
    exportToPDF({
      title: 'Laporan Pendapatan per Lokasi',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data: exportData,
      filename: `pendapatan-lokasi-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareLocationRevenueData(data);
    exportToExcel({
      title: 'Laporan Pendapatan per Lokasi',
      headers,
      data: exportData,
      filename: `pendapatan-lokasi-${startDate}-${endDate}`,
      sheetName: 'Pendapatan Lokasi',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  // Calculate totals
  const totals = data.reduce((acc, item) => ({
    totalSaleCount: acc.totalSaleCount + item.sale_count,
    totalPurchaseCount: acc.totalPurchaseCount + item.purchase_count,
    totalSales: acc.totalSales + item.total_sales,
    totalPurchases: acc.totalPurchases + item.total_purchases,
    netRevenue: acc.netRevenue + item.net_revenue,
  }), { totalSaleCount: 0, totalPurchaseCount: 0, totalSales: 0, totalPurchases: 0, netRevenue: 0 });

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
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={data.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={data.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Lokasi</div>
                    <div className="text-xl font-bold">{data.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Transaksi</div>
                    <div className="text-xl font-bold">{formatNumber(totals.totalSaleCount + totals.totalPurchaseCount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Penjualan</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(totals.totalSales)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Pendapatan Bersih</div>
                    <div className="text-lg font-bold text-blue-600">{formatCurrency(totals.netRevenue)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jml Jual</TableHead>
                  <TableHead className="text-right">Jml Beli</TableHead>
                  <TableHead className="text-right">Total Penjualan</TableHead>
                  <TableHead className="text-right">Total Pembelian</TableHead>
                  <TableHead className="text-right">Pendapatan Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.location_name}</TableCell>
                    <TableCell>{item.location_type === 'toko' ? 'Toko' : 'Gudang'}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.sale_count)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.purchase_count)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.total_sales)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(item.total_purchases)}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">{formatCurrency(item.net_revenue)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.totalSaleCount)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.totalPurchaseCount)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(totals.totalSales)}</TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(totals.totalPurchases)}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(totals.netRevenue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
