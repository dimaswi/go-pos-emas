import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, MapPin, RefreshCw, Search, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

interface LocationStock {
  location_id: number;
  location_name: string;
  total_items: number;
  total_weight: number;
  categories: {
    category_name: string;
    count: number;
    weight: number;
  }[];
}

interface StorageBox {
  id: number;
  code: string;
  name: string;
  description?: string;
  capacity: number;
  is_active: boolean;
  location_id: number;
  stock_count?: number;
  total_weight?: number;
}

interface Stock {
  id: number;
  serial_number: string;
  status: string;
  buy_price: number;
  sell_price: number;
  product?: {
    id: number;
    name: string;
    weight: number;
    gold_category?: {
      id: number;
      name: string;
    };
  };
  storage_box?: {
    id: number;
    code: string;
    name: string;
  };
  location?: {
    id: number;
    name: string;
  };
}

type ViewMode = 'boxes' | 'stocks';

export default function LocationMonitorPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocationStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationStock | null>(null);
  
  // Storage boxes state
  const [storageBoxes, setStorageBoxes] = useState<StorageBox[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [selectedBox, setSelectedBox] = useState<StorageBox | null>(null);
  
  // Stocks state
  const [boxStocks, setBoxStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('boxes');

  useEffect(() => {
    setPageTitle('Monitor Barang Per Lokasi');
  }, []);

  const loadLocationStocks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/stocks/by-location');
      setLocations(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data monitoring lokasi.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLocationStocks();
  }, [loadLocationStocks]);

  const formatWeight = (weight: number) => {
    if (!weight || isNaN(weight)) {
      return '0 g';
    }
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`;
    }
    return `${weight.toFixed(2)} g`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) {
      return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filter and sort stocks: available first, then sold at bottom
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = boxStocks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = boxStocks.filter(stock => 
        stock.serial_number?.toLowerCase().includes(query) ||
        stock.product?.name?.toLowerCase().includes(query) ||
        stock.product?.gold_category?.name?.toLowerCase().includes(query)
      );
    }
    
    // Sort: available first, sold last
    return filtered.sort((a, b) => {
      if (a.status === 'sold' && b.status !== 'sold') return 1;
      if (a.status !== 'sold' && b.status === 'sold') return -1;
      return 0;
    });
  }, [boxStocks, searchQuery]);

  // Handle location click - load storage boxes
  const handleLocationClick = async (location: LocationStock) => {
    setSelectedLocation(location);
    setDialogOpen(true);
    setViewMode('boxes');
    setSelectedBox(null);
    setLoadingBoxes(true);
    setSearchQuery('');
    
    try {
      // Get storage boxes for this location
      const response = await api.get('/storage-boxes', { 
        params: {
          location_id: location.location_id
        }
      });
      
      const boxes = response.data.data || [];
      
      // Get stock count for each box
      const stocksResponse = await api.get('/stocks', { 
        params: {
          page_size: 10000,
          location_id: location.location_id
        }
      });
      const allStocks = stocksResponse.data.data || [];
      
      // Calculate stock count and weight per box
      const boxesWithCount = boxes.map((box: StorageBox) => {
        const boxStocksList = allStocks.filter((s: Stock) => s.storage_box?.id === box.id);
        const availableStocks = boxStocksList.filter((s: Stock) => s.status === 'available');
        return {
          ...box,
          stock_count: availableStocks.length,
          total_weight: availableStocks.reduce((sum: number, s: Stock) => sum + (s.product?.weight || 0), 0)
        };
      });
      
      setStorageBoxes(boxesWithCount);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data kotak penyimpanan.",
      });
    } finally {
      setLoadingBoxes(false);
    }
  };

  // Handle box click - load stocks for that box
  const handleBoxClick = async (box: StorageBox) => {
    setSelectedBox(box);
    setViewMode('stocks');
    setLoadingStocks(true);
    setSearchQuery('');
    
    try {
      const response = await api.get('/stocks', { 
        params: {
          page_size: 1000,
          storage_box_id: box.id
        }
      });
      setBoxStocks(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data stok.",
      });
    } finally {
      setLoadingStocks(false);
    }
  };

  // Go back to boxes view
  const handleBackToBoxes = () => {
    setViewMode('boxes');
    setSelectedBox(null);
    setBoxStocks([]);
    setSearchQuery('');
  };

  // Close dialog and reset
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setViewMode('boxes');
    setSelectedBox(null);
    setStorageBoxes([]);
    setBoxStocks([]);
    setSearchQuery('');
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Monitor Barang Per Lokasi</CardTitle>
              <CardDescription className="text-xs">
                Pantau distribusi stok emas di setiap lokasi
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLocationStocks} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Tidak ada data stok di lokasi manapun</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {locations.map((location) => (
                <Card 
                  key={location.location_id}
                  onClick={() => handleLocationClick(location)}
                  className="relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  {/* Cinema-style gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold line-clamp-1">
                            {location.location_name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            Lokasi Penyimpanan
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 relative">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {location.total_items}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Item</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatWeight(location.total_weight)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Total Berat</div>
                      </div>
                    </div>

                    {/* Categories */}
                    {location.categories && location.categories.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-1">
                          Kategori Emas:
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {location.categories.map((cat, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-2 rounded bg-background/50 border hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {cat.category_name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {cat.count} item
                                </span>
                              </div>
                              <div className="text-xs font-medium text-primary shrink-0">
                                {formatWeight(cat.weight)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Indicator */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge 
                          variant={location.total_items > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {location.total_items > 0 ? 'Aktif' : 'Kosong'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Screen Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
            <div className="flex items-center gap-3">
              {viewMode === 'stocks' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToBoxes}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Kembali
                </Button>
              )}
              <div className="p-2 rounded-lg bg-primary/10">
                {viewMode === 'boxes' ? (
                  <MapPin className="h-5 w-5 text-primary" />
                ) : (
                  <Box className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg">
                  {viewMode === 'boxes' 
                    ? `${selectedLocation?.location_name} - Kotak Penyimpanan`
                    : `${selectedBox?.name || selectedBox?.code} - Daftar Barang`
                  }
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {viewMode === 'boxes' ? (
                    <>
                      Lokasi: <span className="font-medium text-foreground">{selectedLocation?.location_name}</span> • 
                      Total: <span className="font-medium text-foreground">{selectedLocation?.total_items || 0} item</span> • 
                      Berat: <span className="font-medium text-foreground">{formatWeight(selectedLocation?.total_weight || 0)}</span>
                    </>
                  ) : (
                    <>
                      Lokasi: <span className="font-medium text-foreground">{selectedLocation?.location_name}</span> • 
                      Kotak: <span className="font-medium text-foreground">{selectedBox?.name || selectedBox?.code}</span> • 
                      Total: <span className="font-medium text-foreground">{boxStocks.length} item</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {viewMode === 'boxes' ? (
              /* Storage Boxes View */
              loadingBoxes ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : storageBoxes.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Box className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Tidak ada kotak penyimpanan di lokasi ini</p>
                  <p className="text-sm mt-2">Tambahkan kotak penyimpanan terlebih dahulu</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {storageBoxes.map((box) => (
                    <Card 
                      key={box.id}
                      onClick={() => handleBoxClick(box)}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
                        box.stock_count === 0 ? 'opacity-60' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`p-4 rounded-xl ${
                            box.stock_count && box.stock_count > 0 
                              ? 'bg-primary/10' 
                              : 'bg-muted'
                          }`}>
                            <Box className={`h-8 w-8 ${
                              box.stock_count && box.stock_count > 0 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{box.code}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{box.name}</p>
                          </div>
                          <div className="w-full pt-2 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Item:</span>
                              <span className="font-medium">{box.stock_count || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Berat:</span>
                              <span className="font-medium">{formatWeight(box.total_weight || 0)}</span>
                            </div>
                          </div>
                          <Badge 
                            variant={box.stock_count && box.stock_count > 0 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {box.stock_count && box.stock_count > 0 ? 'Ada Stok' : 'Kosong'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              /* Stocks View */
              <>
                {/* Search Input */}
                <div className="relative mb-4 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari serial number, nama produk, atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {loadingStocks ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">
                      {searchQuery ? 'Tidak ada stok yang sesuai pencarian' : 'Tidak ada stok di kotak ini'}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[200px]">Serial Number</TableHead>
                          <TableHead>Nama Produk</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Berat</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedStocks.map((stock) => (
                          <TableRow 
                            key={stock.id}
                            className={stock.status === 'sold' ? 'relative bg-red-50 dark:bg-red-950/20' : ''}
                          >
                            <TableCell className={`font-mono text-sm ${stock.status === 'sold' ? 'text-muted-foreground line-through decoration-red-500 decoration-2' : ''}`}>
                              {stock.serial_number || '-'}
                            </TableCell>
                            <TableCell className={`font-medium ${stock.status === 'sold' ? 'text-muted-foreground line-through decoration-red-500 decoration-2' : ''}`}>
                              {stock.product?.name || '-'}
                            </TableCell>
                            <TableCell className={stock.status === 'sold' ? 'opacity-60' : ''}>
                              <Badge variant="outline" className={`text-xs ${stock.status === 'sold' ? 'line-through decoration-red-500 decoration-2' : ''}`}>
                                {stock.product?.gold_category?.name || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right ${stock.status === 'sold' ? 'text-muted-foreground line-through decoration-red-500 decoration-2' : ''}`}>
                              {formatWeight(stock.product?.weight || 0)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${stock.status === 'sold' ? 'text-muted-foreground line-through decoration-red-500 decoration-2' : ''}`}>
                              {formatPrice(stock.sell_price)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={stock.status === 'available' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {stock.status === 'available' ? 'Tersedia' : 
                                 stock.status === 'sold' ? 'Terjual' : 
                                 stock.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
