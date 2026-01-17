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
import { reportsApi, type TopMemberReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, Trophy, Medal, Award, Crown } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareTopMembersReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function TopMembersReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopMemberReport[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [limit, setLimit] = useState('10');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: parseInt(limit) || 10 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getTopMembersReport(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan top member.",
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, limit, toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareTopMembersReportData(data);
    exportToPDF({
      title: 'Laporan Top Member',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data: exportData,
      filename: `top-member-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareTopMembersReportData(data);
    exportToExcel({
      title: 'Laporan Top Member',
      headers,
      data: exportData,
      filename: `top-member-${startDate}-${endDate}`,
      sheetName: 'Top Member',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-blue-400" />;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  // Calculate summary
  const summary = {
    totalMembers: data.length,
    totalTransactions: data.reduce((sum, m) => sum + m.transaction_count, 0),
    totalAmount: data.reduce((sum, m) => sum + m.total_amount, 0),
    avgAmount: data.length > 0 ? data.reduce((sum, m) => sum + m.total_amount, 0) / data.length : 0,
  };

  return (
    <div className="space-y-4">
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
          <Label className="text-xs">Jumlah Top</Label>
          <Input 
            type="number" 
            value={limit} 
            onChange={(e) => setLimit(e.target.value)} 
            placeholder="10"
            min="1"
            max="100"
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
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Member</div>
                    <div className="text-xl font-bold">{summary.totalMembers}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Transaksi</div>
                    <div className="text-xl font-bold">{formatNumber(summary.totalTransactions)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Belanja</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalAmount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Rata-rata Belanja</div>
                    <div className="text-lg font-bold text-purple-600">{formatCurrency(summary.avgAmount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 3 Podium */}
          {data.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <Card className="relative overflow-hidden border-2 border-gray-300">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-300 to-gray-500" />
                <CardContent className="p-4 text-center">
                  <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">2</div>
                  <div className="font-semibold truncate">{data[1]?.member_name}</div>
                  <div className="text-sm text-muted-foreground">{data[1]?.phone}</div>
                  <div className="mt-2 text-lg font-bold text-green-600">{formatCurrency(data[1]?.total_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">{data[1]?.transaction_count} transaksi</div>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="relative overflow-hidden border-2 border-yellow-400 -mt-4">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
                <CardContent className="p-4 text-center">
                  <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-yellow-600">1</div>
                  <div className="font-semibold truncate">{data[0]?.member_name}</div>
                  <div className="text-sm text-muted-foreground">{data[0]?.phone}</div>
                  <div className="mt-2 text-xl font-bold text-green-600">{formatCurrency(data[0]?.total_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">{data[0]?.transaction_count} transaksi</div>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="relative overflow-hidden border-2 border-amber-400">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                <CardContent className="p-4 text-center">
                  <Medal className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">3</div>
                  <div className="font-semibold truncate">{data[2]?.member_name}</div>
                  <div className="text-sm text-muted-foreground">{data[2]?.phone}</div>
                  <div className="mt-2 text-lg font-bold text-green-600">{formatCurrency(data[2]?.total_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">{data[2]?.transaction_count} transaksi</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Nama Member</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead className="text-right">Total Transaksi</TableHead>
                  <TableHead className="text-right">Total Belanja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index} className={index < 3 ? 'bg-muted/30' : ''}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadgeClass(item.rank)}`}>
                        {item.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(item.rank)}
                        <span className="font-medium">{item.member_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.transaction_count)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(item.total_amount)}</TableCell>
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
