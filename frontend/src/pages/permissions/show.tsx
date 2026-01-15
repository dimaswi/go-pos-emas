import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { permissionsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

export default function PermissionShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { canPerform } = usePermission();
  const [permission, setPermission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Permission Details');
    loadPermission();
  }, [id]);

  const loadPermission = async () => {
    try {
      const response = await permissionsApi.getById(Number(id));
      setPermission(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load permission data.",
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
      await permissionsApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "Permission deleted successfully.",
      });
      setTimeout(() => navigate('/permissions'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete permission.",
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

  if (!permission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Permission not found</p>
          <Button onClick={() => navigate('/permissions')} className="mt-4">
            Back to Permissions
          </Button>
        </div>
      </div>
    );
  }

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
                onClick={() => navigate('/permissions')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Permission</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Lihat detail informasi permission</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {canPerform('role_management', 'update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={() => navigate(`/permissions/${id}/edit`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
              {canPerform('role_management', 'delete') && (
                <Button 
                  variant="destructive"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Hapus
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
            {/* Permission Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI PERMISSION
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Permission</label>
                  <p className="font-medium text-base font-mono">{permission.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Deskripsi</label>
                  <p className="text-muted-foreground text-sm">
                    {permission.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Kategori</label>
                  <p className="font-medium text-base">
                    {permission.name ? permission.name.split('.')[0] : '-'}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* System Information Section */}
            <div className="mt-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI SISTEM
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">ID Permission</label>
                  <p className="font-medium text-base">#{permission.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Dibuat Pada</label>
                  <p className="font-medium text-base">
                    {permission.created_at ? new Date(permission.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Terakhir Diubah</label>
                  <p className="font-medium text-base">
                    {permission.updated_at ? new Date(permission.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric', 
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Permission"
        description="Apakah Anda yakin ingin menghapus permission ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
