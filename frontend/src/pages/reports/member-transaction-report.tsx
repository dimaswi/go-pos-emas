import { useState, useEffect, useCallback } from 'react';
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
import { reportsApi, membersApi, type MemberTransactionReport, type Member } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileSpreadsheet, FileText, Search, Users, TrendingUp, TrendingDown, Hash } from 'lucide-react';
import { 
  exportToPDF, 
  exportToExcel, 
  prepareMemberReportData,
  formatCurrency,
  formatNumber
} from '@/lib/export-utils';

export default function MemberTransactionReportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MemberTransactionReport[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  const [memberId, setMemberId] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await membersApi.getAll({ page_size: 1000 });
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (memberId && memberId !== 'all') params.member_id = memberId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await reportsApi.getMemberTransactionReport(params);
      setData(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat laporan transaksi member.",
      });
    } finally {
      setLoading(false);
    }
  }, [memberId, startDate, endDate, toast]);

  const handleExportPDF = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareMemberReportData(data);
    exportToPDF({
      title: 'Laporan Transaksi Member',
      subtitle: `Periode: ${startDate} - ${endDate}`,
      headers,
      data: exportData,
      filename: `transaksi-member-${startDate}-${endDate}`,
    });
    toast({ title: "Sukses!", description: "Laporan PDF berhasil diunduh." });
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "Error!", description: "Tidak ada data untuk diekspor." });
      return;
    }
    const { headers, data: exportData } = prepareMemberReportData(data);
    exportToExcel({
      title: 'Laporan Transaksi Member',
      headers,
      data: exportData,
      filename: `transaksi-member-${startDate}-${endDate}`,
      sheetName: 'Transaksi Member',
    });
    toast({ title: "Sukses!", description: "Laporan Excel berhasil diunduh." });
  };

  // Calculate summary
  const summary = data.reduce((acc, item) => ({
    totalPurchase: acc.totalPurchase + item.total_purchase,
    totalSell: acc.totalSell + item.total_sell,
    totalTransactions: acc.totalTransactions + item.transaction_count,
    totalPoints: acc.totalPoints + item.points,
  }), { totalPurchase: 0, totalSell: 0, totalTransactions: 0, totalPoints: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1">
          <Label className="text-xs">Member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Member</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name} ({member.phone})
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Member</div>
                    <div className="text-xl font-bold">{data.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-purple-600" />
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
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Pembelian</div>
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalPurchase)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Penjualan</div>
                    <div className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalSell)}</div>
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
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">Jml Transaksi</TableHead>
                  <TableHead className="text-right">Total Beli</TableHead>
                  <TableHead className="text-right">Total Jual</TableHead>
                  <TableHead className="text-right">Poin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{item.member_code}</TableCell>
                    <TableCell className="font-medium">{item.member_name}</TableCell>
                    <TableCell>{item.member_type}</TableCell>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell className="text-right">{item.transaction_count}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.total_purchase)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(item.total_sell)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(item.points)}</TableCell>
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
