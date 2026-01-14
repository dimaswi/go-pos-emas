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
import { MoreHorizontal, Eye, Edit, Trash2, Warehouse, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Location } from '@/lib/api';

interface ColumnsProps {
  onDelete: (id: number, name: string) => void;
  hasPermission: (permission: string) => boolean;
}

const typeConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  gudang: { label: 'Gudang', variant: 'default', icon: Warehouse },
  toko: { label: 'Toko', variant: 'secondary', icon: Store },
};

export const columns = ({ onDelete, hasPermission }: ColumnsProps): ColumnDef<Location>[] => [
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
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const config = typeConfig[type] || { label: type, variant: 'outline', icon: Warehouse };
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
    accessorKey: 'address',
    header: 'Alamat',
    cell: ({ row }) => {
      const address = row.getValue('address') as string;
      return (
        <span className="text-muted-foreground max-w-xs truncate block">
          {address || '-'}
        </span>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'Telepon',
    cell: ({ row }) => row.getValue('phone') || '-',
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
      const location = row.original;

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
            {hasPermission('locations.view') && (
              <DropdownMenuItem onClick={() => navigate(`/locations/${location.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            )}
            {hasPermission('locations.update') && (
              <DropdownMenuItem onClick={() => navigate(`/locations/${location.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission('locations.delete') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(location.id, location.name)}
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
