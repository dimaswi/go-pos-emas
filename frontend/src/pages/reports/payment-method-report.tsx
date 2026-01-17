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
import { reportsApi, type PaymentMethodReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, Banknote, CreditCard, ArrowRightLeft, Wallet } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  preparePaymentMethodReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function PaymentMethodReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaymentMethodReport[]>([]);
  
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

      const response = await reportsApi.getPaymentMethodReport(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan metode pembayaran.",
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
    const { headers, data: exportData } = preparePaymentMethodReportData(data);
    exportToPDF({
      title: 'Laporan Metode Pembayaran',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data: exportData,
      filename: `metode-pembayaran-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = preparePaymentMethodReportData(data);
    exportToExcel({
      title: 'Laporan Metode Pembayaran',
      headers,
      data: exportData,
      filename: `metode-pembayaran-${startDate}-${endDate}`,
      sheetName: 'Metode Pembayaran',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  // Calculate totals
  const totals = data.reduce((acc, item) => ({
    totalTransactions: acc.totalTransactions + item.transaction_count,
    totalAmount: acc.totalAmount + item.total_amount,
    percentage: 100,
  }), { totalTransactions: 0, totalAmount: 0, percentage: 100 });

  const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <Banknote className="h-5 w-5 text-green-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case 'mixed':
        return <Wallet className="h-5 w-5 text-orange-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return 'Tunai';
      case 'transfer':
        return 'Transfer';
      case 'card':
        return 'Kartu';
      case 'mixed':
        return 'Campuran';
      default:
        return method || 'Lainnya';
    }
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
          {/* Payment Method Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(item.payment_method)}
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{getPaymentLabel(item.payment_method)}</div>
                      <div className="text-lg font-bold">{formatCurrency(item.total_amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.transaction_count} transaksi ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead className="text-right">Jumlah Transaksi</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead className="text-right">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(item.payment_method)}
                        <span className="font-medium">{getPaymentLabel(item.payment_method)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(item.transaction_count)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total_amount)}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.totalTransactions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.totalAmount)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
