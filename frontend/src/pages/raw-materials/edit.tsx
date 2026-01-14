import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { rawMaterialsApi, goldCategoriesApi, locationsApi, membersApi, type RawMaterial, type GoldCategory, type Location, type Member } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, User, Building } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const conditionOptions = [
  { value: 'new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'scratched', label: 'Baret' },
  { value: 'dented', label: 'Penyok' },
  { value: 'damaged', label: 'Rusak' },
];

const statusOptions = [
  { value: 'available', label: 'Tersedia' },
  { value: 'processed', label: 'Diproses' },
  { value: 'sold', label: 'Terjual' },
];

export default function EditRawMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goldCategories, setGoldCategories] = useState<GoldCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [supplierType, setSupplierType] = useState<'member' | 'other'>('other');
  const [rawMaterial, setRawMaterial] = useState<RawMaterial | null>(null);

  const [formData, setFormData] = useState({
    gold_category_id: '',
    location_id: '',
    weight_gross: '',
    shrinkage_percent: '',
    weight_grams: '',
    purity: '',
    buy_price_per_gram: '',
    condition: 'like_new',
    status: 'available',
    supplier_name: '',
    member_id: '',
    notes: '',
  });

  useEffect(() => {
    setPageTitle('Edit Bahan Baku');
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoadingData(true);
    try {
      const [rawMaterialRes, categoriesRes, locationsRes, membersRes] = await Promise.all([
        rawMaterialsApi.getById(Number(id)),
        goldCategoriesApi.getAll({ page_size: 100 }),
        locationsApi.getAll({ page_size: 100 }),
        membersApi.getAll({ page_size: 100 }),
      ]);

      const rm = rawMaterialRes.data.data;
      setRawMaterial(rm);
      setGoldCategories(categoriesRes.data.data || []);
      setLocations(locationsRes.data.data || []);
      setMembers(membersRes.data.data || []);

      // Set form data from raw material
      setFormData({
        gold_category_id: rm.gold_category_id?.toString() || '',
        location_id: rm.location_id.toString(),
        weight_gross: rm.weight_gross?.toString() || rm.weight_grams.toString(),
        shrinkage_percent: rm.shrinkage_percent?.toString() || '0',
        weight_grams: rm.weight_grams.toString(),
        purity: rm.purity?.toString() || '',
        buy_price_per_gram: rm.buy_price_per_gram.toString(),
        condition: rm.condition,
        status: rm.status,
        supplier_name: rm.supplier_name || '',
        member_id: rm.member_id?.toString() || '',
        notes: rm.notes || '',
      });

      // Set supplier type
      if (rm.member_id) {
        setSupplierType('member');
      } else {
        setSupplierType('other');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data.",
      });
      navigate('/raw-materials');
    } finally {
      setLoadingData(false);
    }
  }, [id, toast, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location_id) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Pilih lokasi penyimpanan.",
      });
      return;
    }

    if (!formData.weight_grams || Number(formData.weight_grams) <= 0) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Masukkan berat yang valid.",
      });
      return;
    }

    if (!formData.buy_price_per_gram || Number(formData.buy_price_per_gram) <= 0) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Masukkan harga beli per gram.",
      });
      return;
    }

    setLoading(true);
    try {
      await rawMaterialsApi.update(Number(id), {
        gold_category_id: formData.gold_category_id ? Number(formData.gold_category_id) : undefined,
        location_id: Number(formData.location_id),
        weight_gross: Number(formData.weight_gross),
        shrinkage_percent: Number(formData.shrinkage_percent),
        weight_grams: Number(formData.weight_grams),
        purity: formData.purity ? Number(formData.purity) : undefined,
        buy_price_per_gram: Number(formData.buy_price_per_gram),
        condition: formData.condition as any,
        status: formData.status as any,
        supplier_name: supplierType === 'other' ? formData.supplier_name : undefined,
        member_id: supplierType === 'member' && formData.member_id ? Number(formData.member_id) : undefined,
        notes: formData.notes,
      });

      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Bahan baku berhasil diperbarui.",
      });
      navigate('/raw-materials');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memperbarui bahan baku.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const weight = Number(formData.weight_grams) || 0;
    const price = Number(formData.buy_price_per_gram) || 0;
    return weight * price;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rawMaterial) {
    return null;
  }

  // Cannot edit if not available
  if (rawMaterial.status !== 'available') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Bahan baku dengan status "{rawMaterial.status}" tidak dapat diedit.
            </p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/raw-materials')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Edit Bahan Baku</CardTitle>
              <CardDescription className="text-xs">
                Edit data bahan baku: {rawMaterial.code}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/raw-materials')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gold Category */}
              <div className="space-y-2">
                <Label htmlFor="gold_category_id">Kategori Emas</Label>
                <Select
                  value={formData.gold_category_id}
                  onValueChange={(value) => setFormData({ ...formData, gold_category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori emas (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {goldCategories.filter(c => c.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name} ({category.purity}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location_id">Lokasi Penyimpanan *</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(l => l.is_active).map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name} ({location.type === 'gudang' ? 'Gudang' : 'Toko'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weight Gross */}
              <div className="space-y-2">
                <Label htmlFor="weight_gross">Berat Kotor (gram) *</Label>
                <Input
                  id="weight_gross"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Contoh: 10.5"
                  value={formData.weight_gross}
                  onChange={(e) => {
                    const weightGross = Number(e.target.value) || 0;
                    const shrinkage = Number(formData.shrinkage_percent) || 0;
                    const weightNet = weightGross * (1 - shrinkage / 100);
                    setFormData({ 
                      ...formData, 
                      weight_gross: e.target.value,
                      weight_grams: weightNet.toFixed(2)
                    });
                  }}
                />
              </div>

              {/* Shrinkage */}
              <div className="space-y-2">
                <Label htmlFor="shrinkage_percent">Susut (%)</Label>
                <Input
                  id="shrinkage_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  placeholder="Contoh: 2"
                  value={formData.shrinkage_percent}
                  onChange={(e) => {
                    const shrinkage = Number(e.target.value) || 0;
                    const weightGross = Number(formData.weight_gross) || 0;
                    const weightNet = weightGross * (1 - shrinkage / 100);
                    setFormData({ 
                      ...formData, 
                      shrinkage_percent: e.target.value,
                      weight_grams: weightNet.toFixed(2)
                    });
                  }}
                />
              </div>

              {/* Weight Net */}
              <div className="space-y-2">
                <Label htmlFor="weight_grams">Berat Bersih (gram)</Label>
                <Input
                  id="weight_grams"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Dihitung otomatis"
                  value={formData.weight_grams}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Berat bersih dihitung otomatis dari berat kotor - susut</p>
              </div>

              {/* Purity */}
              <div className="space-y-2">
                <Label htmlFor="purity">Kadar/Purity (%)</Label>
                <Input
                  id="purity"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Contoh: 75"
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                />
              </div>

              {/* Buy Price Per Gram */}
              <div className="space-y-2">
                <Label htmlFor="buy_price_per_gram">Harga Beli per Gram (Rp) *</Label>
                <Input
                  id="buy_price_per_gram"
                  type="number"
                  min="0"
                  placeholder="Contoh: 850000"
                  value={formData.buy_price_per_gram}
                  onChange={(e) => setFormData({ ...formData, buy_price_per_gram: e.target.value })}
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Kondisi</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Harga Beli:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Supplier Section */}
            <div className="space-y-4">
              <Label>Sumber Bahan Baku</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={supplierType === 'member' ? 'default' : 'outline'}
                  onClick={() => setSupplierType('member')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Member
                </Button>
                <Button
                  type="button"
                  variant={supplierType === 'other' ? 'default' : 'outline'}
                  onClick={() => setSupplierType('other')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Supplier Lain
                </Button>
              </div>

              {supplierType === 'member' ? (
                <div className="space-y-2">
                  <Label htmlFor="member_id">Pilih Member</Label>
                  <Select
                    value={formData.member_id}
                    onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.filter(m => m.is_active).map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({member.member_code || member.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Nama Supplier</Label>
                  <Input
                    id="supplier_name"
                    placeholder="Nama supplier atau penjual"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/raw-materials')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
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
