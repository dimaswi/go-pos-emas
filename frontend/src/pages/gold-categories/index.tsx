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
import { createGoldCategoryColumns } from "./columns";
import { goldCategoriesApi, type GoldCategory } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setPageTitle } from "@/lib/page-title";
import { Loader2, Plus } from "lucide-react";

export default function GoldCategoriesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [categories, setCategories] = useState<GoldCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await goldCategoriesApi.getAll();
      setCategories(res.data.data);
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
    setPageTitle("Gold Categories");
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await goldCategoriesApi.delete(categoryToDelete);
      toast({
        variant: "success",
        title: "Success!",
        description: "Gold category deleted successfully.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete gold category.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleView = (id: number) => {
    navigate(`/gold-categories/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/gold-categories/${id}/edit`);
  };

  const handleDelete = (id: number) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const columns = createGoldCategoryColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    hasViewPermission: hasPermission("gold-categories.view"),
    hasEditPermission: hasPermission("gold-categories.update"),
    hasDeletePermission: hasPermission("gold-categories.delete"),
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">
                Kategori Emas
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">
                Kelola klasifikasi kualitas dan harga emas
              </CardDescription>
            </div>
            {hasPermission("gold-categories.create") && (
              <Button
                onClick={() => navigate("/gold-categories/create")}
                size="sm"
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Kategori</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <DataTable
            columns={columns}
            data={categories}
            searchPlaceholder="Cari kategori emas..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Kategori Emas"
        description="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
