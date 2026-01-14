import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { stocksApi, locationsApi, storageBoxesApi, type Location, type Stock, type StorageBox } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, ArrowRightLeft, Barcode, Warehouse, Store, Box } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StockTransfer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [toBoxes, setToBoxes] = useState<StorageBox[]>([]);
  const [formData, setFormData] = useState({
    stock_id: 0,
    from_location_id: 0,
    to_location_id: 0,
    to_box_id: 0,
    notes: '',
  });

  useEffect(() => {
    setPageTitle('Transfer Stok');
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

  const loadStocksByLocation = async (locationId: number) => {
    try {
      const response = await stocksApi.getAll({ location_id: locationId, page_size: 1000 });
      setStocks(response.data.data || []);
    } catch (error) {
      setStocks([]);
    }
  };

  const loadBoxesByLocation = async (locationId: number) => {
    try {
      const response = await storageBoxesApi.getAll({ location_id: locationId, page_size: 1000 });
      setToBoxes(response.data.data || []);
    } catch (error) {
      setToBoxes([]);
    }
  };

  const handleFromLocationChange = (value: string) => {
    const locationId = parseInt(value) || 0;
    setFormData({ ...formData, from_location_id: locationId, stock_id: 0 });
    if (locationId > 0) {
      loadStocksByLocation(locationId);
    } else {
      setStocks([]);
    }
  };

  const handleToLocationChange = (value: string) => {
    const locationId = parseInt(value) || 0;
    setFormData({ ...formData, to_location_id: locationId, to_box_id: 0 });
    if (locationId > 0) {
      loadBoxesByLocation(locationId);
    } else {
      setToBoxes([]);
    }
  };

  // Memoize options for searchable selects
  const locationOptions = useMemo(() => {
    return locations.map((location) => ({
      value: location.id.toString(),
      label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
      icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
    }));
  }, [locations]);

  const toLocationOptions = useMemo(() => {
    return locations
      .filter(loc => loc.id !== formData.from_location_id)
      .map((location) => ({
        value: location.id.toString(),
        label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
        icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
      }));
  }, [locations, formData.from_location_id]);

  const stockOptions = useMemo(() => {
    return stocks.map((stock) => ({
      value: stock.id.toString(),
      label: `${stock.product?.name} - SN: ${stock.serial_number}`,
      icon: <Barcode className="h-4 w-4" />,
      description: `${stock.product?.gold_category?.name} | ${stock.product?.barcode}`,
    }));
  }, [stocks]);

  const toBoxOptions = useMemo(() => {
    return toBoxes.map((box) => ({
      value: box.id.toString(),
      label: box.code,
      icon: <Box className="h-4 w-4" />,
      description: box.description,
    }));
  }, [toBoxes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await stocksApi.transfer(formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Stok berhasil ditransfer.",
      });
      navigate('/stocks');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal mentransfer stok.",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedStock = stocks.find(s => s.id === formData.stock_id);

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
              <ArrowLeft />
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Transfer Stok</CardTitle>
              <CardDescription className="text-xs">Pindahkan stok dari satu lokasi ke lokasi lain</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="from_location_id">Dari Lokasi *</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={formData.from_location_id ? formData.from_location_id.toString() : ''}
                  onValueChange={handleFromLocationChange}
                  placeholder="Pilih lokasi asal"
                  searchPlaceholder="Cari lokasi..."
                  emptyMessage="Lokasi tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_location_id">Ke Lokasi *</Label>
                <SearchableSelect
                  options={toLocationOptions}
                  value={formData.to_location_id ? formData.to_location_id.toString() : ''}
                  onValueChange={handleToLocationChange}
                  placeholder="Pilih lokasi tujuan"
                  searchPlaceholder="Cari lokasi..."
                  emptyMessage="Lokasi tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_box_id">Kotak Penyimpanan Tujuan *</Label>
                <SearchableSelect
                  options={toBoxOptions}
                  value={formData.to_box_id ? formData.to_box_id.toString() : ''}
                  onValueChange={(value) => setFormData({ ...formData, to_box_id: parseInt(value) || 0 })}
                  placeholder={toBoxes.length === 0 ? "Pilih lokasi dulu" : "Pilih kotak penyimpanan"}
                  searchPlaceholder="Cari kotak..."
                  emptyMessage="Kotak tidak ditemukan."
                  disabled={!formData.to_location_id || toBoxes.length === 0}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stock_id">Pilih Stok *</Label>
                <SearchableSelect
                  options={stockOptions}
                  value={formData.stock_id ? formData.stock_id.toString() : ''}
                  onValueChange={(value) => setFormData({ ...formData, stock_id: parseInt(value) || 0 })}
                  placeholder={stocks.length === 0 ? "Tidak ada stok tersedia" : "Pilih stok"}
                  searchPlaceholder="Cari stok..."
                  emptyMessage="Stok tidak ditemukan."
                  disabled={!formData.from_location_id || stocks.length === 0}
                />
              </div>

              {selectedStock && (
                <div className="md:col-span-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Barcode className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedStock.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Serial: {selectedStock.serial_number} | Barcode: {selectedStock.product?.barcode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Kategori: {selectedStock.product?.gold_category?.name} | Berat: {selectedStock.product?.weight}g
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan transfer (opsional)"
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
              <Button 
                type="submit" 
                disabled={saving || !formData.stock_id || !formData.to_location_id || !formData.to_box_id}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Stok
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
