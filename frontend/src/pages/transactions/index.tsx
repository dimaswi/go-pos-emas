import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { transactionsApi, type Transaction } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { columns } from './columns';
import { Loader2, ShoppingCart, ArrowDownToLine } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Transaksi');
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transactionsApi.getAll({ page_size: 1000 });
      setTransactions(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data transaksi.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">Transaksi</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Riwayat transaksi penjualan dan pembelian/setor
              </CardDescription>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {hasPermission('transactions.purchase') && (
                <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => navigate('/setor-emas')}>
                  <ArrowDownToLine className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Setor Emas</span>
                  <span className="xs:hidden">Setor</span>
                </Button>
              )}
              {hasPermission('transactions.sale') && (
                <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" onClick={() => navigate('/pos')}>
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">POS Kasir</span>
                  <span className="xs:hidden">POS</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              columns={columns({ hasPermission })}
              data={transactions}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
