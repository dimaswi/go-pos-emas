import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { stocksApi, type Stock } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BarcodePrintDialog } from '@/components/barcode-print-dialog';
import { columns } from './columns';
import { Plus, Loader2, ArrowLeftRight, Printer, X, MapPin } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StocksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [barcodeBoxId, setBarcodeBoxId] = useState<number | null>(null);
  const [barcodeBoxName, setBarcodeBoxName] = useState('');
  const [barcodePrintMode, setBarcodePrintMode] = useState<'box' | 'selected'>('box');

  const locationId = searchParams.get('location_id');

  useEffect(() => {
    setPageTitle('Stok');
  }, []);

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page_size: 1000 };
      if (locationId) {
        params.location_id = locationId;
      }
      const response = await stocksApi.getAll(params);
      setStocks(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data stok.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, locationId]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  // Sort stocks: available first, sold last
  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      if (a.status === 'sold' && b.status !== 'sold') return 1;
      if (a.status !== 'sold' && b.status === 'sold') return -1;
      return 0;
    });
  }, [stocks]);

  // Get row class for styling sold items
  const getRowClassName = useCallback((stock: Stock) => {
    if (stock.status === 'sold') {
      return 'bg-red-50 dark:bg-red-950/20';
    }
    return '';
  }, []);

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteDialogOpen(true);
  };

  const handlePrintBarcode = (boxId: number, boxName: string) => {
    setBarcodeBoxId(boxId);
    setBarcodeBoxName(boxName);
    setBarcodePrintMode('box');
    setBarcodeDialogOpen(true);
  };

  const handlePrintSelectedBarcodes = () => {
    if (selectedStocks.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak ada stok dipilih",
        description: "Pilih stok yang ingin dicetak barcode-nya.",
      });
      return;
    }
    setBarcodePrintMode('selected');
    setBarcodeDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await stocksApi.delete(deleteId);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Stok berhasil dihapus.",
      });
      loadStocks();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus stok.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleRowSelectionChange = useCallback((rows: Stock[]) => {
    setSelectedStocks(rows);
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Stok</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Kelola stok produk di gudang dan toko
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {hasPermission('stocks.view') && (
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => navigate('/stocks/location-monitor')}>
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Monitor Lokasi</span>
                  <span className="xs:hidden">Monitor</span>
                </Button>
              )}
              {hasPermission('stocks.transfer') && (
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => navigate('/stocks/transfer')}>
                  <ArrowLeftRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Transfer Stok</span>
                  <span className="xs:hidden">Transfer</span>
                </Button>
              )}
              {hasPermission('stocks.create') && (
                <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => navigate('/stocks/create')}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Tambah
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Selection Action Bar */}
        {selectedStocks.length > 0 && (
          <div className="bg-primary/5 border-b px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="font-medium text-[10px] sm:text-xs">
                {selectedStocks.length} dipilih
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStocks([])}
                className="text-muted-foreground h-7 sm:h-8 text-[10px] sm:text-xs"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Batal
              </Button>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('stocks.view') && (
                <Button size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs" onClick={handlePrintSelectedBarcodes}>
                  <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Cetak ({selectedStocks.length})
                </Button>
              )}
            </div>
          </div>
        )}
        
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns({ onDelete: handleDelete, onPrintBarcode: handlePrintBarcode, hasPermission })}
              data={sortedStocks}
              onRowSelectionChange={handleRowSelectionChange}
              getRowClassName={getRowClassName}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Stok"
        description={`Apakah Anda yakin ingin menghapus stok "${deleteName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />

      <BarcodePrintDialog
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        boxId={barcodePrintMode === 'box' ? barcodeBoxId : undefined}
        boxName={barcodePrintMode === 'box' ? barcodeBoxName : undefined}
        stocks={barcodePrintMode === 'selected' ? selectedStocks : undefined}
        mode={barcodePrintMode}
        onPrintComplete={() => {
          loadStocks();
          setSelectedStocks([]);
        }}
      />
    </div>
  );
}
