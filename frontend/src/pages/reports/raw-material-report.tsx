import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportsApi, type RawMaterialReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareRawMaterialReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function RawMaterialReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<RawMaterialReport[]>([]);
  const [summary, setSummary] = useState<{ total_items: number; total_available_weight: number; total_available_value: number } | null>(null);
  const [status, setStatus] = useState<string>('all');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (status && status !== 'all') params.status = status;

      const response = await reportsApi.getRawMaterialReport(params);
      setMaterials(response.data.data || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan bahan baku.",
      });
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  const handleExportPDF = () => {
    if (materials.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareRawMaterialReportData(materials);
    const summaryData = summary ? [
      { label: 'Total Item', value: formatNumber(summary.total_items) },
      { label: 'Total Berat Tersedia', value: formatNumber(summary.total_available_weight, 2) + ' gram' },
      { label: 'Total Nilai Tersedia', value: formatCurrency(summary.total_available_value) },
    ] : undefined;

    exportToPDF({
      title: 'Laporan Bahan Baku',
      subtitle: `Per tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      headers,
      data,
      filename: `laporan-bahan-baku-${new Date().toISOString().split('T')[0]}`,
      orientation: 'landscape',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (materials.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data } = prepareRawMaterialReportData(materials);
    const summaryData = summary ? [
      { label: 'Total Item', value: summary.total_items },
      { label: 'Total Berat Tersedia (gram)', value: summary.total_available_weight },
      { label: 'Total Nilai Tersedia', value: summary.total_available_value },
    ] : undefined;

    exportToExcel({
      title: 'Laporan Bahan Baku',
      headers,
      data,
      filename: `laporan-bahan-baku-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Bahan Baku',
      summaryData,
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge variant="default">Tersedia</Badge>;
      case 'processed': return <Badge variant="secondary">Diproses</Badge>;
      case 'sold': return <Badge variant="outline">Terjual</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="available">Tersedia</SelectItem>
              <SelectItem value="processed">Diproses</SelectItem>
              <SelectItem value="sold">Terjual</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="text-xs text-muted-foreground">Total Item</div>
              <div className="text-lg font-bold">{formatNumber(summary.total_items)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Berat Tersedia</div>
              <div className="text-lg font-bold">{formatNumber(summary.total_available_weight, 2)} g</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">Nilai Tersedia</div>
              <div className="text-lg font-bold">{formatCurrency(summary.total_available_value)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={materials.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={materials.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Klik tombol "Cari" untuk memuat data laporan
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">No</TableHead>
                <TableHead className="text-xs">Kode</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs">Lokasi</TableHead>
                <TableHead className="text-xs text-right">Berat Kotor</TableHead>
                <TableHead className="text-xs text-right">Susut (%)</TableHead>
                <TableHead className="text-xs text-right">Berat Bersih</TableHead>
                <TableHead className="text-xs text-right">Total Harga</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m, idx) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{idx + 1}</TableCell>
                  <TableCell className="text-xs font-mono">{m.code}</TableCell>
                  <TableCell className="text-xs">{m.category_name || '-'}</TableCell>
                  <TableCell className="text-xs">{m.location_name}</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(m.weight_gross, 2)} g</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(m.shrinkage_percent, 1)}%</TableCell>
                  <TableCell className="text-xs text-right">{formatNumber(m.weight_grams, 2)} g</TableCell>
                  <TableCell className="text-xs text-right">{formatCurrency(m.total_buy_price)}</TableCell>
                  <TableCell className="text-xs">{getStatusBadge(m.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
