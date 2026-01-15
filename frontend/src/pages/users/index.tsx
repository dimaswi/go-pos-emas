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
import { createUserColumns } from "./columns";
import { usersApi, type User } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setPageTitle } from "@/lib/page-title";
import { Loader2, Plus } from "lucide-react";

export default function UsersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const usersRes = await usersApi.getAll();
      setUsers(usersRes.data.data);
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
    setPageTitle("Users");
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await usersApi.delete(userToDelete);
      toast({
        variant: "success",
        title: "Success!",
        description: "User deleted successfully.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Failed to delete user.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleView = (id: number) => {
    navigate(`/users/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/users/${id}/edit`);
  };

  const handleDeleteUser = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Create columns
  const columns = createUserColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteUser,
    hasViewPermission: hasPermission("users.view"),
    hasEditPermission: hasPermission("users.update"),
    hasDeletePermission: hasPermission("users.delete"),
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
            <div className="space-y-0.5 sm:space-y-1">
              <CardTitle className="text-sm sm:text-base font-semibold">Users</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">
                Manage system users and their permissions
              </CardDescription>
            </div>
            {hasPermission("users.create") && (
              <Button onClick={() => navigate("/users/create")} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
                <Plus className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search users by name, username, or email..."
            pageSize={10}
          />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
