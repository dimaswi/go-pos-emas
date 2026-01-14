import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { membersApi, type MemberType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, User, Award, Crown, Gem } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const memberTypes = [
  { value: 'regular', label: 'Regular', icon: User },
  { value: 'silver', label: 'Silver', icon: Award },
  { value: 'gold', label: 'Gold', icon: Crown },
  { value: 'platinum', label: 'Platinum', icon: Gem },
];

export default function MemberEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    id_card_number: '',
    member_type: 'regular' as MemberType,
    points: 0,
    is_active: true,
  });

  useEffect(() => {
    setPageTitle('Edit Member');
    loadMember();
  }, [id]);

  const loadMember = async () => {
    try {
      const response = await membersApi.getById(Number(id));
      const data = response.data.data;
      setFormData({
        code: data.code,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        id_card_number: data.id_card_number || '',
        member_type: data.member_type,
        points: data.points,
        is_active: data.is_active,
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await membersApi.update(Number(id), formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Member berhasil diperbarui.",
      });
      navigate('/members');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memperbarui member.",
      });
    } finally {
      setSaving(false);
    }
  };

  const memberTypeOptions = useMemo(() => 
    memberTypes.map(type => {
      const IconComponent = type.icon;
      return {
        value: type.value,
        label: type.label,
        icon: <IconComponent className="h-4 w-4" />,
      };
    }),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/members')}
            >
              <ArrowLeft />
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Edit Member</CardTitle>
              <CardDescription className="text-xs">Perbarui informasi member</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Member *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Kode member"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_card_number">Nomor KTP</Label>
                <Input
                  id="id_card_number"
                  value={formData.id_card_number}
                  onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                  placeholder="Masukkan nomor KTP"
                  maxLength={16}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member_type">Tipe Member *</Label>
                <SearchableSelect
                  options={memberTypeOptions}
                  value={formData.member_type}
                  onValueChange={(value) => setFormData({ ...formData, member_type: value as MemberType })}
                  placeholder="Pilih tipe member"
                  searchPlaceholder="Cari tipe..."
                  emptyMessage="Tipe tidak ditemukan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Poin</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  placeholder="Jumlah poin"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/members')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
