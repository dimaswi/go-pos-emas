import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { stocksApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StockTransferShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [batchInfo, setBatchInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    setPageTitle(`Detail Transfer ${id}`);
    if (id) {
      loadBatchDetails(id);
    }
  }, [id]);

  const loadBatchDetails = async (transferNumber: string) => {
    setIsLoading(true);
    try {
      const response = await stocksApi.getTransferBatchDetails(transferNumber);
      const data = response.data.data || [];
      setBatchDetails(data);

      // We can derive batch info from the first item if available
      if (data.length > 0) {
        setBatchInfo({
          transfer_number: data[0].transfer_number,
          status: data[0].status,
          from_location: data[0].from_location?.name,
          to_location: data[0].to_location?.name,
          transferred_at: data[0].transferred_at,
          notes: data[0].notes,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat detail transfer.",
      });
      navigate('/stock-transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await stocksApi.approveTransfer(id);
      toast({
        variant: "success",
        title: "Berhasil",
        description: `Transfer ${id} telah disetujui.`,
      });
      setShowApproveDialog(false);
      loadBatchDetails(id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.response?.data?.error || "Gagal menyetujui transfer.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await stocksApi.rejectTransfer(id);
      toast({
        variant: "success",
        title: "Berhasil",
        description: `Transfer ${id} telah ditolak dan dibatalkan.`,
      });
      setShowRejectDialog(false);
      loadBatchDetails(id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.response?.data?.error || "Gagal menolak transfer.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Menunggu</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Disetujui</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Ditolak</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex items-center gap-4">
            <div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/stock-transfers')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-semibold truncate flex items-center gap-2">
                  Detail Transfer: {id}
                  {batchInfo && <span className="ml-2">{getStatusBadge(batchInfo.status)}</span>}
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs truncate">
                  Informasi detail barang yang ditransfer
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 space-y-4">
          <Card className="border-dashed shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-sm">Informasi Transfer</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Lokasi Asal</p>
                  <p className="font-semibold">{batchInfo?.from_location || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Lokasi Tujuan</p>
                  <p className="font-semibold">{batchInfo?.to_location || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Waktu Permintaan</p>
                  <p className="font-semibold">{batchInfo ? new Date(batchInfo.transferred_at).toLocaleString('id-ID') : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Catatan</p>
                  <p className="font-semibold">{batchInfo?.notes || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b">
              <CardTitle className="text-sm">Daftar Barang</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-md border-x border-b overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>SN / Barcode</TableHead>
                      <TableHead>Box Asal</TableHead>
                      <TableHead>Box Tujuan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchDetails.map((detail, idx) => (
                      <TableRow key={detail.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {detail.stock?.product?.name}
                          <div className="text-xs text-muted-foreground">{detail.stock?.product?.gold_category?.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{detail.stock?.serial_number}</span>
                          <div className="text-xs text-muted-foreground">{detail.stock?.product?.barcode}</div>
                        </TableCell>
                        <TableCell>{detail.from_box?.code}</TableCell>
                        <TableCell>{detail.to_box?.code}</TableCell>
                      </TableRow>
                    ))}
                    {batchDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Tidak ada barang dalam transfer ini.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {batchInfo?.status === 'pending' && hasPermission('stocks.transfer.approve') && (
            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setShowRejectDialog(true)} disabled={isActionLoading}>
                <XCircle className="h-4 w-4 mr-2" />
                Tolak Transfer
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowApproveDialog(true)} disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Setujui Transfer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Setujui Transfer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui transfer <strong>{id}</strong>? Stok akan dipindahkan secara permanen ke lokasi tujuan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Batal</AlertDialogCancel>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Setujui
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Tolak Transfer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menolak dan membatalkan transfer <strong>{id}</strong>? Barang akan tetap berada di lokasi asalnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Kembali</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Ya, Tolak Transfer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
