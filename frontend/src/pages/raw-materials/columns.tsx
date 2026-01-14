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
import { MoreHorizontal, Eye, Edit, Trash2, Warehouse, Store, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type RawMaterial } from '@/lib/api';

interface ColumnsProps {
  onDelete: (id: number, name: string) => void;
  hasPermission: (permission: string) => boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: 'Tersedia', variant: 'default' },
  processed: { label: 'Diproses', variant: 'secondary' },
  sold: { label: 'Terjual', variant: 'outline' },
};

const conditionConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: 'Baru', variant: 'default' },
  like_new: { label: 'Seperti Baru', variant: 'default' },
  scratched: { label: 'Baret', variant: 'secondary' },
  dented: { label: 'Penyok', variant: 'secondary' },
  damaged: { label: 'Rusak', variant: 'destructive' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const columns = ({ onDelete, hasPermission }: ColumnsProps): ColumnDef<RawMaterial>[] => [
  {
    accessorKey: 'code',
    header: 'Kode',
    cell: ({ row }) => {
      const code = row.original.code;
      return (
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{code}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'gold_category',
    header: 'Kategori Emas',
    cell: ({ row }) => {
      const category = row.original.gold_category;
      return category ? (
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">{category.purity}% kadar</p>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: 'weight_grams',
    header: 'Berat',
    cell: ({ row }) => {
      const weightGross = row.original.weight_gross || row.original.weight_grams;
      const weightNet = row.original.weight_grams;
      const shrinkage = row.original.shrinkage_percent || 0;
      return (
        <div>
          <p className="font-medium">{weightNet.toFixed(2)} gram</p>
          {shrinkage > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {weightGross.toFixed(2)}g -{shrinkage}%
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'total_buy_price',
    header: 'Total Harga Beli',
    cell: ({ row }) => {
      const price = row.original.total_buy_price;
      const pricePerGram = row.original.buy_price_per_gram;
      return (
        <div>
          <p className="font-medium">{formatCurrency(price)}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(pricePerGram)}/gram</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Lokasi',
    cell: ({ row }) => {
      const location = row.original.location;
      const Icon = location?.type === 'gudang' ? Warehouse : Store;
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{location?.name || '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'condition',
    header: 'Kondisi',
    cell: ({ row }) => {
      const condition = row.original.condition;
      const config = conditionConfig[condition] || { label: condition, variant: 'outline' };
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status] || { label: status, variant: 'outline' };
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'supplier_name',
    header: 'Supplier/Member',
    cell: ({ row }) => {
      const member = row.original.member;
      const supplier = row.original.supplier_name;
      if (member) {
        return (
          <div>
            <p className="font-medium">{member.name}</p>
            <p className="text-xs text-muted-foreground">Member: {member.member_code}</p>
          </div>
        );
      }
      return supplier || <span className="text-muted-foreground">-</span>;
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const navigate = useNavigate();
      const rawMaterial = row.original;

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
            {hasPermission('raw-materials.view') && (
              <DropdownMenuItem onClick={() => navigate(`/raw-materials/${rawMaterial.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            )}
            {hasPermission('raw-materials.update') && rawMaterial.status === 'available' && (
              <DropdownMenuItem onClick={() => navigate(`/raw-materials/${rawMaterial.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission('raw-materials.delete') && rawMaterial.status === 'available' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(rawMaterial.id, rawMaterial.code)}
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
