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
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Transaksi</CardTitle>
              <CardDescription className="text-xs">
                Riwayat transaksi penjualan dan pembelian/setor
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPermission('transactions.purchase') && (
                <Button variant="outline" onClick={() => navigate('/setor-emas')}>
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Setor Emas
                </Button>
              )}
              {hasPermission('transactions.sale') && (
                <Button onClick={() => navigate('/pos')}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  POS Kasir
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
