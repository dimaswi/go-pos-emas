import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { rawMaterialsApi, type RawMaterial } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { columns } from './columns';
import { Loader2 } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function RawMaterialsPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');

  useEffect(() => {
    setPageTitle('Bahan Baku');
  }, []);

  const loadRawMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const materialsResponse = await rawMaterialsApi.getAll({ limit: 1000 });
      setRawMaterials(materialsResponse.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data bahan baku.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRawMaterials();
  }, [loadRawMaterials]);

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await rawMaterialsApi.delete(deleteId);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Bahan baku berhasil dihapus.",
      });
      loadRawMaterials();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus bahan baku.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">Bahan Baku</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Emas dari setor pelanggan atau supplier
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-10">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns({ onDelete: handleDelete, hasPermission })}
          data={rawMaterials}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Bahan Baku"
        description={`Apakah Anda yakin ingin menghapus bahan baku "${deleteName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
