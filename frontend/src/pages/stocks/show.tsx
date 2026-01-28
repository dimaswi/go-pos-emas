import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { stocksApi, type Stock } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2, Warehouse, Store, Box, Barcode } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: 'Tersedia', variant: 'default' },
  reserved: { label: 'Dipesan', variant: 'secondary' },
  sold: { label: 'Terjual', variant: 'outline' },
  returned: { label: 'Dikembalikan', variant: 'destructive' },
};

export default function StockShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Detail Stok');
    loadStock();
  }, [id]);

  const loadStock = async () => {
    try {
      const response = await stocksApi.getById(Number(id));
      setStock(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data stok.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteDialogOpen(false);
    try {
      await stocksApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Stok berhasil dihapus.",
      });
      setTimeout(() => navigate('/stocks'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus stok.",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Stok tidak ditemukan</p>
          <Button onClick={() => navigate('/stocks')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[stock.status] || { label: stock.status, variant: 'outline' };
  const LocationIcon = stock.location?.type === 'gudang' ? Warehouse : Store;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={() => navigate('/stocks')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Stok</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Informasi lengkap tentang stok</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('stocks.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={() => navigate(`/stocks/${id}/edit`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('stocks.delete') && (
                <Button 
                  variant="destructive"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Hapus
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
            {/* Serial Number & Status Section */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Barcode className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                </div>
                <p className="text-lg font-mono font-bold break-all">{stock.serial_number}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusInfo.variant} className="mt-1 text-sm">
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Product Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI PRODUK
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Produk</label>
                  <p className="font-medium text-base">{stock.product?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Barcode</label>
                  <p className="font-mono font-medium text-base flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    {stock.product?.barcode || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tipe</label>
                  <p className="font-medium text-base capitalize">{stock.product?.type || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Berat</label>
                  <p className="font-medium text-base">{stock.product?.weight.toFixed(2) || '-'} gram</p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Location Information Section */}
            <div className="my-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI LOKASI
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Lokasi</label>
                  <p className="font-medium text-base flex items-center gap-2">
                    <LocationIcon className="h-4 w-4 text-muted-foreground" />
                    {stock.location?.name || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tipe Lokasi</label>
                  <Badge variant={stock.location?.type === 'gudang' ? 'default' : 'secondary'}>
                    {stock.location?.type === 'gudang' ? 'Gudang' : 'Toko'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Kotak Penyimpanan</label>
                  <p className="font-medium text-base flex items-center gap-2">
                    {stock.storage_box ? (
                      <>
                        <Box className="h-4 w-4 text-muted-foreground" />
                        {stock.storage_box.code} - {stock.storage_box.name}
                      </>
                    ) : '-'}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Price & Source Information Section */}
            <div className="my-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI HARGA & SUMBER
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Harga Beli (dari kategori)</label>
                  <p className="font-medium text-base">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((stock.product?.gold_category?.buy_price || 0) * (stock.product?.weight || 0))}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Harga Jual (dari kategori)</label>
                  <p className="font-medium text-base">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format((stock.product?.gold_category?.sell_price || 0) * (stock.product?.weight || 0))}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Supplier</label>
                  <p className="font-medium text-base">{stock.supplier_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tanggal Masuk</label>
                  <p className="font-medium text-base">
                    {stock.received_at ? new Date(stock.received_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </p>
                </div>
                {stock.notes && (
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="text-sm text-muted-foreground">Catatan</label>
                    <p className="font-medium text-base">{stock.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Stok"
        description="Apakah Anda yakin ingin menghapus stok ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
