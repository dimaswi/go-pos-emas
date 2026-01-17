import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportsApi, goldCategoriesApi, type PriceHistoryReport, type GoldCategory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  preparePriceHistoryData,
  formatCurrency,
  formatDateTime
} from '@/lib/export-utils';

export default function PriceHistoryReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceHistoryReport[]>([]);
  const [categories, setCategories] = useState<GoldCategory[]>([]);
  
  const [categoryId, setCategoryId] = useState<string>('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await goldCategoriesApi.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (categoryId) params.category_id = categoryId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getPriceHistoryReport(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat riwayat harga emas.",
      });
    } finally {
      setLoading(false);
    }
  }, [categoryId, startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = preparePriceHistoryData(data);
    exportToPDF({
      title: 'Riwayat Harga Emas',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data: exportData,
      filename: `riwayat-harga-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = preparePriceHistoryData(data);
    exportToExcel({
      title: 'Riwayat Harga Emas',
      headers,
      data: exportData,
      filename: `riwayat-harga-${startDate}-${endDate}`,
      sheetName: 'Riwayat Harga',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getPriceChangeClass = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Calculate summary
  const totalDetailCount = data.reduce((sum, d) => sum + (d.details?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs">Kategori Emas</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name} ({cat.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Total Update</div>
                <div className="text-xl font-bold">{data.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Total Perubahan Harga</div>
                <div className="text-xl font-bold">{totalDetailCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Kategori Terpengaruh</div>
                <div className="text-xl font-bold">
                  {new Set(data.flatMap(d => d.details?.map(det => det.category_code) || [])).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Diupdate Oleh</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga Beli Lama</TableHead>
                  <TableHead className="text-right">Harga Beli Baru</TableHead>
                  <TableHead className="text-right">Harga Jual Lama</TableHead>
                  <TableHead className="text-right">Harga Jual Baru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flatMap((log, logIndex) => 
                  log.details?.map((detail, detailIndex) => (
                    <TableRow key={`${logIndex}-${detailIndex}`}>
                      <TableCell>{formatDateTime(log.update_date)}</TableCell>
                      <TableCell>{log.updated_by_name}</TableCell>
                      <TableCell className="font-medium">{detail.category_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.old_buy_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${getPriceChangeClass(detail.buy_price_change)}`}>
                          {formatCurrency(detail.new_buy_price)}
                          {detail.buy_price_change !== 0 && (
                            <>
                              {getPriceChangeIcon(detail.buy_price_change)}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.old_sell_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${getPriceChangeClass(detail.sell_price_change)}`}>
                          {formatCurrency(detail.new_sell_price)}
                          {detail.sell_price_change !== 0 && (
                            <>
                              {getPriceChangeIcon(detail.sell_price_change)}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || []
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
