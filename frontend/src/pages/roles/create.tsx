import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { setPageTitle } from "@/lib/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PermissionDetailModal } from "@/components/permission-detail-modal";
import { rolesApi, permissionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Save,
  Shield,
  FileText,
  CheckSquare,
  Info,
  Package,
} from "lucide-react";

export default function RoleCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, any[]>
  >({});
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as number[],
  });

  useEffect(() => {
    setPageTitle("Create Role");
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const response = await permissionsApi.getAll();
      const allPermissions = response.data.data;

      // Group permissions by module
      const grouped = allPermissions.reduce(
        (acc: Record<string, any[]>, permission: any) => {
          const module = permission.module || "Other";
          if (!acc[module]) {
            acc[module] = [];
          }
          acc[module].push(permission);
          return acc;
        },
        {}
      );

      setGroupedPermissions(grouped);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load permissions.",
      });
    }
  };

  const handlePermissionToggle = (permId: number) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter((id) => id !== permId)
        : [...prev.permission_ids, permId],
    }));
  };

  const handleShowPermissionInfo = (permission: any) => {
    setSelectedPermission(permission);
    setShowPermissionModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await rolesApi.create(formData);
      toast({
        variant: "success",
        title: "Success!",
        description: "Role created successfully.",
      });
      setTimeout(() => navigate("/roles"), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to create role.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">
                Informasi Role
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">
                Masukkan detail informasi role baru
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/roles")}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Nama Role
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g., Admin"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi role..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  Permissions
                </Label>
                <Badge variant="secondary" className="text-sm">
                  {formData.permission_ids.length} dipilih
                </Badge>
              </div>

              <div className="border rounded-md bg-card">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedPermissions).map(
                    ([module, modulePermissions]) => {
                      const selectedCount = modulePermissions.filter((p) =>
                        formData.permission_ids.includes(p.id)
                      ).length;
                      const isAllSelected = selectedCount === modulePermissions.length;

                      return (
                        <AccordionItem value={module} key={module} className="border-b last:border-b-0">
                          <div className="bg-muted/30 px-4 flex items-center justify-between group">
                            <AccordionTrigger className="hover:no-underline py-3 flex-1 data-[state=open]:text-primary">
                              <div className="flex items-center gap-2 text-left">
                                <Package className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                                <h4 className="font-semibold text-sm">{module}</h4>
                                <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-xs ml-2">
                                  {selectedCount} / {modulePermissions.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <Button
                              type="button"
                              variant={isAllSelected ? "secondary" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const modulePermIds = modulePermissions.map((p) => p.id);
                                if (isAllSelected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    permission_ids: prev.permission_ids.filter(
                                      (id) => !modulePermIds.includes(id)
                                    ),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    permission_ids: [
                                      ...new Set([
                                        ...prev.permission_ids,
                                        ...modulePermIds,
                                      ]),
                                    ],
                                  }));
                                }
                              }}
                              className="ml-4 text-xs h-7 px-2 z-10"
                            >
                              {isAllSelected ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <AccordionContent className="p-4 bg-background border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {modulePermissions.map((perm) => (
                                <div
                                  key={perm.id}
                                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                    formData.permission_ids.includes(perm.id)
                                      ? "bg-primary/5 border-primary/20"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    id={`perm-${perm.id}`}
                                    className="mt-0.5"
                                    checked={formData.permission_ids.includes(perm.id)}
                                    onCheckedChange={() =>
                                      handlePermissionToggle(perm.id)
                                    }
                                  />
                                  <div className="flex-1 min-w-0">
                                    <label
                                      htmlFor={`perm-${perm.id}`}
                                      className="text-sm font-medium leading-tight cursor-pointer block mb-1.5 truncate"
                                      title={perm.name}
                                    >
                                      {perm.name}
                                    </label>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                        {perm.category}
                                      </Badge>
                                    </div>
                                    {perm.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={perm.description}>
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleShowPermissionInfo(perm)}
                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }
                  )}
                </Accordion>
                {Object.keys(groupedPermissions).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Tidak ada permission tersedia.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/roles")}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Batal</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-9 shrink-0 rounded-lg p-0 w-9 sm:w-auto sm:px-3"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{loading ? 'Menyimpan...' : 'Simpan'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <PermissionDetailModal
        permission={selectedPermission}
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </div>
  );
}
