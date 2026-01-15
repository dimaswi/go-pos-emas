import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPageTitle } from "@/lib/page-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createRoleColumns } from "./columns";
import { rolesApi, type Role } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Loader2, Plus } from "lucide-react";

export default function RolesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  useEffect(() => {
    setPageTitle("Roles");
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      setRoles(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load roles.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await rolesApi.delete(roleToDelete);
      toast({
        variant: "success",
        title: "Success!",
        description: "Role deleted successfully.",
      });
      loadRoles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete role.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  // Handle actions
  const handleView = (id: number) => {
    navigate(`/roles/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/roles/${id}/edit`);
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Create columns
  const columns = createRoleColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    hasViewPermission: hasPermission("roles.view"),
    hasEditPermission: hasPermission("roles.update"),
    hasDeletePermission: hasPermission("roles.delete"),
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
              <CardTitle className="text-sm sm:text-base font-semibold">Roles</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Manage roles and permissions
              </CardDescription>
            </div>
            {hasPermission("roles.create") && (
              <Button onClick={() => navigate("/roles/create")} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
                <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <DataTable
            columns={columns}
            data={roles}
            searchPlaceholder="Search roles by name or description..."
            pageSize={10}
          />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
