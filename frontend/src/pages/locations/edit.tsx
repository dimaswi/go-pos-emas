import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { locationsApi, type LocationType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Warehouse, Store } from 'lucide-react';

const locationTypes = [
  { value: 'gudang', label: 'Gudang', icon: Warehouse },
  { value: 'toko', label: 'Toko', icon: Store },
];
import { setPageTitle } from '@/lib/page-title';

export default function LocationEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'gudang' as LocationType,
    address: '',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    setPageTitle('Edit Lokasi');
    loadLocation();
  }, [id]);

  const loadLocation = async () => {
    try {
      const response = await locationsApi.getById(Number(id));
      const data = response.data.data;
      setFormData({
        code: data.code,
        name: data.name,
        type: data.type,
        address: data.address || '',
        phone: data.phone || '',
        is_active: data.is_active,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data lokasi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await locationsApi.update(Number(id), formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Lokasi berhasil diperbarui.",
      });
      navigate('/locations');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memperbarui lokasi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const locationTypeOptions = useMemo(() => 
    locationTypes.map(type => {
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">Edit Lokasi</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">Perbarui informasi lokasi</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/locations')}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Lokasi *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Contoh: GDG-01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lokasi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipe Lokasi *</Label>
                <SearchableSelect
                  options={locationTypeOptions}
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as LocationType })}
                  placeholder="Pilih tipe lokasi"
                  searchPlaceholder="Cari tipe..."
                  emptyMessage="Tipe tidak ditemukan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Masukkan nomor telepon"
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
                size="sm"
                onClick={() => navigate('/locations')}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Batal</span>
              </Button>
              <Button type="submit" size="sm" className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
