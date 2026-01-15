import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { rawMaterialsApi, type RawMaterial, type RawMaterialStats } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { columns } from './columns';
import { Loader2, Scale, DollarSign, Package } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function RawMaterialsPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [stats, setStats] = useState<RawMaterialStats | null>(null);
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
      const [materialsResponse, statsResponse] = await Promise.all([
        rawMaterialsApi.getAll({ limit: 1000 }),
        rawMaterialsApi.getStats(),
      ]);
      setRawMaterials(materialsResponse.data.data || []);
      setStats(statsResponse.data);
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
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-2 sm:gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Total Item</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-base sm:text-2xl font-bold">{stats.total_count}</div>
              <p className="text-[8px] sm:text-xs text-muted-foreground">Bahan baku</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Total Berat</CardTitle>
              <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-base sm:text-2xl font-bold">{stats.total_weight.toFixed(2)}<span className="text-xs sm:text-base">g</span></div>
              <p className="text-[8px] sm:text-xs text-muted-foreground">Tersimpan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium">Total Nilai</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-base sm:text-2xl font-bold truncate">{formatCurrency(stats.total_value)}</div>
              <p className="text-[8px] sm:text-xs text-muted-foreground">Pembelian</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Bahan Baku</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Emas dari setor pelanggan atau supplier
              </CardDescription>
            </div>
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
              data={rawMaterials}
            />
          )}
        </CardContent>
      </Card>

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
