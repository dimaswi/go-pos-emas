import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"
import type { GoldCategory } from "@/lib/api"

interface GoldCategoryColumnsProps {
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  hasViewPermission: boolean
  hasEditPermission: boolean
  hasDeletePermission: boolean
}

// Format currency to IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function createGoldCategoryColumns({
  onView,
  onEdit,
  onDelete,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
}: GoldCategoryColumnsProps): ColumnDef<GoldCategory>[] {
  return [
    createSelectColumn<GoldCategory>(),
    {
      accessorKey: "code",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Kode
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="font-mono font-medium">{row.getValue("code")}</span>
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Nama
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("name")}</span>
      },
    },
    {
      accessorKey: "purity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Kemurnian
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const purity = row.getValue("purity") as number;
        return <span>{(purity * 100).toFixed(1)}%</span>
      },
    },
    {
      accessorKey: "buy_price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Harga Beli/gram
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="text-muted-foreground">{formatCurrency(row.getValue("buy_price"))}</span>
      },
    },
    {
      accessorKey: "sell_price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Harga Jual/gram
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="font-medium text-green-600">{formatCurrency(row.getValue("sell_price"))}</span>
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center gap-1">
            {hasViewPermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(category.id)}
                className="h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasEditPermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(category.id)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasDeletePermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(category.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
