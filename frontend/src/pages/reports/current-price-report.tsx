import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportsApi, type CurrentPriceReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, RefreshCw, Coins } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareCurrentPriceReportData,
  formatCurrency,
  formatDateTime,
  formatNumber
} from '@/lib/export-utils';

export default function CurrentPriceReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CurrentPriceReport[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getCurrentPriceReport();
      setData(response.data.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat harga emas saat ini.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareCurrentPriceReportData(data);
    exportToPDF({
      title: 'Daftar Harga Emas Saat Ini',
      subtitle: `Diunduh: ${formatDateTime(new Date().toISOString())}`,
      headers,
      data: exportData,
      filename: `harga-emas-${new Date().toISOString().split('T')[0]}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareCurrentPriceReportData(data);
    exportToExcel({
      title: 'Daftar Harga Emas Saat Ini',
      headers,
      data: exportData,
      filename: `harga-emas-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Harga Emas',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={loadReport} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Muat Harga Terbaru
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={data.length === 0}>
            <FileText className="h-4 w-4 mr-1" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={data.length === 0}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Terakhir diperbarui: {formatDateTime(lastUpdated.toISOString())}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Muat Harga Terbaru" untuk memuat data harga emas
        </div>
      ) : (
        <>
          {/* Price Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      <span>{item.category_name}</span>
                    </div>
                    <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                      {item.category_code}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Harga Beli</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(item.buy_price)}
                      </div>
                      <div className="text-xs text-muted-foreground">/gram</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Harga Jual</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(item.sell_price)}
                      </div>
                      <div className="text-xs text-muted-foreground">/gram</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Spread
                    </div>
                    <div className="font-medium text-purple-600">
                      {formatCurrency(item.sell_price - item.buy_price)}
                    </div>
                  </div>

                  {item.purity && (
                    <div className="text-xs text-muted-foreground">
                      Kemurnian: {formatNumber(item.purity * 100, 2)}%
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-right">
                    Update: {formatDateTime(item.last_updated)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabel Harga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead className="text-right">Kemurnian</TableHead>
                      <TableHead className="text-right">Harga Beli/gram</TableHead>
                      <TableHead className="text-right">Harga Jual/gram</TableHead>
                      <TableHead className="text-right">Spread</TableHead>
                      <TableHead>Terakhir Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category_name}</TableCell>
                        <TableCell>
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                            {item.category_code}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.purity ? formatNumber(item.purity * 100, 2) + '%' : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(item.buy_price)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {formatCurrency(item.sell_price)}
                        </TableCell>
                        <TableCell className="text-right text-purple-600">
                          {formatCurrency(item.sell_price - item.buy_price)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(item.last_updated)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
