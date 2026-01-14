import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"
import type { Product } from "@/lib/api"

interface ProductColumnsProps {
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  hasViewPermission: boolean
  hasEditPermission: boolean
  hasDeletePermission: boolean
}

const productTypeLabels: Record<string, string> = {
  gelang: 'Gelang',
  cincin: 'Cincin',
  kalung: 'Kalung',
  anting: 'Anting',
  liontin: 'Liontin',
  other: 'Lainnya',
};

const categoryLabels: Record<string, string> = {
  dewasa: 'Dewasa',
  anak: 'Anak',
  unisex: 'Unisex',
};

export function createProductColumns({
  onView,
  onEdit,
  onDelete,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
}: ProductColumnsProps): ColumnDef<Product>[] {
  return [
    createSelectColumn<Product>(),
    {
      accessorKey: "barcode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Barcode
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="font-mono text-xs">{row.getValue("barcode")}</span>
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
            Nama Produk
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("name")}</span>
      },
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant="outline">
            {productTypeLabels[type] || type}
          </Badge>
        )
      },
    },
    {
      accessorKey: "category",
      header: "Kategori",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge variant="secondary">
            {categoryLabels[category] || category}
          </Badge>
        )
      },
    },
    {
      accessorKey: "gold_category.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Kualitas Emas
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const product = row.original;
        return (
          <span className="text-muted-foreground">
            {product.gold_category?.name || '-'}
          </span>
        )
      },
    },
    {
      accessorKey: "weight",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Berat
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const weight = row.getValue("weight") as number;
        return <span>{weight.toFixed(2)} gr</span>
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
        const product = row.original;
        return (
          <div className="flex items-center gap-1">
            {hasViewPermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(product.id)}
                className="h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasEditPermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(product.id)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasDeletePermission && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(product.id)}
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
