import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { rolesApi } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2
} from 'lucide-react';

export default function RoleShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Role Details');
    loadRole();
  }, [id]);

  const loadRole = async () => {
    try {
      const response = await rolesApi.getById(Number(id));
      setRole(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load role data.",
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
      await rolesApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "Role deleted successfully.",
      });
      setTimeout(() => navigate('/roles'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete role.",
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

  if (!role) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Role not found</p>
          <Button onClick={() => navigate('/roles')} className="mt-4">
            Back to Roles
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
                onClick={() => navigate('/roles')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Role</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Lihat detail informasi role</CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('roles.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                  onClick={() => navigate(`/roles/${id}/edit`)}
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('roles.delete') && (
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
            {/* Role Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI ROLE
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Role</label>
                  <p className="font-medium text-base">{role.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Deskripsi</label>
                  <p className="text-muted-foreground text-sm">
                    {role.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Total Permission</label>
                  <p className="font-medium text-base">{role.permissions?.length || 0} permission</p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* System Information Section */}
            <div className="my-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI SISTEM
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">ID Role</label>
                  <p className="font-medium text-base">#{role.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Dibuat Pada</label>
                  <p className="font-medium text-base">
                    {role.created_at ? new Date(role.created_at).toLocaleDateString('id-ID', {
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
                    {role.updated_at ? new Date(role.updated_at).toLocaleDateString('id-ID', {
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

            {/* Permissions Section */}
            <hr className="border-border/50" />
            <div className="mt-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                DAFTAR PERMISSION
              </CardTitle>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="space-y-2">
                  {role.permissions.map((perm: any, index: number) => (
                    <div 
                      key={perm.id} 
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-mono font-medium">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Tidak ada permission yang diberikan</p>
                  {hasPermission('roles.update') && (
                    <Button 
                      onClick={() => navigate(`/roles/${id}/edit`)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Kelola Permission
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Role"
        description="Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
