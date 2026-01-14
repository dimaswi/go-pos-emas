import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { locationsApi, type LocationType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, Warehouse, Store } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const locationTypes: { value: LocationType; label: string }[] = [
  { value: "gudang", label: "Gudang" },
  { value: "toko", label: "Toko" },
];

export default function LocationCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "gudang" as LocationType,
    address: "",
    phone: "",
    is_active: true,
  });

  useEffect(() => {
    setPageTitle("Tambah Lokasi");
  }, []);

  // Memoize options for searchable select
  const locationTypeOptions = useMemo(() => {
    return locationTypes.map((type) => ({
      value: type.value,
      label: type.label,
      icon:
        type.value === "gudang" ? (
          <Warehouse className="h-4 w-4" />
        ) : (
          <Store className="h-4 w-4" />
        ),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await locationsApi.create(formData);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Lokasi berhasil ditambahkan.",
      });
      navigate("/locations");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menambahkan lokasi.",
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
              onClick={() => navigate("/locations")}
            >
              <ArrowLeft/>
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">
                Tambah Lokasi
              </CardTitle>
              <CardDescription className="text-xs">
                Isi detail lokasi baru
              </CardDescription>
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Contoh: GDG-01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Masukkan nama lokasi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipe Lokasi *</Label>
                <SearchableSelect
                  options={locationTypeOptions}
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as LocationType })
                  }
                  placeholder="Pilih tipe"
                  searchPlaceholder="Cari tipe..."
                  emptyMessage="Tipe tidak ditemukan."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 md:col-span-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/locations")}
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
