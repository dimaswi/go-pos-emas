import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { rawMaterialsApi, type RawMaterial } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { Loader2, ArrowLeft, Edit, Scale, MapPin, Calendar, User, Banknote } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: 'Tersedia', variant: 'default' },
  processed: { label: 'Diproses', variant: 'secondary' },
  sold: { label: 'Terjual', variant: 'outline' },
};

const conditionConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: 'Baru', variant: 'default' },
  like_new: { label: 'Seperti Baru', variant: 'default' },
  scratched: { label: 'Baret', variant: 'secondary' },
  dented: { label: 'Penyok', variant: 'secondary' },
  damaged: { label: 'Rusak', variant: 'destructive' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ShowRawMaterialPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [rawMaterial, setRawMaterial] = useState<RawMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Detail Bahan Baku');
  }, []);

  const loadRawMaterial = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await rawMaterialsApi.getById(Number(id));
      setRawMaterial(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data bahan baku.",
      });
      navigate('/raw-materials');
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  useEffect(() => {
    loadRawMaterial();
  }, [loadRawMaterial]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rawMaterial) {
    return null;
  }

  const statusCfg = statusConfig[rawMaterial.status] || { label: rawMaterial.status, variant: 'outline' };
  const conditionCfg = conditionConfig[rawMaterial.condition] || { label: rawMaterial.condition, variant: 'outline' };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Detail Bahan Baku</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Informasi lengkap bahan baku
              </CardDescription>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => navigate('/raw-materials')}>
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Kembali
              </Button>
              {hasPermission('raw-materials.update') && rawMaterial.status === 'available' && (
                <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => navigate(`/raw-materials/${id}/edit`)}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold font-mono">{rawMaterial.code}</h2>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Kode Bahan Baku</p>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <Badge variant={statusCfg.variant} className="text-[10px] sm:text-xs">{statusCfg.label}</Badge>
                <Badge variant={conditionCfg.variant}>{conditionCfg.label}</Badge>
              </div>
            </div>

            <Separator />

            {/* Main Info Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Berat Bersih</p>
                    <p className="text-lg font-semibold">{rawMaterial.weight_grams.toFixed(2)} gram</p>
                    {rawMaterial.shrinkage_percent > 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Berat kotor: {rawMaterial.weight_gross.toFixed(2)}g | Susut: {rawMaterial.shrinkage_percent}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5">
                    <span className="text-xs font-bold">%</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kadar/Purity</p>
                    <p className="text-lg font-semibold">
                      {rawMaterial.purity ? `${rawMaterial.purity}%` : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5">
                    <span className="text-xs font-bold">Au</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori Emas</p>
                    <p className="text-lg font-semibold">
                      {rawMaterial.gold_category?.name || '-'}
                      {rawMaterial.gold_category && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({rawMaterial.gold_category.purity}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi Penyimpanan</p>
                    <p className="text-lg font-semibold">
                      {rawMaterial.location?.name || '-'}
                      {rawMaterial.location && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({rawMaterial.location.type === 'gudang' ? 'Gudang' : 'Toko'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Harga Beli per Gram</p>
                    <p className="text-lg font-semibold">{formatCurrency(rawMaterial.buy_price_per_gram)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Harga Beli</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(rawMaterial.total_buy_price)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sumber/Supplier</p>
                    {rawMaterial.member ? (
                      <div>
                        <p className="text-lg font-semibold">{rawMaterial.member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Member: {rawMaterial.member.member_code || rawMaterial.member.code}
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">{rawMaterial.supplier_name || '-'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Diterima</p>
                    <p className="font-medium">{formatDate(rawMaterial.received_at)}</p>
                    {rawMaterial.received_by && (
                      <p className="text-sm text-muted-foreground">
                        Oleh: {rawMaterial.received_by.full_name || rawMaterial.received_by.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {rawMaterial.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <p className="bg-muted/50 p-4 rounded-lg">{rawMaterial.notes}</p>
                </div>
              </>
            )}

            {/* Processed Info */}
            {rawMaterial.processed_at && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Diproses</p>
                    <p className="font-medium">{formatDate(rawMaterial.processed_at)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Dibuat: {formatDate(rawMaterial.created_at)}</span>
              <span>Diperbarui: {formatDate(rawMaterial.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
