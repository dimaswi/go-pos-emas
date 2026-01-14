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
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className='text-base font-semibold'>Member</CardTitle>
              <CardDescription className='text-xs'>
                Kelola data member dan poin
              </CardDescription>
            </div>
            {hasPermission('members.create') && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRecalculateStats} disabled={recalculating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                  Hitung Ulang
                </Button>
                <Button onClick={() => navigate('/members/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Member
                </Button>
              </div>
            )}
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
