import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const navigate = useNavigate();
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
    <div className="p-6 space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count}</div>
              <p className="text-xs text-muted-foreground">Bahan baku tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Berat</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_weight.toFixed(2)} gram</div>
              <p className="text-xs text-muted-foreground">Emas tersimpan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_value)}</div>
              <p className="text-xs text-muted-foreground">Nilai pembelian</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Bahan Baku (Raw Material)</CardTitle>
              <CardDescription className="text-xs">
                Bahan baku emas dari setor emas pelanggan atau supplier
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
