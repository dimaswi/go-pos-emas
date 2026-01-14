import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function MemberCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    setPageTitle('Tambah Member');
    generateCode();
  }, []);

  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    setFormData(prev => ({ ...prev, code: `MBR${timestamp}` }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await membersApi.create(formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Member berhasil ditambahkan.",
      });
      navigate('/members');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menambahkan member.",
      });
    } finally {
      setSaving(false);
    }
  };

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
              <CardTitle className="text-base font-semibold">Tambah Member</CardTitle>
              <CardDescription className="text-xs">Isi informasi member baru</CardDescription>
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
                  placeholder="Kode otomatis"
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

              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
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
