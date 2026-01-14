import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Award, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Member } from '@/lib/api';

interface ColumnsProps {
  onDelete: (id: number, name: string) => void;
  hasPermission: (permission: string) => boolean;
}

const memberTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  regular: { label: 'Regular', variant: 'outline' },
  silver: { label: 'Silver', variant: 'secondary' },
  gold: { label: 'Gold', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  platinum: { label: 'Platinum', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const columns = ({ onDelete, hasPermission }: ColumnsProps): ColumnDef<Member>[] => [
  {
    accessorKey: 'code',
    header: 'Kode',
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue('code')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Telepon',
    cell: ({ row }) => row.getValue('phone') || '-',
  },
  {
    accessorKey: 'member_type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.getValue('member_type') as string;
      const config = memberTypeConfig[type] || { label: type, variant: 'outline' };
      return (
        <Badge variant={config.variant} className={config.className}>
          <Star className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'points',
    header: 'Poin',
    cell: ({ row }) => {
      const points = row.getValue('points') as number;
      return (
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">{points.toLocaleString('id-ID')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'transaction_count',
    header: 'Transaksi',
    cell: ({ row }) => {
      const count = row.original.transaction_count || 0;
      const totalPurchase = row.original.total_purchase || 0;
      const totalSell = row.original.total_sell || 0;
      return (
        <div>
          <p className="font-medium">{count} transaksi</p>
          <p className="text-xs text-muted-foreground">
            Beli: {formatCurrency(totalPurchase)} | Jual: {formatCurrency(totalSell)}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? 'Aktif' : 'Tidak Aktif'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const navigate = useNavigate();
      const member = row.original;

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
            {hasPermission('members.view') && (
              <DropdownMenuItem onClick={() => navigate(`/members/${member.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            )}
            {hasPermission('members.update') && (
              <DropdownMenuItem onClick={() => navigate(`/members/${member.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission('members.delete') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(member.id, member.name)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
