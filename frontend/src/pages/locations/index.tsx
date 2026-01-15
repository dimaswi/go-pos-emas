import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { locationsApi, type Location } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { columns } from './columns';
import { Plus, Loader2 } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function LocationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');

  useEffect(() => {
    setPageTitle('Lokasi');
  }, []);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await locationsApi.getAll({ page_size: 1000 });
      setLocations(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data lokasi.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await locationsApi.delete(deleteId);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Lokasi berhasil dihapus.",
      });
      loadLocations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus lokasi.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className='text-sm sm:text-base font-semibold'>Lokasi</CardTitle>
              <CardDescription className='text-[10px] sm:text-xs'>
                Kelola lokasi gudang dan toko
              </CardDescription>
            </div>
            {hasPermission('locations.create') && (
              <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto" onClick={() => navigate('/locations/create')}>
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Tambah Lokasi
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns({ onDelete: handleDelete, hasPermission })}
              data={locations}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Lokasi"
        description={`Apakah Anda yakin ingin menghapus lokasi "${deleteName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
