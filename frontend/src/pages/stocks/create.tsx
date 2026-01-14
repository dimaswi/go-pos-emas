import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { stocksApi, productsApi, locationsApi, storageBoxesApi, type Product, type Location, type StorageBox } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Package, Warehouse, Store, Box } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StockCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [storageBoxes, setStorageBoxes] = useState<StorageBox[]>([]);
  const [formData, setFormData] = useState({
    product_id: 0,
    location_id: 0,
    storage_box_id: 0,
    quantity: 1,
    supplier_name: '',
    notes: '',
  });

  useEffect(() => {
    setPageTitle('Tambah Stok');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, locationsRes] = await Promise.all([
        productsApi.getAll({ page_size: 1000 }),
        locationsApi.getAll({ page_size: 1000 }),
      ]);
      setProducts(productsRes.data.data || []);
      setLocations(locationsRes.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStorageBoxes = async (locationId: number) => {
    try {
      const response = await storageBoxesApi.getAll({ location_id: locationId, page_size: 1000 });
      setStorageBoxes(response.data.data || []);
    } catch (error) {
      setStorageBoxes([]);
    }
  };

  const handleLocationChange = (value: string) => {
    const locationId = parseInt(value) || 0;
    setFormData({ ...formData, location_id: locationId, storage_box_id: 0 });
    if (locationId > 0) {
      loadStorageBoxes(locationId);
    } else {
      setStorageBoxes([]);
    }
  };

  // Memoize options for searchable selects
  const productOptions = useMemo(() => {
    return products.map((product) => ({
      value: product.id.toString(),
      label: `${product.name} (${product.barcode})`,
      icon: <Package className="h-4 w-4" />,
      description: product.gold_category?.name,
    }));
  }, [products]);

  const locationOptions = useMemo(() => {
    return locations.map((location) => ({
      value: location.id.toString(),
      label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
      icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
    }));
  }, [locations]);

  const storageBoxOptions = useMemo(() => {
    return storageBoxes.map((box) => ({
      value: box.id.toString(),
      label: `${box.code} - ${box.name}`,
      icon: <Box className="h-4 w-4" />,
    }));
  }, [storageBoxes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await stocksApi.create(formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Stok berhasil ditambahkan.",
      });
      navigate('/stocks');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menambahkan stok.",
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
              onClick={() => navigate('/stocks')}
            >
              <ArrowLeft/>
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Tambah Stok</CardTitle>
              <CardDescription className="text-xs">Masukkan detail informasi stok baru</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product_id">Produk *</Label>
                <SearchableSelect
                  options={productOptions}
                  value={formData.product_id ? formData.product_id.toString() : ''}
                  onValueChange={(value) => setFormData({ ...formData, product_id: parseInt(value) || 0 })}
                  placeholder="Pilih produk"
                  searchPlaceholder="Cari produk..."
                  emptyMessage="Produk tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_id">Lokasi *</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={formData.location_id ? formData.location_id.toString() : ''}
                  onValueChange={handleLocationChange}
                  placeholder="Pilih lokasi"
                  searchPlaceholder="Cari lokasi..."
                  emptyMessage="Lokasi tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_box_id">Kotak Penyimpanan *</Label>
                <SearchableSelect
                  options={storageBoxOptions}
                  value={formData.storage_box_id ? formData.storage_box_id.toString() : '0'}
                  onValueChange={(value) => setFormData({ ...formData, storage_box_id: parseInt(value) || 0 })}
                  placeholder={storageBoxes.length === 0 ? "Tidak ada kotak" : "Pilih kotak"}
                  searchPlaceholder="Cari kotak..."
                  emptyMessage="Kotak tidak ditemukan."
                  disabled={!formData.location_id || storageBoxes.length === 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="Masukkan jumlah"
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">Nama Supplier</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="Masukkan nama supplier (opsional)"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Masukkan catatan (opsional)"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/stocks')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving || !formData.product_id || !formData.location_id || !formData.storage_box_id}>
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
