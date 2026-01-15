import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productsApi, type Product } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2, Barcode } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const productTypeLabels: Record<string, string> = {
  gelang: 'Gelang',
  cincin: 'Cincin',
  kalung: 'Kalung',
  anting: 'Anting',
  liontin: 'Liontin',
  other: 'Lainnya',
};

const categoryLabels: Record<string, string> = {
  dewasa: 'Dewasa',
  anak: 'Anak-anak',
  unisex: 'Unisex',
};

// Format currency to IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ProductShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Detail Produk');
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const response = await productsApi.getById(Number(id));
      setProduct(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data produk.",
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
      await productsApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Produk berhasil dihapus.",
      });
      setTimeout(() => navigate('/products'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus produk.",
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

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Produk tidak ditemukan</p>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const estimatedSellPrice = product.gold_category 
    ? product.gold_category.sell_price * product.weight 
    : 0;

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
                onClick={() => navigate('/products')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Produk</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Lihat detail informasi produk</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('products.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={() => navigate(`/products/${id}/edit`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('products.delete') && (
                <Button 
                  variant="destructive"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
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
          {/* Barcode Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-background rounded-lg shadow-sm">
                <Barcode className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barcode</p>
                <p className="text-2xl font-mono font-bold">{product.barcode}</p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="mb-8">
            <CardTitle className="text-base text-muted-foreground font-normal mb-4">
              INFORMASI PRODUK
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">Nama Produk</label>
                <p className="font-medium text-base">{product.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipe Perhiasan</label>
                <Badge variant="outline" className="mt-1">
                  {productTypeLabels[product.type] || product.type}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Kategori</label>
                <Badge variant="secondary" className="mt-1">
                  {categoryLabels[product.category] || product.category}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <Badge 
                  variant={product.is_active ? "default" : "secondary"}
                  className="text-xs w-fit mt-1"
                >
                  {product.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                </Badge>
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Gold & Weight Section */}
          <div className="my-8">
            <CardTitle className="text-base text-muted-foreground font-normal mb-4">
              KUALITAS & BERAT
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">Kualitas Emas</label>
                <p className="font-medium text-base">
                  {product.gold_category?.code} - {product.gold_category?.name}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Kemurnian</label>
                <p className="font-medium text-base">
                  {product.gold_category ? (product.gold_category.purity * 100).toFixed(1) : '-'}%
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Berat</label>
                <p className="font-medium text-base">{product.weight.toFixed(2)} gram</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Est. Harga Jual</label>
                <p className="font-medium text-base text-green-600">
                  {formatCurrency(estimatedSellPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          {(product.ring_size || product.bracelet_length || product.necklace_length || product.earring_type) && (
            <>
              <hr className="border-border/50" />
              <div className="my-8">
                <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                  SPESIFIKASI
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {product.ring_size && (
                    <div>
                      <label className="text-sm text-muted-foreground">Ukuran Cincin</label>
                      <p className="font-medium text-base">{product.ring_size}</p>
                    </div>
                  )}
                  {product.bracelet_length && (
                    <div>
                      <label className="text-sm text-muted-foreground">Panjang Gelang</label>
                      <p className="font-medium text-base">{product.bracelet_length} cm</p>
                    </div>
                  )}
                  {product.necklace_length && (
                    <div>
                      <label className="text-sm text-muted-foreground">Panjang Kalung</label>
                      <p className="font-medium text-base">{product.necklace_length} cm</p>
                    </div>
                  )}
                  {product.earring_type && (
                    <div>
                      <label className="text-sm text-muted-foreground">Tipe Anting</label>
                      <p className="font-medium text-base">{product.earring_type}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {product.description && (
            <>
              <hr className="border-border/50" />
              <div className="mt-8">
                <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                  DESKRIPSI
                </CardTitle>
                <p className="text-sm">{product.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Produk"
        description="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
