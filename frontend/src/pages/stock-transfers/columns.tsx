import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Menunggu</Badge>;
    case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Disetujui</Badge>;
    case 'cancelled': return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Ditolak</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    accessorKey: 'transfer_number',
    header: 'No. Transfer',
    cell: ({ row }) => (
      <span className="font-mono font-medium text-sm whitespace-nowrap">
        {row.getValue('transfer_number')}
      </span>
    ),
  },
  {
    accessorKey: 'transferred_at',
    header: 'Waktu',
    cell: ({ row }) => {
      const date = row.getValue('transferred_at') as string;
      return <span className="whitespace-nowrap">{new Date(date).toLocaleString('id-ID')}</span>;
    },
  },
  {
    accessorKey: 'from_location',
    header: 'Lokasi Asal',
    cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue('from_location')}</span>,
  },
  {
    accessorKey: 'to_location',
    header: 'Lokasi Tujuan',
    cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue('to_location')}</span>,
  },
  {
    accessorKey: 'total_items',
    header: 'Total Item',
    cell: ({ row }) => (
      <div className="text-center font-semibold">
        {row.getValue('total_items')}
      </div>
    ),
  },
  {
    accessorKey: 'transferred_by',
    header: 'Oleh',
    cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue('transferred_by')}</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Aksi</div>,
    cell: function ActionsCell({ row }) {
      const navigate = useNavigate();
      const batch = row.original;

      return (
        <div className="text-right">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/stock-transfers/${batch.transfer_number}`)}>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      );
    },
  },
];
