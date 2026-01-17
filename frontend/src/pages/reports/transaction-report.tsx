import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportsApi, locationsApi, type TransactionDetail, type TransactionReportSummary, type Location } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareTransactionReportData,
  formatCurrency,
  formatDateTime,
  formatNumber
} from '@/lib/export-utils';

export default function TransactionReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [summary, setSummary] = useState<TransactionReportSummary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [locationId, setLocationId] = useState<string>('all');
  const [txType, setTxType] = useState<string>('all');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsApi.getAll();
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (locationId && locationId !== 'all') params.location_id = parseInt(locationId);
      if (txType && txType !== 'all') params.type = txType;

      const response = await reportsApi.getTransactionReport(params);
      setTransactions(response.data.transactions || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan transaksi.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, locationId, txType, toast]);

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareTransactionReportData(transactions);
    const summaryData = summary ? [
      { label: 'Total Transaksi', value: formatNumber(summary.total_transactions) },
      { label: 'Total Penjualan', value: formatCurrency(summary.total_sales_amount) },
      { label: 'Total Pembelian', value: formatCurrency(summary.total_purchase_amount) },
      { label: 'Pendapatan Bersih', value: formatCurrency(summary.net_amount) },
    ] : undefined;

    exportToPDF({
      title: 'Laporan Transaksi',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `laporan-transaksi-${startDate}-${endDate}`,
      orientation: 'landscape',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareTransactionReportData(transactions);
    const summaryData = summary ? [
      { label: 'Total Transaksi', value: summary.total_transactions },
      { label: 'Total Penjualan', value: summary.total_sales_amount },
      { label: 'Total Pembelian', value: summary.total_purchase_amount },
      { label: 'Pendapatan Bersih', value: summary.net_amount },
    ] : undefined;

    exportToExcel({
      title: 'Laporan Transaksi',
      headers,
      data,
      filename: `laporan-transaksi-${startDate}-${endDate}`,
      sheetName: 'Transaksi',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs">Tanggal Mulai</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Tanggal Akhir</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs">Lokasi</Label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tipe</Label>
          <Select value={txType} onValueChange={setTxType}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="sale">Penjualan</SelectItem>
              <SelectItem value="purchase">Setor Emas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={loadReport} disabled={loading} className="h-9 flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
            Cari
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Transaksi</div>
              <div className="text-lg font-bold">{formatNumber(summary.total_transactions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Penjualan</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(summary.total_sales_amount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Total Pembelian</div>
              <div className="text-lg font-bold text-red-600">{formatCurrency(summary.total_purchase_amount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Pendapatan Bersih</div>
              <div className={`text-lg font-bold ${summary.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.net_amount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={transactions.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={transactions.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Kode</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
                <TableHead className="text-xs">Tipe</TableHead>
                <TableHead className="text-xs">Lokasi</TableHead>
                <TableHead className="text-xs">Kasir</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
                <TableHead className="text-xs">Pembayaran</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs font-mono">{tx.transaction_code}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(tx.transaction_date)}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={tx.type === 'sale' ? 'default' : 'secondary'}>
                      {tx.type === 'sale' ? 'Jual' : 'Beli'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{tx.location_name}</TableCell>
                  <TableCell className="text-xs">{tx.cashier_name}</TableCell>
                  <TableCell className="text-xs">{tx.member_name || tx.customer_name || '-'}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{formatCurrency(tx.grand_total)}</TableCell>
                  <TableCell className="text-xs uppercase">{tx.payment_method}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={tx.status === 'completed' ? 'default' : 'destructive'}>
                      {tx.status}
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
