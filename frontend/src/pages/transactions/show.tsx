import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { transactionsApi, type Transaction } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Printer, ShoppingCart, ArrowDownToLine, User, Calendar, CreditCard } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const typeConfig: Record<string, { label: string; variant: "default" | "secondary"; icon: any; colorClass: string }> = {
  sale: { label: 'Penjualan', variant: 'default', icon: ShoppingCart, colorClass: 'text-green-600' },
  purchase: { label: 'Pembelian/Setor', variant: 'secondary', icon: ArrowDownToLine, colorClass: 'text-blue-600' },
};

const paymentMethodConfig: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  card: 'Kartu',
  other: 'Lainnya',
};

export default function TransactionShow() {
  const navigate = useNavigate();
  const { id: transactionId } = useParams();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Detail Transaksi');
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const response = await transactionsApi.getById(Number(transactionId));
      setTransaction(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data transaksi.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Transaksi tidak ditemukan</p>
          <Button onClick={() => navigate('/transactions')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  const typeInfo = typeConfig[transaction.type] || typeConfig.sale;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={() => navigate('/transactions')}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">Detail Transaksi</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">{transaction.transaction_code}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => window.print()}>
              <Printer className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Cetak
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            {/* Invoice Header */}
            <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <TypeIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${typeInfo.colorClass}`} />
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">No. Transaksi</p>
                  <p className="font-mono text-sm sm:text-xl font-bold">{transaction.transaction_code}</p>
                </div>
              </div>
              <Badge variant={typeInfo.variant} className="text-[10px] sm:text-sm w-fit">
                {typeInfo.label}
              </Badge>
            </div>

            {/* Transaction Info */}
            <div className="mb-4 sm:mb-8">
              <CardTitle className="text-xs sm:text-base text-muted-foreground font-normal mb-3 sm:mb-4">
                INFORMASI TRANSAKSI
              </CardTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div>
                  <label className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    Tanggal
                  </label>
                  <p className="font-medium text-xs sm:text-base">
                    {format(new Date(transaction.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    Member
                  </label>
                  <p className="font-medium text-xs sm:text-base truncate">
                    {transaction.member ? `${transaction.member.name}` : 'Non-member'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    Pembayaran
                  </label>
                  <p className="font-medium text-xs sm:text-base">
                    {paymentMethodConfig[transaction.payment_method] || transaction.payment_method}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-sm text-muted-foreground">Kasir</label>
                  <p className="font-medium text-xs sm:text-base">{transaction.cashier?.full_name || '-'}</p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Items */}
            <div className="my-4 sm:my-8">
              <CardTitle className="text-xs sm:text-base text-muted-foreground font-normal mb-3 sm:mb-4">
                DETAIL ITEM
              </CardTitle>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sm:text-sm">No</TableHead>
                      <TableHead className="text-[10px] sm:text-sm">Produk</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-sm">Berat</TableHead>
                      <TableHead className="text-center text-[10px] sm:text-sm">Qty</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-sm">Harga</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-sm">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.items?.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-[10px] sm:text-sm">{index + 1}</TableCell>
                        <TableCell className="text-[10px] sm:text-sm">
                          <div>
                            <p className="font-medium truncate max-w-[100px] sm:max-w-none">{item.product?.name || item.item_name || '-'}</p>
                            {item.product?.barcode && (
                              <p className="text-[8px] sm:text-xs text-muted-foreground font-mono">{item.product.barcode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.weight?.toFixed(2) || '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.sub_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Summary */}
            <div className="mt-8 flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(transaction.sub_total)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon</span>
                    <span className="text-red-500">-{formatCurrency(transaction.discount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className={typeInfo.colorClass}>{formatCurrency(transaction.grand_total)}</span>
                </div>
              </div>
            </div>

            {transaction.notes && (
              <>
                <hr className="border-border/50 mt-8" />
                <div className="mt-8">
                  <CardTitle className="text-base text-muted-foreground font-normal mb-2">
                    CATATAN
                  </CardTitle>
                  <p className="text-sm">{transaction.notes}</p>
                </div>
              </>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
