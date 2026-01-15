import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { membersApi, api, type Member } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { columns } from './columns';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function MembersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');

  useEffect(() => {
    setPageTitle('Member');
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await membersApi.getAll({ page_size: 1000 });
      setMembers(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data member.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await membersApi.delete(deleteId);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Member berhasil dihapus.",
      });
      loadMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus member.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleRecalculateStats = async () => {
    setRecalculating(true);
    try {
      await api.post('/members/recalculate-stats');
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Statistik member berhasil dihitung ulang.",
      });
      loadMembers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghitung ulang statistik.",
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className='text-sm sm:text-base font-semibold'>Member</CardTitle>
              <CardDescription className='text-[10px] sm:text-xs'>
                Kelola data member dan poin
              </CardDescription>
            </div>
            {hasPermission('members.create') && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={handleRecalculateStats} disabled={recalculating}>
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Hitung Ulang</span>
                  <span className="xs:hidden">Hitung</span>
                </Button>
                <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => navigate('/members/create')}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Tambah Member</span>
                  <span className="xs:hidden">Tambah</span>
                </Button>
              </div>
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
              data={members}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Member"
        description={`Apakah Anda yakin ingin menghapus member "${deleteName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
