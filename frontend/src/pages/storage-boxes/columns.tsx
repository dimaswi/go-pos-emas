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
import { MoreHorizontal, Eye, Edit, Trash2, Warehouse, Store, Box, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type StorageBox } from '@/lib/api';

interface ColumnsProps {
  onDelete: (id: number, name: string) => void;
  onPrintBarcode: (id: number, name: string) => void;
  hasPermission: (permission: string) => boolean;
}

const locationTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  gudang: { label: 'Gudang', variant: 'default', icon: Warehouse },
  toko: { label: 'Toko', variant: 'secondary', icon: Store },
};

export const columns = ({ onDelete, onPrintBarcode, hasPermission }: ColumnsProps): ColumnDef<StorageBox>[] => [
  {
    accessorKey: 'code',
    header: 'Kode Kotak',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono font-medium">{row.getValue('code')}</span>
      </div>
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
    accessorKey: 'location',
    header: 'Lokasi',
    cell: ({ row }) => {
      const location = row.original.location;
      if (!location) return '-';
      
      const config = locationTypeConfig[location.type] || { label: location.type, variant: 'outline', icon: Warehouse };
      const Icon = config.icon;
      
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{location.name}</span>
          <Badge variant={config.variant} className="flex items-center gap-1 w-fit text-xs">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'capacity',
    header: 'Kapasitas',
    cell: ({ row }) => {
      const capacity = row.getValue('capacity') as number;
      return (
        <span className="text-muted-foreground">
          {capacity > 0 ? `${capacity} item` : 'Tak terbatas'}
        </span>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi',
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return (
        <span className="text-muted-foreground max-w-xs truncate block">
          {description || '-'}
        </span>
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
      const storageBox = row.original;

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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/storage-boxes/${storageBox.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            {hasPermission('stocks.view') && (
              <DropdownMenuItem onClick={() => onPrintBarcode(storageBox.id, storageBox.name)}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Barcode
              </DropdownMenuItem>
            )}
            {hasPermission('locations.update') && (
              <DropdownMenuItem onClick={() => navigate(`/storage-boxes/${storageBox.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission('locations.delete') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(storageBox.id, storageBox.name)}
                  className="text-destructive focus:text-destructive"
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
