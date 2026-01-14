import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { storageBoxesApi, locationsApi, type Location } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Box, Warehouse, Store } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StorageBoxCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    location_id: 0,
    code: '',
    name: '',
    description: '',
    capacity: 0,
    is_active: true,
  });

  useEffect(() => {
    setPageTitle('Tambah Kotak Penyimpanan');
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsApi.getAll({ page_size: 1000 });
      setLocations(response.data.data || []);
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

  // Memoize location options for searchable select
  const locationOptions = useMemo(() => {
    return locations.map((location) => ({
      value: location.id.toString(),
      label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
      icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
    }));
  }, [locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location_id) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Silakan pilih lokasi terlebih dahulu.",
      });
      return;
    }

    setSaving(true);

    try {
      await storageBoxesApi.create(formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Kotak penyimpanan berhasil ditambahkan.",
      });
      navigate('/storage-boxes');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menambahkan kotak penyimpanan.",
      });
    } finally {
      setSaving(false);
    }
  };

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
              onClick={() => navigate('/storage-boxes')}
            >
              <ArrowLeft />
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Tambah Kotak Penyimpanan</CardTitle>
              <CardDescription className="text-xs">Buat kotak penyimpanan baru</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi Lokasi */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Lokasi Penyimpanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location_id">Lokasi (Gudang/Toko) *</Label>
                  <SearchableSelect
                    options={locationOptions}
                    value={formData.location_id ? formData.location_id.toString() : ''}
                    onValueChange={(value) => setFormData({ ...formData, location_id: parseInt(value) || 0 })}
                    placeholder="Pilih lokasi"
                    searchPlaceholder="Cari lokasi..."
                    emptyMessage="Lokasi tidak ditemukan."
                  />
                  <p className="text-xs text-muted-foreground">
                    Pilih gudang atau toko dimana kotak ini berada
                  </p>
                </div>
              </div>
            </div>

            {/* Informasi Kotak */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Box className="h-5 w-5" />
                Detail Kotak
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Kotak *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: RAK-A1, BOX-01"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Kode unik untuk identifikasi kotak (contoh: RAK-A1, KOTAK-B2)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kotak *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Rak A Baris 1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Kapasitas</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="0 = Tak terbatas"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jumlah maksimal item yang bisa disimpan (0 = tidak terbatas)
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi lokasi kotak, misalnya: Rak sebelah kiri pintu masuk"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/storage-boxes')}
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
