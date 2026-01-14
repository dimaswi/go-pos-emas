import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, ShoppingCart, ArrowDownToLine, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Transaction } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ColumnsProps {
  hasPermission: (permission: string) => boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  sale: { label: 'Penjualan', variant: 'default', icon: ShoppingCart },
  purchase: { label: 'Setor', variant: 'secondary', icon: ArrowDownToLine },
};

const paymentMethodConfig: Record<string, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  card: 'Kartu',
  other: 'Lainnya',
};

export const columns = ({ hasPermission }: ColumnsProps): ColumnDef<Transaction>[] => [
  {
    accessorKey: 'transaction_code',
    header: 'No. Invoice',
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue('transaction_code')}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const config = typeConfig[type] || { label: type, variant: 'outline', icon: ShoppingCart };
      const Icon = config.icon;
      return (
        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'member',
    header: 'Member',
    cell: ({ row }) => {
      const member = row.original.member;
      return member ? (
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.code}</p>
        </div>
      ) : (
        <span className="text-muted-foreground">Non-member</span>
      );
    },
  },
  {
    accessorKey: 'grand_total',
    header: 'Total',
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.getValue('grand_total'))}</span>
    ),
  },
  {
    accessorKey: 'payment_method',
    header: 'Pembayaran',
    cell: ({ row }) => {
      const method = row.getValue('payment_method') as string;
      return paymentMethodConfig[method] || method;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return format(date, 'dd MMM yyyy HH:mm', { locale: id });
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const navigate = useNavigate();
      const transaction = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            {hasPermission('transactions.view') && (
              <DropdownMenuItem onClick={() => navigate(`/transactions/${transaction.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak Struk
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
