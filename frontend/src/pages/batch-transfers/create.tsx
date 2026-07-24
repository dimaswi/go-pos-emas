import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { stocksApi, locationsApi, storageBoxesApi, type Location, type Stock, type StorageBox } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, ArrowRightLeft, Camera, Barcode, Trash2, Warehouse, Store, Box } from 'lucide-react';
import { CameraScanner } from '@/components/camera-scanner';
import { setPageTitle } from '@/lib/page-title';

export default function BatchStockTransfer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [toBoxes, setToBoxes] = useState<StorageBox[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  
  const [formData, setFormData] = useState({
    to_location_id: 0,
    to_box_id: 0,
    notes: '',
  });

  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageTitle('Batch Transfer Stok');
    loadLocations();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-submit when scanner types rapidly
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (scanInput.length >= 3 && !isScanning) {
      timeoutId = setTimeout(() => {
        handleScan(scanInput);
      }, 500); // Wait 500ms after last keystroke to auto-submit
    }
    return () => clearTimeout(timeoutId);
  }, [scanInput]);

  const loadLocations = async () => {
    try {
      const response = await locationsApi.getAll({ page_size: 1000 });
      setLocations(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data lokasi.",
      });
    }
  };

  const handleToLocationChange = async (value: string) => {
    const locationId = parseInt(value) || 0;
    setFormData({ ...formData, to_location_id: locationId, to_box_id: 0 });
    
    if (locationId > 0) {
      try {
        const response = await storageBoxesApi.getAll({ location_id: locationId, page_size: 1000 });
        setToBoxes(response.data.data || []);
      } catch (error) {
        setToBoxes([]);
      }
    } else {
      setToBoxes([]);
    }
  };

  const handleScan = async (serial: string) => {
    if (!serial.trim()) return;
    
    if (selectedStocks.some(s => s.serial_number === serial)) {
      toast({
        variant: "destructive",
        title: "Sudah Ditambahkan",
        description: `Stok dengan SN ${serial} sudah ada di daftar transfer.`,
      });
      setScanInput('');
      return;
    }

    setIsScanning(true);
    try {
      const response = await stocksApi.getBySerial(serial);
      const stock = response.data.data;
      
      if (stock.status !== 'available') {
        toast({
          variant: "destructive",
          title: "Stok Tidak Tersedia",
          description: `Stok dengan SN ${serial} berstatus ${stock.status}.`,
        });
      } else {
        if (selectedStocks.length > 0 && stock.location_id !== selectedStocks[0].location_id) {
          toast({
            variant: "destructive",
            title: "Lokasi Asal Berbeda",
            description: "Semua stok dalam satu batch transfer harus berasal dari lokasi yang sama.",
          });
        } else {
          setSelectedStocks(prev => [...prev, stock]);
          toast({
            variant: "success",
            title: "Berhasil",
            description: `Stok ${stock.product?.name} ditambahkan.`,
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Tidak Ditemukan",
        description: `Stok dengan SN ${serial} tidak ditemukan.`,
      });
    } finally {
      setIsScanning(false);
      setScanInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const removeStock = (index: number) => {
    const newStocks = [...selectedStocks];
    newStocks.splice(index, 1);
    setSelectedStocks(newStocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStocks.length === 0) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Tidak ada stok yang dipilih.",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const stockIds = selectedStocks.map(s => s.id);
      await stocksApi.batchTransfer({
        stock_ids: stockIds,
        to_location_id: formData.to_location_id,
        to_box_id: formData.to_box_id,
        notes: formData.notes
      });
      
      toast({
        variant: "success",
        title: "Permintaan Transfer Terkirim!",
        description: "Menunggu persetujuan dari lokasi tujuan.",
      });
      navigate('/stock-transfers');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal membuat batch transfer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toLocationOptions = useMemo(() => {
    const originLocationId = selectedStocks.length > 0 ? selectedStocks[0].location_id : null;
    return locations
      .filter(loc => loc.id !== originLocationId)
      .map((location) => ({
        value: location.id.toString(),
        label: `${location.name} (${location.type === 'gudang' ? 'Gudang' : 'Toko'})`,
        icon: location.type === 'gudang' ? <Warehouse className="h-4 w-4" /> : <Store className="h-4 w-4" />,
      }));
  }, [locations, selectedStocks]);

  const toBoxOptions = useMemo(() => {
    return toBoxes.map((box) => ({
      value: box.id.toString(),
      label: box.code,
      icon: <Box className="h-4 w-4" />,
      description: box.description,
    }));
  }, [toBoxes]);

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">Batch Transfer Stok</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">Pindahkan banyak stok menggunakan scanner</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3 border-dashed border-primary/50 text-primary hover:text-primary">
                    <Camera className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Scan Kamera</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scan Barcode/QR</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    {isCameraOpen && (
                      <CameraScanner 
                        onScan={(text) => {
                          handleScan(text);
                          setIsCameraOpen(false);
                        }} 
                        onClose={() => setIsCameraOpen(false)}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/stock-transfers')}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Daftar Barang (Di-scan)</h3>
                <div className="space-y-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleScan(scanInput); }} className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        ref={inputRef}
                        placeholder="Scan atau ketik Serial Number..."
                        className="pl-9"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        disabled={isScanning}
                      />
                    </div>
                    <Button type="submit" disabled={isScanning || !scanInput.trim()}>
                      {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tambah'}
                    </Button>
                  </form>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[50px]">No.</TableHead>
                          <TableHead>Produk</TableHead>
                          <TableHead>SN / Barcode</TableHead>
                          <TableHead>Asal Lokasi</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStocks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Belum ada stok yang di-scan
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedStocks.map((stock, idx) => (
                            <TableRow key={stock.id}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell className="font-medium">
                                {stock.product?.name}
                                <div className="text-xs text-muted-foreground">{stock.product?.gold_category?.name}</div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs">{stock.serial_number}</span>
                                <div className="text-xs text-muted-foreground">{stock.product?.barcode}</div>
                              </TableCell>
                              <TableCell>{stock.location?.name}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeStock(idx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {selectedStocks.length > 0 && (
                    <div className="bg-muted p-3 rounded-lg text-sm flex justify-between items-center">
                      <span>Total Item: <strong>{selectedStocks.length}</strong></span>
                      <span>Asal: <strong>{selectedStocks[0].location?.name}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Tujuan Transfer</h3>
              <div className="bg-muted/20 p-5 rounded-lg border space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Lokasi Tujuan *</Label>
                    <SearchableSelect
                      options={toLocationOptions}
                      value={formData.to_location_id ? formData.to_location_id.toString() : ''}
                      onValueChange={handleToLocationChange}
                      placeholder="Pilih lokasi tujuan"
                      searchPlaceholder="Cari lokasi..."
                      emptyMessage="Lokasi tidak ditemukan."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kotak Penyimpanan Tujuan *</Label>
                    <SearchableSelect
                      options={toBoxOptions}
                      value={formData.to_box_id ? formData.to_box_id.toString() : ''}
                      onValueChange={(value) => setFormData({ ...formData, to_box_id: parseInt(value) || 0 })}
                      placeholder={toBoxes.length === 0 ? "Pilih lokasi dulu" : "Pilih kotak penyimpanan"}
                      searchPlaceholder="Cari kotak..."
                      emptyMessage="Kotak tidak ditemukan."
                      disabled={!formData.to_location_id || toBoxes.length === 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Catatan transfer..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting || selectedStocks.length === 0 || !formData.to_location_id || !formData.to_box_id}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                    )}
                    Kirim Permintaan Transfer
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

