import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Warehouse, Store, Box, BarcodeIcon, Printer, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Stock } from '@/lib/api';

interface ColumnsProps {
  onDelete: (id: number, name: string) => void;
  onPrintBarcode: (boxId: number, boxName: string) => void;
  hasPermission: (permission: string) => boolean;
  enableSelection?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: 'Tersedia', variant: 'default' },
  reserved: { label: 'Dipesan', variant: 'secondary' },
  sold: { label: 'Terjual', variant: 'outline' },
  returned: { label: 'Dikembalikan', variant: 'destructive' },
};

export const columns = ({ onDelete, onPrintBarcode, hasPermission, enableSelection = true }: ColumnsProps): ColumnDef<Stock>[] => {
  const baseColumns: ColumnDef<Stock>[] = [];
  
  // Add select column if selection is enabled
  if (enableSelection) {
    baseColumns.push({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Add other columns
  baseColumns.push(
  {
    accessorKey: 'product',
    header: 'Produk',
    cell: ({ row }) => {
      const product = row.original.product;
      const serialNumber = row.original.serial_number;
      const isSold = row.original.status === 'sold';
      return (
        <div className={`flex items-center gap-2 ${isSold ? 'text-muted-foreground' : ''}`}>
          <BarcodeIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className={`font-medium ${isSold ? 'line-through decoration-red-500 decoration-2' : ''}`}>{product?.name || '-'}</p>
            <p className={`text-xs text-muted-foreground font-mono ${isSold ? 'line-through decoration-red-500 decoration-2' : ''}`}>{serialNumber || '-'}</p>
          </div>
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
      const isSold = row.original.status === 'sold';
      return (
        <div className={`flex items-center gap-2 ${isSold ? 'text-muted-foreground' : ''}`}>
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className={isSold ? 'line-through decoration-red-500 decoration-2' : ''}>{location?.name || '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'storage_box',
    header: 'Kotak Penyimpanan',
    cell: ({ row }) => {
      const box = row.original.storage_box;
      const isSold = row.original.status === 'sold';
      return box ? (
        <div className={`flex items-center gap-2 ${isSold ? 'text-muted-foreground' : ''}`}>
          <Box className="h-4 w-4 text-muted-foreground" />
          <span className={isSold ? 'line-through decoration-red-500 decoration-2' : ''}>{box.code}</span>
        </div>
      ) : '-';
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const config = statusConfig[status] || { label: status, variant: 'outline' };
      return (
        <Badge variant={status === 'sold' ? 'destructive' : config.variant}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'barcode_printed',
    header: 'Barcode',
    cell: ({ row }) => {
      const isPrinted = row.original.barcode_printed;
      const isSold = row.original.status === 'sold';
      return isPrinted ? (
        <Badge variant="default" className={`bg-green-600 ${isSold ? 'opacity-60' : ''}`}>
          <Check className="h-3 w-3 mr-1" />
          Sudah Cetak
        </Badge>
      ) : (
        <Badge variant="outline" className={`text-muted-foreground ${isSold ? 'opacity-60' : ''}`}>
          Belum Cetak
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const navigate = useNavigate();
      const stock = row.original;

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
            {hasPermission('stocks.view') && (
              <DropdownMenuItem onClick={() => navigate(`/stocks/${stock.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </DropdownMenuItem>
            )}
            {hasPermission('stocks.view') && stock.storage_box && (
              <DropdownMenuItem 
                onClick={() => onPrintBarcode(stock.storage_box_id, stock.storage_box?.code || 'Box')}
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak Barcode Box
              </DropdownMenuItem>
            )}
            {hasPermission('stocks.update') && (
              <DropdownMenuItem onClick={() => navigate(`/stocks/${stock.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission('stocks.delete') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(stock.id, stock.product?.name || `Stock #${stock.id}`)}
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
  });
  
  return baseColumns;
};
