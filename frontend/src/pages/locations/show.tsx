import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { locationsApi, type Location } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2, Warehouse, Store, MapPin, Phone } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const typeConfig: Record<string, { label: string; icon: any }> = {
  gudang: { label: 'Gudang', icon: Warehouse },
  toko: { label: 'Toko', icon: Store },
};

export default function LocationShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Detail Lokasi');
    loadLocation();
  }, [id]);

  const loadLocation = async () => {
    try {
      const response = await locationsApi.getById(Number(id));
      setLocation(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data lokasi.",
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
      await locationsApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Lokasi berhasil dihapus.",
      });
      setTimeout(() => navigate('/locations'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus lokasi.",
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

  if (!location) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Lokasi tidak ditemukan</p>
          <Button onClick={() => navigate('/locations')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = typeConfig[location.type]?.icon || Warehouse;

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
                onClick={() => navigate('/locations')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Lokasi</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Informasi lengkap tentang lokasi</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('locations.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={() => navigate(`/locations/${id}/edit`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('locations.delete') && (
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
          {/* Type Badge Section */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-center gap-4">
            <TypeIcon className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tipe Lokasi</p>
              <Badge variant={location.type === 'gudang' ? 'default' : 'secondary'} className="text-sm">
                {typeConfig[location.type]?.label || location.type}
              </Badge>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Kode</label>
              <p className="font-mono font-medium text-base">{location.code}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nama</label>
              <p className="font-medium text-base">{location.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Telepon</label>
              <p className="font-medium text-base flex items-center gap-2">
                {location.phone ? (
                  <>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {location.phone}
                  </>
                ) : '-'}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Status</label>
              <div>
                <Badge 
                  variant={location.is_active ? "default" : "secondary"}
                  className="text-xs"
                >
                  {location.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                </Badge>
              </div>
            </div>
            {location.address && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-muted-foreground">Alamat</label>
                <p className="font-medium text-base flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  {location.address}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Lokasi"
        description="Apakah Anda yakin ingin menghapus lokasi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
