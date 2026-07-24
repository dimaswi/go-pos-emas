import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usersApi } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2
} from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function UserShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('User Details');
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await usersApi.getById(Number(id));
      setUser(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load user data.",
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
      await usersApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "User deleted successfully.",
      });
      setTimeout(() => navigate('/users'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete user.",
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">User not found</p>
          <Button onClick={() => navigate('/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex items-center gap-4">
            <div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/users')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-semibold truncate">Detail User</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs truncate">{user.full_name}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasPermission('users.update') && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
                    onClick={() => navigate(`/users/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                {hasPermission('users.delete') && (
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Hapus</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
            {/* User Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI USER
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                  <p className="font-medium text-base">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Username</label>
                  <p className="font-medium text-base">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium text-base">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge 
                    variant={user.is_active ? "default" : "secondary"}
                    className="text-xs w-fit mt-1"
                  >
                    {user.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Role Information Section */}
            <div className="my-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI ROLE
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Role</label>
                  <p className="font-medium text-base">{user.role?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Deskripsi Role</label>
                  <p className="text-muted-foreground text-sm">
                    {user.role?.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                {user.role?.permissions && (
                  <div>
                    <label className="text-sm text-muted-foreground">Total Permission</label>
                    <p className="font-medium text-base">{user.role.permissions.length} permission</p>
                  </div>
                )}
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
                  <label className="text-sm text-muted-foreground">ID User</label>
                  <p className="font-medium text-base">#{user.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Dibuat Pada</label>
                  <p className="font-medium text-base">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
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
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString('id-ID', {
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
            {user.role?.permissions && user.role.permissions.length > 0 && (
              <>
                <hr className="border-border/50" />
                <div className="mt-8">
                  <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                    DAFTAR PERMISSION
                  </CardTitle>
                  <div className="space-y-2">
                    {user.role.permissions.map((perm: any, index: number) => (
                      <div 
                        key={perm.id} 
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0"
                      >
                        <span className="text-sm font-mono">{perm.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus User"
        description="Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
