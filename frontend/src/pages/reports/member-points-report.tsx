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
import { reportsApi, type MemberPointsReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, Star, Users, TrendingUp } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareMemberPointsReportData,
  formatNumber,
  formatCurrency,
  formatDate
} from '@/lib/export-utils';

export default function MemberPointsReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MemberPointsReport[]>([]);
  
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (minPoints) params.min_points = parseInt(minPoints);
      if (maxPoints) params.max_points = parseInt(maxPoints);

      const response = await reportsApi.getMemberPointsReport(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan poin member.",
      });
    } finally {
      setLoading(false);
    }
  }, [minPoints, maxPoints, toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareMemberPointsReportData(data);
    exportToPDF({
      title: 'Laporan Poin Member',
      subtitle: `Total ${data.length} member`,
      headers,
      data: exportData,
      filename: `poin-member-${new Date().toISOString().split('T')[0]}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareMemberPointsReportData(data);
    exportToExcel({
      title: 'Laporan Poin Member',
      headers,
      data: exportData,
      filename: `poin-member-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Poin Member',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  // Calculate summary
  const summary = {
    totalMembers: data.length,
    totalPoints: data.reduce((sum, m) => sum + m.current_points, 0),
    avgPoints: data.length > 0 ? data.reduce((sum, m) => sum + m.current_points, 0) / data.length : 0,
    totalPurchase: data.reduce((sum, m) => sum + m.total_purchase, 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Poin Minimum</Label>
          <Input 
            type="number" 
            value={minPoints} 
            onChange={(e) => setMinPoints(e.target.value)} 
            placeholder="0"
            className="h-9" 
          />
        </div>
        <div>
          <Label className="text-xs">Poin Maksimum</Label>
          <Input 
            type="number" 
            value={maxPoints} 
            onChange={(e) => setMaxPoints(e.target.value)} 
            placeholder="∞"
            className="h-9" 
          />
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
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Member</div>
                    <div className="text-xl font-bold">{formatNumber(summary.totalMembers)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Poin</div>
                    <div className="text-xl font-bold">{formatNumber(summary.totalPoints)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Rata-rata Poin</div>
                    <div className="text-xl font-bold">{formatNumber(Math.round(summary.avgPoints))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Pembelian</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalPurchase)}</div>
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead className="text-right">Poin Saat Ini</TableHead>
                  <TableHead className="text-right">Total Pembelian</TableHead>
                  <TableHead>Tgl Bergabung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.member_code}</TableCell>
                    <TableCell className="font-medium">{item.member_name}</TableCell>
                    <TableCell>{item.member_type}</TableCell>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{formatNumber(item.current_points)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.total_purchase)}</TableCell>
                    <TableCell>{formatDate(item.join_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
