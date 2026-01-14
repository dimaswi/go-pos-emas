import { useState, useEffect } from "react";
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
import { goldCategoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Hash, Tag, Percent, Coins } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function GoldCategoryEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    purity: "",
    buy_price: "",
    sell_price: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    setPageTitle("Edit Kategori Emas");
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await goldCategoriesApi.getById(Number(id));
      const category = response.data.data;
      setFormData({
        code: category.code,
        name: category.name,
        purity: category.purity.toString(),
        buy_price: category.buy_price.toString(),
        sell_price: category.sell_price.toString(),
        description: category.description || "",
        is_active: category.is_active,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data kategori emas.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await goldCategoriesApi.update(Number(id), {
        code: formData.code,
        name: formData.name,
        purity: parseFloat(formData.purity),
        buy_price: parseFloat(formData.buy_price),
        sell_price: parseFloat(formData.sell_price),
        description: formData.description,
        is_active: formData.is_active,
      });
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Kategori emas berhasil diperbarui.",
      });
      setTimeout(() => navigate("/gold-categories"), 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui kategori emas.",
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
                onClick={() => navigate("/gold-categories")}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Edit Kategori Emas
              </CardTitle>
              <CardDescription className="text-xs">Perbarui detail kategori emas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Kode
                </Label>
                <Input
                  id="code"
                  required
                  placeholder="Contoh: 750, 916, 999"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Nama
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Contoh: 18K, 22K, 24K"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="purity"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  Kemurnian (0-1)
                </Label>
                <Input
                  id="purity"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  required
                  placeholder="Contoh: 0.750"
                  value={formData.purity}
                  onChange={(e) =>
                    setFormData({ ...formData, purity: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="buy_price"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Harga Beli per Gram
                </Label>
                <Input
                  id="buy_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Contoh: 800000"
                  value={formData.buy_price}
                  onChange={(e) =>
                    setFormData({ ...formData, buy_price: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="sell_price"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Harga Jual per Gram
                </Label>
                <Input
                  id="sell_price"
                  type="number"
                  min="0"
                  required
                  placeholder="Contoh: 850000"
                  value={formData.sell_price}
                  onChange={(e) =>
                    setFormData({ ...formData, sell_price: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-medium">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi kategori emas (opsional)"
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
                onClick={() => navigate("/gold-categories")}
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
