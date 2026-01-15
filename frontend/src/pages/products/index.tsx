import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createProductColumns } from "./columns";
import { productsApi, type Product } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setPageTitle } from "@/lib/page-title";
import { Loader2, Plus } from "lucide-react";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await productsApi.getAll();
      setProducts(res.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Failed to load data.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setPageTitle("Produk");
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await productsApi.delete(productToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Produk berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Gagal menghapus produk.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleView = (id: number) => {
    navigate(`/products/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const columns = createProductColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    hasViewPermission: hasPermission("products.view"),
    hasEditPermission: hasPermission("products.update"),
    hasDeletePermission: hasPermission("products.delete"),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold">
                Produk Perhiasan
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Kelola master data produk perhiasan
              </CardDescription>
            </div>
            {hasPermission("products.create") && (
              <Button onClick={() => navigate("/products/create")} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
                <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Tambah Produk
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Cari produk berdasarkan nama atau barcode..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Produk"
        description="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
