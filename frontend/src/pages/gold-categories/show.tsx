import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { goldCategoriesApi, type GoldCategory } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

// Format currency to IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function GoldCategoryShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [category, setCategory] = useState<GoldCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Detail Kategori Emas');
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await goldCategoriesApi.getById(Number(id));
      setCategory(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data kategori emas.",
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
      await goldCategoriesApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Kategori emas berhasil dihapus.",
      });
      setTimeout(() => navigate('/gold-categories'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus kategori emas.",
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

  if (!category) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Kategori emas tidak ditemukan</p>
          <Button onClick={() => navigate('/gold-categories')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/gold-categories')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <CardTitle className='text-base font-semibold'>Detail Kategori Emas</CardTitle>
            </div>
            <div className="flex gap-2">
              {hasPermission('gold-categories.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/gold-categories/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('gold-categories.delete') && (
                <Button 
                  variant="destructive"
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
            {/* Basic Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI KATEGORI
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Kode</label>
                  <p className="font-mono font-medium text-base">{category.code}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Nama</label>
                  <p className="font-medium text-base">{category.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Kemurnian</label>
                  <p className="font-medium text-base">{(category.purity * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge 
                    variant={category.is_active ? "default" : "secondary"}
                    className="text-xs w-fit mt-1"
                  >
                    {category.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Pricing Section */}
            <div className="my-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI HARGA
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Harga Beli per Gram</label>
                  <p className="font-medium text-base text-orange-600">{formatCurrency(category.buy_price)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Harga Jual per Gram</label>
                  <p className="font-medium text-base text-green-600">{formatCurrency(category.sell_price)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Margin per Gram</label>
                  <p className="font-medium text-base text-blue-600">
                    {formatCurrency(category.sell_price - category.buy_price)}
                  </p>
                </div>
              </div>
            </div>

            {category.description && (
              <>
                <hr className="border-border/50" />
                <div className="mt-8">
                  <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                    DESKRIPSI
                  </CardTitle>
                  <p className="text-sm">{category.description}</p>
                </div>
              </>
            )}
          </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Kategori Emas"
        description="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
