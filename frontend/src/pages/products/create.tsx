import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  productsApi,
  goldCategoriesApi,
  locationsApi,
  storageBoxesApi,
  stocksApi,
  type GoldCategory,
  type ProductType,
  type ProductCategory,
  type Location,
  type StorageBox,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Tag,
  Scale,
  Gem,
  Users,
  Shapes,
  Package,
  Warehouse,
  Store,
  Box,
  Plus,
  Trash2,
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const productTypes: { value: ProductType; label: string }[] = [
  { value: "gelang", label: "Gelang" },
  { value: "cincin", label: "Cincin" },
  { value: "kalung", label: "Kalung" },
  { value: "anting", label: "Anting" },
  { value: "liontin", label: "Liontin" },
  { value: "other", label: "Lainnya" },
];

const productCategories: { value: ProductCategory; label: string }[] = [
  { value: "dewasa", label: "Dewasa" },
  { value: "anak", label: "Anak-anak" },
  { value: "unisex", label: "Unisex" },
];

interface StockEntry {
  id: string;
  location_id: string;
  storage_box_id: string;
  quantity: string;
  storageBoxes: StorageBox[];
}

export default function ProductCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goldCategories, setGoldCategories] = useState<GoldCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [addStock, setAddStock] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "gelang" as ProductType,
    category: "dewasa" as ProductCategory,
    gold_category_id: "",
    weight: "",
    description: "",
    ring_size: "",
    bracelet_length: "",
    necklace_length: "",
    earring_type: "",
    is_active: true,
  });
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([
    { id: crypto.randomUUID(), location_id: "", storage_box_id: "", quantity: "1", storageBoxes: [] }
  ]);
  const [supplierName, setSupplierName] = useState("");
  const [stockNotes, setStockNotes] = useState("");

  useEffect(() => {
    setPageTitle("Tambah Produk");
    loadGoldCategories();
    loadLocations();
  }, []);

  const loadGoldCategories = async () => {
    try {
      const response = await goldCategoriesApi.getAll();
      setGoldCategories(response.data.data.filter((c) => c.is_active));
    } catch (error) {
      console.error("Failed to load gold categories:", error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await locationsApi.getAll({ page_size: 1000 });
      setLocations(response.data.data || []);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  const loadStorageBoxesForEntry = async (entryId: string, locationId: number) => {
    try {
      const response = await storageBoxesApi.getAll({ location_id: locationId, page_size: 1000 });
      setStockEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, storageBoxes: response.data.data || [] }
          : entry
      ));
    } catch (error) {
      setStockEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, storageBoxes: [] }
          : entry
      ));
    }
  };

  const handleEntryLocationChange = (entryId: string, value: string) => {
    setStockEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, location_id: value, storage_box_id: "", storageBoxes: [] }
        : entry
    ));
    if (value) {
      loadStorageBoxesForEntry(entryId, parseInt(value));
    }
  };

  const handleEntryChange = (entryId: string, field: keyof StockEntry, value: string) => {
    setStockEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, [field]: value }
        : entry
    ));
  };

  const addStockEntry = () => {
    setStockEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      location_id: "",
      storage_box_id: "",
      quantity: "1",
      storageBoxes: []
    }]);
  };

  const removeStockEntry = (entryId: string) => {
    if (stockEntries.length > 1) {
      setStockEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  // Memoize options for searchable selects
  const goldCategoryOptions = useMemo(() => {
    return goldCategories.map((cat) => ({
      value: cat.id.toString(),
      label: `${cat.code} - ${cat.name}`,
      icon: <Gem className="h-4 w-4" />,
      description: `Kemurnian: ${cat.purity}%`,
    }));
  }, [goldCategories]);

  const productTypeOptions = useMemo(() => {
    return productTypes.map((type) => ({
      value: type.value,
      label: type.label,
      icon: <Shapes className="h-4 w-4" />,
    }));
  }, []);

  const productCategoryOptions = useMemo(() => {
    return productCategories.map((cat) => ({
      value: cat.value,
      label: cat.label,
      icon: <Users className="h-4 w-4" />,
    }));
  }, []);

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.id.toString(),
      label: loc.name,
      icon: loc.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
      description: loc.type === 'gudang' ? 'Gudang' : 'Toko',
    }));
  }, [locations]);

  const getStorageBoxOptions = (entry: StockEntry) => {
    return entry.storageBoxes.map((box) => ({
      value: box.id.toString(),
      label: box.code,
      icon: <Box className="h-4 w-4" />,
      description: box.description,
    }));
  };

  const isStockValid = () => {
    return stockEntries.every(entry => entry.location_id && entry.storage_box_id && parseInt(entry.quantity) > 0);
  };

  const getTotalStockCount = () => {
    return stockEntries.reduce((sum, entry) => sum + (parseInt(entry.quantity) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create product first
      const productResponse = await productsApi.create({
        name: formData.name,
        type: formData.type,
        category: formData.category,
        gold_category_id: parseInt(formData.gold_category_id),
        weight: parseFloat(formData.weight),
        description: formData.description,
        ring_size: formData.ring_size || undefined,
        bracelet_length: formData.bracelet_length
          ? parseFloat(formData.bracelet_length)
          : undefined,
        necklace_length: formData.necklace_length
          ? parseFloat(formData.necklace_length)
          : undefined,
        earring_type: formData.earring_type || undefined,
        is_active: formData.is_active,
      });

      // If addStock is checked, create stocks for all entries
      if (addStock && productResponse.data.data) {
        const productId = productResponse.data.data.id;
        let totalCreated = 0;
        
        for (const entry of stockEntries) {
          const response = await stocksApi.create({
            product_id: productId,
            location_id: parseInt(entry.location_id),
            storage_box_id: parseInt(entry.storage_box_id),
            quantity: parseInt(entry.quantity) || 1,
            supplier_name: supplierName || undefined,
            notes: stockNotes || undefined,
          });
          totalCreated += response.data.count || parseInt(entry.quantity) || 1;
        }
        
        toast({
          variant: "success",
          title: "Berhasil!",
          description: `Produk dan ${totalCreated} stok di ${stockEntries.length} lokasi berhasil ditambahkan.`,
        });
      } else {
        toast({
          variant: "success",
          title: "Berhasil!",
          description: "Produk berhasil ditambahkan.",
        });
      }
      
      setTimeout(() => navigate("/products"), 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Gagal menambahkan produk.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center gap-4">
            <div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/products")}
                className="h-9 w-9"
              >
                <ArrowLeft/>
              </Button>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Tambah Produk Baru
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan detail produk perhiasan baru
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Nama Produk
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Contoh: Gelang Emas Ukir"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="gold_category_id"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Gem className="h-3.5 w-3.5 text-muted-foreground" />
                  Kualitas Emas
                </Label>
                <SearchableSelect
                  options={goldCategoryOptions}
                  value={formData.gold_category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gold_category_id: value })
                  }
                  placeholder="Pilih Kualitas Emas"
                  searchPlaceholder="Cari kualitas emas..."
                  emptyMessage="Kualitas emas tidak ditemukan."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-medium">
                  Tipe Perhiasan
                </Label>
                <SearchableSelect
                  options={productTypeOptions}
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as ProductType })
                  }
                  placeholder="Pilih Tipe"
                  searchPlaceholder="Cari tipe..."
                  emptyMessage="Tipe tidak ditemukan."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium">
                  Kategori
                </Label>
                <SearchableSelect
                  options={productCategoryOptions}
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as ProductCategory,
                    })
                  }
                  placeholder="Pilih Kategori"
                  searchPlaceholder="Cari kategori..."
                  emptyMessage="Kategori tidak ditemukan."
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  Berat (gram)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Contoh: 5.50"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Dynamic specifications based on type */}
            {formData.type === "cincin" && (
              <div className="space-y-2">
                <Label htmlFor="ring_size" className="text-xs font-medium">
                  Ukuran Cincin / Lingkar Jari
                </Label>
                <Input
                  id="ring_size"
                  placeholder="Contoh: 15, 16, 17"
                  value={formData.ring_size}
                  onChange={(e) =>
                    setFormData({ ...formData, ring_size: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            )}

            {formData.type === "gelang" && (
              <div className="space-y-2">
                <Label
                  htmlFor="bracelet_length"
                  className="text-xs font-medium"
                >
                  Panjang Gelang (cm)
                </Label>
                <Input
                  id="bracelet_length"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 18.5"
                  value={formData.bracelet_length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bracelet_length: e.target.value,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
            )}

            {formData.type === "kalung" && (
              <div className="space-y-2">
                <Label
                  htmlFor="necklace_length"
                  className="text-xs font-medium"
                >
                  Panjang Kalung (cm)
                </Label>
                <Input
                  id="necklace_length"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 45"
                  value={formData.necklace_length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      necklace_length: e.target.value,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
            )}

            {formData.type === "anting" && (
              <div className="space-y-2">
                <Label htmlFor="earring_type" className="text-xs font-medium">
                  Tipe Anting
                </Label>
                <Input
                  id="earring_type"
                  placeholder="Contoh: Tusuk, Jepit, Gantung"
                  value={formData.earring_type}
                  onChange={(e) =>
                    setFormData({ ...formData, earring_type: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-medium">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi produk (opsional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active" className="text-sm">
                Aktif
              </Label>
            </div>

            {/* Add Stock Section */}
            <div className="border-t pt-5 mt-5">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="add_stock"
                  checked={addStock}
                  onCheckedChange={(checked) => setAddStock(checked === true)}
                />
                <Label htmlFor="add_stock" className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Tambahkan Stok Sekaligus
                </Label>
              </div>

              {addStock && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Stok akan dibuat otomatis setelah produk berhasil ditambahkan. Total: <strong>{getTotalStockCount()} item</strong> di <strong>{stockEntries.length} lokasi</strong>
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStockEntry}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Lokasi
                    </Button>
                  </div>

                  {/* Stock Entries */}
                  <div className="space-y-4">
                    {stockEntries.map((entry, index) => (
                      <div key={entry.id} className="bg-background p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Lokasi {index + 1}</span>
                          {stockEntries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStockEntry(entry.id)}
                              className="h-7 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Lokasi *</Label>
                            <SearchableSelect
                              options={locationOptions}
                              value={entry.location_id}
                              onValueChange={(value) => handleEntryLocationChange(entry.id, value)}
                              placeholder="Pilih Lokasi"
                              searchPlaceholder="Cari lokasi..."
                              emptyMessage="Lokasi tidak ditemukan."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Kotak Penyimpanan *</Label>
                            <SearchableSelect
                              options={getStorageBoxOptions(entry)}
                              value={entry.storage_box_id}
                              onValueChange={(value) => handleEntryChange(entry.id, 'storage_box_id', value)}
                              placeholder={entry.storageBoxes.length === 0 ? "Pilih lokasi dulu" : "Pilih Kotak"}
                              searchPlaceholder="Cari kotak..."
                              emptyMessage="Kotak tidak ditemukan."
                              disabled={!entry.location_id || entry.storageBoxes.length === 0}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Jumlah Item *</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={entry.quantity}
                              onChange={(e) => handleEntryChange(entry.id, 'quantity', e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Common Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="supplier_name" className="text-xs font-medium">
                        Nama Supplier (untuk semua)
                      </Label>
                      <Input
                        id="supplier_name"
                        placeholder="Nama supplier (opsional)"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_notes" className="text-xs font-medium">
                        Catatan Stok (untuk semua)
                      </Label>
                      <Input
                        id="stock_notes"
                        placeholder="Catatan stok (opsional)"
                        value={stockNotes}
                        onChange={(e) => setStockNotes(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/products")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading || (addStock && !isStockValid())}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {addStock ? `Simpan Produk & ${getTotalStockCount()} Stok` : "Simpan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
