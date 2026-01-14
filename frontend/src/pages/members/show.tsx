import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { membersApi, type Member } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2, Award, Star, User, Phone, Mail, MapPin, CreditCard, Wallet } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const memberTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  regular: { label: 'Regular', variant: 'outline' },
  silver: { label: 'Silver', variant: 'secondary' },
  gold: { label: 'Gold', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  platinum: { label: 'Platinum', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MemberShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Detail Member');
    loadMember();
  }, [id]);

  const loadMember = async () => {
    try {
      const response = await membersApi.getById(Number(id));
      setMember(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data member.",
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
      await membersApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Member berhasil dihapus.",
      });
      setTimeout(() => navigate('/members'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus member.",
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

  if (!member) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Member tidak ditemukan</p>
          <Button onClick={() => navigate('/members')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = memberTypeConfig[member.member_type] || { label: member.member_type, variant: 'outline' };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/members')}
              >
                <ArrowLeft />
              </Button>
              <div>
                <CardTitle className="text-base font-semibold">Detail Member</CardTitle>
                <CardDescription className="text-xs">Informasi lengkap member</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {hasPermission('members.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/members/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {hasPermission('members.delete') && (
                <Button 
                  variant="destructive"
                  size="sm"
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
            {/* Member Type Badge Section */}
            <div className="mb-8 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Kode Member</p>
                  <p className="font-mono text-xl font-bold">{member.code}</p>
                </div>
              </div>
              <Badge variant={typeConfig.variant} className={`text-sm ${typeConfig.className || ''}`}>
                <Star className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
            </div>

            {/* Points & Transaction Section */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Poin</p>
                    <p className="text-2xl font-bold">{member.points.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-2xl font-bold">{member.transaction_count || 0} kali</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Nilai</p>
                    <p className="text-lg font-bold">{formatCurrency((member.total_purchase || 0) + (member.total_sell || 0))}</p>
                    <p className="text-xs text-muted-foreground">
                      Beli: {formatCurrency(member.total_purchase || 0)} | Jual: {formatCurrency(member.total_sell || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="mb-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI PERSONAL
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                  <p className="font-medium text-base">{member.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Telepon</label>
                  <p className="font-medium text-base flex items-center gap-2">
                    {member.phone ? (
                      <>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {member.phone}
                      </>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium text-base flex items-center gap-2">
                    {member.email ? (
                      <>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {member.email}
                      </>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge 
                    variant={member.is_active ? "default" : "secondary"}
                    className="text-xs w-fit mt-1"
                  >
                    {member.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Additional Info */}
            <div className="mt-8">
              <CardTitle className="text-base text-muted-foreground font-normal mb-4">
                INFORMASI TAMBAHAN
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">Nomor KTP</label>
                  <p className="font-medium text-base">{member.id_card_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Alamat</label>
                  <p className="font-medium text-base flex items-start gap-2">
                    {member.address ? (
                      <>
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        {member.address}
                      </>
                    ) : '-'}
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
        title="Hapus Member"
        description="Apakah Anda yakin ingin menghapus member ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
