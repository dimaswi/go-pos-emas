import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { storageBoxesApi, locationsApi, type StorageBox, type Location } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { BarcodePrintDialog } from '@/components/barcode-print-dialog';
import { columns } from './columns';
import { Plus, Loader2, Filter, ChevronDown, X, Warehouse, Store } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StorageBoxesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [storageBoxes, setStorageBoxes] = useState<StorageBox[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [barcodeBoxId, setBarcodeBoxId] = useState<number | null>(null);
  const [barcodeBoxName, setBarcodeBoxName] = useState('');
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Check if filter is active
  const isFilterActive = filterLocationId !== 'all';

  // Memoize location options for searchable select
  const locationOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Semua Lokasi' },
      ...locations.map((location) => ({
        value: location.id.toString(),
        label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
        icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
      })),
    ];
  }, [locations]);

  useEffect(() => {
    setPageTitle('Kotak Penyimpanan');
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const response = await locationsApi.getAll({ page_size: 1000 });
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  const loadStorageBoxes = useCallback(async () => {
    setLoading(true);
    try {
      const params: { location_id?: number; page_size?: number } = { page_size: 1000 };
      if (filterLocationId && filterLocationId !== 'all') {
        params.location_id = parseInt(filterLocationId);
      }
      const response = await storageBoxesApi.getAll(params);
      setStorageBoxes(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data kotak penyimpanan.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, filterLocationId]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    loadStorageBoxes();
  }, [loadStorageBoxes]);

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteDialogOpen(true);
  };

  const handlePrintBarcode = (id: number, name: string) => {
    setBarcodeBoxId(id);
    setBarcodeBoxName(name);
    setBarcodeDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await storageBoxesApi.delete(deleteId);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Kotak penyimpanan berhasil dihapus.",
      });
      loadStorageBoxes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus kotak penyimpanan.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Kotak Penyimpanan</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">
                  Kelola rak, kotak, dan tempat penyimpanan perhiasan
                </CardDescription>
              </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button 
                variant={isFilterActive ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setFilterOpen(!filterOpen)}
                className="relative h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Filter</span>
                {isFilterActive && (
                  <Badge variant="destructive" className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                    1
                  </Badge>
                )}
                <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </Button>
              {hasPermission('locations.create') && (
                <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => navigate('/storage-boxes/create')}>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Tambah Kotak</span>
                  <span className="xs:hidden">Tambah</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
          {/* Collapsible Filter Section */}
          <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
            <CollapsibleContent>
              <Card className="mb-3 sm:mb-4 border-dashed">
                <CardContent className="py-2 sm:py-3 px-3 sm:px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Lokasi:</span>
                        <SearchableSelect
                          options={locationOptions}
                          value={filterLocationId}
                          onValueChange={(val) => setFilterLocationId(val || 'all')}
                          placeholder="Semua Lokasi"
                          searchPlaceholder="Cari lokasi..."
                          emptyMessage="Lokasi tidak ditemukan."
                          className="w-full sm:w-[250px]"
                          size="sm"
                        />
                      </div>
                    </div>
                    {isFilterActive && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFilterLocationId('all')}
                        className="h-7 sm:h-8 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns({ onDelete: handleDelete, onPrintBarcode: handlePrintBarcode, hasPermission })}
              data={storageBoxes}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Kotak Penyimpanan"
        description={`Apakah Anda yakin ingin menghapus kotak "${deleteName}"? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi stok yang ada di kotak ini.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />

      <BarcodePrintDialog
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        boxId={barcodeBoxId}
        boxName={barcodeBoxName}
        mode="box"
      />
    </div>
  );
}
