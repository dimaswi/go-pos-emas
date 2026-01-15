import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { storageBoxesApi, stocksApi, type StorageBox, type Stock } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Box, 
  Warehouse, 
  Store, 
  Package,
  MapPin,
  Hash,
  Calendar,
  Info,
  Layers
} from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StorageBoxShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(true);
  const [storageBox, setStorageBox] = useState<StorageBox | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Detail Kotak Penyimpanan');
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const response = await storageBoxesApi.getById(Number(id));
      setStorageBox(response.data.data);
      loadStocks();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data kotak penyimpanan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStocks = async () => {
    setStocksLoading(true);
    try {
      const response = await stocksApi.getAll({ 
        storage_box_id: Number(id), 
        status: 'available',
        page_size: 100 
      });
      setStocks(response.data.data || []);
    } catch (error) {
      console.error('Failed to load stocks:', error);
    } finally {
      setStocksLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!storageBox) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Kotak penyimpanan tidak ditemukan.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/storage-boxes')}
            >
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      {/* Header Card */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={() => navigate('/storage-boxes')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Box className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Kotak Penyimpanan</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">{storageBox.code} - {storageBox.name}</CardDescription>
              </div>
            </div>
            {hasPermission('locations.update') && (
              <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto" onClick={() => navigate(`/storage-boxes/${id}/edit`)}>
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Kode */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kode Kotak</p>
                <p className="font-mono font-semibold text-lg">{storageBox.code}</p>
              </div>
            </div>

            {/* Nama */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama Kotak</p>
                <p className="font-semibold text-lg">{storageBox.name}</p>
              </div>
            </div>

            {/* Lokasi */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lokasi</p>
                {storageBox.location ? (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{storageBox.location.name}</p>
                    <Badge variant={storageBox.location.type === 'gudang' ? 'default' : 'secondary'}>
                      {storageBox.location.type === 'gudang' ? (
                        <><Warehouse className="h-3 w-3 mr-1" />Gudang</>
                      ) : (
                        <><Store className="h-3 w-3 mr-1" />Toko</>
                      )}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </div>

            {/* Kapasitas */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kapasitas</p>
                <p className="font-semibold">
                  {storageBox.capacity > 0 ? `${storageBox.capacity} item` : 'Tak terbatas'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={storageBox.is_active ? 'default' : 'secondary'}>
                  {storageBox.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </div>
            </div>

            {/* Dibuat */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibuat</p>
                <p className="font-semibold">
                  {new Date(storageBox.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {storageBox.description && (
            <>
              <Separator className="my-6" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Deskripsi</p>
                <p className="text-foreground">{storageBox.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stocks in this Box */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Stok dalam Kotak Ini</CardTitle>
              <CardDescription>
                Daftar perhiasan yang disimpan di kotak {storageBox.code}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {stocksLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada stok di kotak ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stocks.map((stock) => (
                <div 
                  key={stock.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/stocks/${stock.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{stock.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        SN: {stock.serial_number}
                        {stock.product?.gold_category && ` • ${stock.product.gold_category.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Rp {stock.sell_price?.toLocaleString('id-ID') || '-'}
                    </p>
                    <Badge variant={stock.status === 'available' ? 'default' : 'secondary'}>
                      {stock.status === 'available' ? 'Tersedia' : stock.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Total: {stocks.length} item
                  {storageBox.capacity > 0 && ` / ${storageBox.capacity} kapasitas`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
