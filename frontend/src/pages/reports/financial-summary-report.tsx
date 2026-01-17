import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsApi, type FinancialSummary } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, ArrowRightLeft, Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareFinancialSummaryData,
  formatCurrency
} from '@/lib/export-utils';

export default function FinancialSummaryReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Generate insights based on financial data
  const insights = useMemo(() => {
    if (!summary) return [];
    
    const result: Array<{
      type: 'success' | 'warning' | 'info' | 'tip';
      title: string;
      message: string;
    }> = [];

    // Profit Analysis
    const profitMargin = summary.total_income > 0 
      ? (summary.net_profit / summary.total_income) * 100 
      : 0;

    if (summary.net_profit > 0) {
      result.push({
        type: 'success',
        title: 'Laba Positif',
        message: `Bisnis menghasilkan laba sebesar ${formatCurrency(summary.net_profit)} dengan margin ${profitMargin.toFixed(1)}%. Pertahankan performa ini!`
      });
    } else if (summary.net_profit < 0) {
      result.push({
        type: 'warning',
        title: 'Rugi Bersih',
        message: `Bisnis mengalami kerugian sebesar ${formatCurrency(Math.abs(summary.net_profit))}. Evaluasi strategi pembelian dan penjualan untuk meningkatkan profitabilitas.`
      });
    }

    // Payment Method Analysis
    const totalPayments = summary.cash_payments + summary.transfer_payments + summary.card_payments + summary.mixed_payments;
    if (totalPayments > 0) {
      const cashPercent = (summary.cash_payments / totalPayments) * 100;
      const transferPercent = (summary.transfer_payments / totalPayments) * 100;
      const cardPercent = (summary.card_payments / totalPayments) * 100;
      
      // Dominant payment method
      const payments = [
        { name: 'Cash', value: summary.cash_payments, percent: cashPercent },
        { name: 'Transfer', value: summary.transfer_payments, percent: transferPercent },
        { name: 'Kartu', value: summary.card_payments, percent: cardPercent },
        { name: 'Campuran', value: summary.mixed_payments, percent: (summary.mixed_payments / totalPayments) * 100 }
      ].sort((a, b) => b.value - a.value);

      result.push({
        type: 'info',
        title: 'Metode Pembayaran Dominan',
        message: `${payments[0].name} adalah metode pembayaran paling populer (${payments[0].percent.toFixed(1)}%). ${
          cashPercent > 70 
            ? 'Pertimbangkan promosi untuk pembayaran digital untuk mempermudah rekonsiliasi.' 
            : 'Diversifikasi pembayaran sudah baik.'
        }`
      });
    }

    // Expense Ratio
    const expenseRatio = summary.total_income > 0 
      ? (summary.total_expenses / summary.total_income) * 100 
      : 0;

    if (expenseRatio > 80) {
      result.push({
        type: 'warning',
        title: 'Rasio Pengeluaran Tinggi',
        message: `Pengeluaran mencapai ${expenseRatio.toFixed(1)}% dari pendapatan. Pertimbangkan untuk menegosiasi harga pembelian yang lebih baik atau meningkatkan margin jual.`
      });
    } else if (expenseRatio > 0 && expenseRatio <= 60) {
      result.push({
        type: 'success',
        title: 'Efisiensi Biaya Baik',
        message: `Rasio pengeluaran terhadap pendapatan adalah ${expenseRatio.toFixed(1)}%. Ini menunjukkan manajemen biaya yang efektif.`
      });
    }

    // Transaction Volume Tips
    if (summary.total_income > 0) {
      result.push({
        type: 'tip',
        title: 'Saran Peningkatan',
        message: profitMargin >= 15 
          ? 'Margin sudah sehat. Fokus pada peningkatan volume transaksi dan menjaga kepuasan pelanggan untuk pertumbuhan berkelanjutan.'
          : 'Pertimbangkan untuk meninjau harga jual atau mencari supplier dengan harga yang lebih kompetitif untuk meningkatkan margin keuntungan.'
      });
    }

    // Balance Check
    if (summary.total_expenses > summary.total_income * 1.5) {
      result.push({
        type: 'warning',
        title: 'Peringatan Arus Kas',
        message: 'Pengeluaran jauh lebih besar dari pendapatan. Pastikan stok yang dibeli dapat terjual dengan baik untuk menjaga arus kas yang sehat.'
      });
    }

    return result;
  }, [summary]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getFinancialSummary(params);
      setSummary(response.data.data || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan keuangan.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (!summary) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareFinancialSummaryData(summary);
    exportToPDF({
      title: 'Ringkasan Keuangan',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data,
      filename: `ringkasan-keuangan-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (!summary) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareFinancialSummaryData(summary);
    exportToExcel({
      title: 'Ringkasan Keuangan',
      headers,
      data,
      filename: `ringkasan-keuangan-${startDate}-${endDate}`,
      sheetName: 'Ringkasan Keuangan',
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
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!summary}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!summary}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !summary ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Pendapatan</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(summary.total_income)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Pengeluaran</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(summary.total_expenses)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${summary.net_profit >= 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-orange-50 dark:bg-orange-950/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${summary.net_profit >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'} rounded-full`}>
                    <Wallet className={`h-5 w-5 ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Laba Bersih</div>
                    <div className={`text-xl font-bold ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(summary.net_profit)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Cash</div>
                    <div className="text-lg font-bold">{formatCurrency(summary.cash_payments)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Transfer</div>
                    <div className="text-lg font-bold">{formatCurrency(summary.transfer_payments)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Kartu</div>
                    <div className="text-lg font-bold">{formatCurrency(summary.card_payments)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Campuran</div>
                    <div className="text-lg font-bold">{formatCurrency(summary.mixed_payments)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights & Suggestions Section */}
          {insights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Analisis & Saran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      insight.type === 'success' 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                        : insight.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                        : insight.type === 'info'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                        : 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                        {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                        {insight.type === 'tip' && <Lightbulb className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${
                          insight.type === 'success' 
                            ? 'text-green-700 dark:text-green-400' 
                            : insight.type === 'warning'
                            ? 'text-amber-700 dark:text-amber-400'
                            : insight.type === 'info'
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-purple-700 dark:text-purple-400'
                        }`}>
                          {insight.title}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {insight.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
