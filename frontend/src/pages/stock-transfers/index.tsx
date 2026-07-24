import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { stocksApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ListPlus } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';
import { columns } from './columns';

export default function StockTransfersIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Riwayat Transfer Stok');
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const response = await stocksApi.getTransferBatches();
      setBatches(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data transfer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">Riwayat Transfer Stok</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">
                Lihat daftar riwayat pemindahan stok antar lokasi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission('stocks.transfer') && (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate('/stock-transfers/create')} className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Transfer Satuan</span>
                  </Button>
                  <Button size="sm" onClick={() => navigate('/batch-transfers/create')} className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3">
                    <ListPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Transfer Batch</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={batches}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
