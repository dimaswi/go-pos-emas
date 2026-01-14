import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { productsApi, goldCategoriesApi, type GoldCategory, type ProductType, type ProductCategory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Tag, Scale, Gem, Shapes, Users } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const productTypes: { value: ProductType; label: string }[] = [
  { value: 'gelang', label: 'Gelang' },
  { value: 'cincin', label: 'Cincin' },
  { value: 'kalung', label: 'Kalung' },
  { value: 'anting', label: 'Anting' },
  { value: 'liontin', label: 'Liontin' },
  { value: 'other', label: 'Lainnya' },
];

const productCategories: { value: ProductCategory; label: string }[] = [
  { value: 'dewasa', label: 'Dewasa' },
  { value: 'anak', label: 'Anak-anak' },
  { value: 'unisex', label: 'Unisex' },
];

export default function ProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [goldCategories, setGoldCategories] = useState<GoldCategory[]>([]);
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

  useEffect(() => {
    setPageTitle("Edit Produk");
    loadGoldCategories();
    loadProduct();
  }, [id]);

  const loadGoldCategories = async () => {
    try {
      const response = await goldCategoriesApi.getAll();
      setGoldCategories(response.data.data);
    } catch (error) {
      console.error("Failed to load gold categories:", error);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await productsApi.getById(Number(id));
      const product = response.data.data;
      setFormData({
        name: product.name,
        type: product.type,
        category: product.category,
        gold_category_id: product.gold_category_id.toString(),
        weight: product.weight.toString(),
        description: product.description || "",
        ring_size: product.ring_size || "",
        bracelet_length: product.bracelet_length?.toString() || "",
        necklace_length: product.necklace_length?.toString() || "",
        earring_type: product.earring_type || "",
        is_active: product.is_active,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data produk.",
      });
    } finally {
      setLoadingData(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await productsApi.update(Number(id), {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        gold_category_id: parseInt(formData.gold_category_id),
        weight: parseFloat(formData.weight),
        description: formData.description,
        ring_size: formData.ring_size || undefined,
        bracelet_length: formData.bracelet_length ? parseFloat(formData.bracelet_length) : undefined,
        necklace_length: formData.necklace_length ? parseFloat(formData.necklace_length) : undefined,
        earring_type: formData.earring_type || undefined,
        is_active: formData.is_active,
      });
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Produk berhasil diperbarui.",
      });
      setTimeout(() => navigate("/products"), 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Gagal memperbarui produk.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
                  Edit Produk
                </CardTitle>
                <CardDescription className="text-xs">
                  Perbarui detail produk perhiasan
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
                    onValueChange={(value) => setFormData({ ...formData, gold_category_id: value })}
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
                    onValueChange={(value) => setFormData({ ...formData, type: value as ProductType })}
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
                    onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
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
              {formData.type === 'cincin' && (
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

              {formData.type === 'gelang' && (
                <div className="space-y-2">
                  <Label htmlFor="bracelet_length" className="text-xs font-medium">
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
                      setFormData({ ...formData, bracelet_length: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {formData.type === 'kalung' && (
                <div className="space-y-2">
                  <Label htmlFor="necklace_length" className="text-xs font-medium">
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
                      setFormData({ ...formData, necklace_length: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {formData.type === 'anting' && (
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}
