import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Coins,
  Clock,
  User,
  Save,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  priceUpdateApi,
  type GoldCategory,
  type User as UserType,
  type BulkPriceUpdateRequest,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface PriceUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PriceFormData {
  gold_category_id: number;
  code: string;
  name: string;
  current_buy_price: number;
  current_sell_price: number;
  new_buy_price: string;
  new_sell_price: string;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export function PriceUpdateModal({ open, onOpenChange, onSuccess }: PriceUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<UserType | null>(null);
  const [priceData, setPriceData] = useState<PriceFormData[]>([]);
  const [notes, setNotes] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApiError(null);
      checkPriceUpdate();
    }
  }, [open]);

  const checkPriceUpdate = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await priceUpdateApi.checkNeeded();
      const data = response.data.data;

      setNeedsUpdate(data.needs_update);
      setLastUpdate(data.last_update);
      setLastUpdatedBy(data.last_updated_by || null);

      // Initialize form data with current prices
      const formData: PriceFormData[] = data.gold_categories.map((cat: GoldCategory) => ({
        gold_category_id: cat.id,
        code: cat.code,
        name: cat.name,
        current_buy_price: cat.buy_price,
        current_sell_price: cat.sell_price,
        new_buy_price: cat.buy_price.toString(),
        new_sell_price: cat.sell_price.toString(),
      }));
      setPriceData(formData);
    } catch (error: any) {
      console.error('Failed to check price update:', error);
      if (error?.response?.status === 404) {
        setApiError('Fitur update harga belum tersedia. Silakan deploy backend terbaru terlebih dahulu.');
      } else {
        toast.error('Gagal memuat data harga emas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index: number, field: 'new_buy_price' | 'new_sell_price', value: string) => {
    const updated = [...priceData];
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    updated[index][field] = numericValue;
    setPriceData(updated);
  };

  const handleSubmit = async () => {
    // Validate all prices
    const hasInvalidPrice = priceData.some(
      (item) => !item.new_buy_price || !item.new_sell_price ||
      parseFloat(item.new_buy_price) <= 0 || parseFloat(item.new_sell_price) <= 0
    );

    if (hasInvalidPrice) {
      toast.error('Semua harga harus diisi dan lebih dari 0');
      return;
    }

    // Validate sell price >= buy price
    const hasInvalidMargin = priceData.some(
      (item) => parseFloat(item.new_sell_price) < parseFloat(item.new_buy_price)
    );

    if (hasInvalidMargin) {
      toast.error('Harga jual harus lebih besar atau sama dengan harga beli');
      return;
    }

    setSubmitting(true);
    try {
      const request: BulkPriceUpdateRequest = {
        prices: priceData.map((item) => ({
          gold_category_id: item.gold_category_id,
          buy_price: parseFloat(item.new_buy_price),
          sell_price: parseFloat(item.new_sell_price),
        })),
        notes: notes || `Update harga emas ${new Date().toLocaleDateString('id-ID')}`,
      };

      const response = await priceUpdateApi.bulkUpdate(request);
      toast.success('Harga emas berhasil diperbarui');

      // Update lastUpdate dan lastUpdatedBy dari response
      if (response.data?.data) {
        const updatedData = response.data.data;
        if (updatedData.created_at) {
          setLastUpdate(updatedData.created_at);
        }
        if (updatedData.updated_by) {
          setLastUpdatedBy(updatedData.updated_by);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update prices:', error);
      toast.error('Gagal memperbarui harga emas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-yellow-500" />
            Update Harga Emas Hari Ini
          </DialogTitle>
          <DialogDescription className="text-sm">
            Perbarui harga beli dan jual untuk semua kategori emas.
          </DialogDescription>
        </DialogHeader>

        {/* Last Update Info */}
        {lastUpdate && (
          <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Terakhir:</span>
              <span className="font-medium">
                {new Date(lastUpdate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {lastUpdatedBy && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs py-0">{lastUpdatedBy.full_name}</Badge>
              </div>
            )}
          </div>
        )}

        <Separator className="my-2" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : apiError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">{apiError}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              {/* Grid 3 kolom */}
              <div className="grid grid-cols-3 gap-3">
                {priceData.map((item, index) => {
                  const margin = (parseFloat(item.new_sell_price) || 0) - (parseFloat(item.new_buy_price) || 0);

                  return (
                    <div
                      key={item.gold_category_id}
                      className="p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                    >
                      {/* Header - Code & Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                          {item.code}
                        </Badge>
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>

                      {/* Buy Price */}
                      <div className="mb-2">
                        <Label className="text-xs text-muted-foreground">Harga Beli</Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(item.current_buy_price)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              Rp
                            </span>
                            <Input
                              type="text"
                              value={formatNumber(parseFloat(item.new_buy_price) || 0)}
                              onChange={(e) => handlePriceChange(index, 'new_buy_price', e.target.value)}
                              className="pl-7 h-8 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sell Price */}
                      <div className="mb-2">
                        <Label className="text-xs text-muted-foreground">Harga Jual</Label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(item.current_sell_price)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                              Rp
                            </span>
                            <Input
                              type="text"
                              value={formatNumber(parseFloat(item.new_sell_price) || 0)}
                              onChange={(e) => handlePriceChange(index, 'new_sell_price', e.target.value)}
                              className="pl-7 h-8 text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className={cn(
                        "text-xs text-center py-1 rounded",
                        margin >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                      )}>
                        Margin: {formatNumber(margin)}/g
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="mt-3 space-y-1">
                <Label htmlFor="notes" className="text-sm">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan untuk update harga ini..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {needsUpdate ? 'Nanti Saja' : 'Tutup'}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Harga
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
