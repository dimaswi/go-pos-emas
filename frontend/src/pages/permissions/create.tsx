import { useState, useEffect, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { permissionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Lock,
  FileText,
  Package,
  Tag,
  Check,
  ChevronsUpDown,
  Eye,
  PlusCircle,
  Edit,
  Trash,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PermissionCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    module: "",
    category: "",
    description: "",
    action: "", // Single action instead of array
  });

  const [openModule, setOpenModule] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

  // Predefined modules and categories for consistency
  const moduleOptions = [
    "User Management",
    "Role Management",
    "Permission Management",
    "Dashboard",
    "System Settings",
    "Profile Management",
  ];

  const categoryOptions = [
    "Users",
    "Roles",
    "Permissions",
    "Analytics",
    "Settings",
    "Account",
  ];

  const actionSelectOptions = useMemo(
    () => [
      {
        value: "view",
        label: "View",
        description: "Melihat/membaca data",
        icon: <Eye className="h-4 w-4" />,
      },
      {
        value: "create",
        label: "Create",
        description: "Membuat data baru",
        icon: <PlusCircle className="h-4 w-4" />,
      },
      {
        value: "update",
        label: "Update",
        description: "Mengubah data yang ada",
        icon: <Edit className="h-4 w-4" />,
      },
      {
        value: "delete",
        label: "Delete",
        description: "Menghapus data",
        icon: <Trash className="h-4 w-4" />,
      },
      {
        value: "assign",
        label: "Assign",
        description: "Memberikan permission",
        icon: <UserCheck className="h-4 w-4" />,
      },
    ],
    []
  );

  // Generate permission name automatically based on module and action
  const generatePermissionName = (module: string, action: string) => {
    if (!module || !action) return "";

    const moduleMap: { [key: string]: string } = {
      "User Management": "users",
      "Role Management": "roles",
      "Permission Management": "permissions",
      Dashboard: "dashboard",
      "System Settings": "settings",
      "Profile Management": "profile",
    };

    const moduleKey =
      moduleMap[module] || module.toLowerCase().replace(/\s+/g, "_");
    return `${moduleKey}.${action}`;
  };

  // Auto-generate permission name when module or action change
  useEffect(() => {
    if (formData.module && formData.action) {
      const generatedName = generatePermissionName(
        formData.module,
        formData.action
      );
      setFormData((prev) => ({ ...prev, name: generatedName }));
    }
  }, [formData.module, formData.action]);

  useEffect(() => {
    setPageTitle("Create Permission");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        actions: JSON.stringify([formData.action]), // Convert single action to array for backend
      };
      delete (submitData as any).action; // Remove action field, use actions instead

      await permissionsApi.create(submitData);
      toast({
        variant: "success",
        title: "Success!",
        description: "Permission created successfully.",
      });
      setTimeout(() => navigate("/permissions"), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error.response?.data?.error || "Failed to create permission.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 py-4">
          <div className="flex items-center gap-4">
            <div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/permissions")}
                className="h-9 w-9"
              >
                <ArrowLeft/>
              </Button>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Informasi Permission
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan detail informasi permission baru
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Module
                </Label>
                <Popover open={openModule} onOpenChange={setOpenModule}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openModule}
                      className="w-full justify-between h-10"
                    >
                      {formData.module || "Pilih atau ketik module..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Cari atau ketik module baru..."
                        value={formData.module}
                        onValueChange={(value) =>
                          setFormData({ ...formData, module: value })
                        }
                      />
                      <CommandList>
                        <CommandEmpty>
                          Tidak ada module ditemukan. Tekan Enter untuk menambah
                          module baru.
                        </CommandEmpty>
                        <CommandGroup>
                          {moduleOptions.map((module) => (
                            <CommandItem
                              key={module}
                              value={module}
                              onSelect={(currentValue) => {
                                setFormData({
                                  ...formData,
                                  module: currentValue,
                                });
                                setOpenModule(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.module === module
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {module}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Category
                </Label>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCategory}
                      className="w-full justify-between h-10"
                    >
                      {formData.category || "Pilih atau ketik category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Cari atau ketik category baru..."
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      />
                      <CommandList>
                        <CommandEmpty>
                          Tidak ada category ditemukan. Tekan Enter untuk
                          menambah category baru.
                        </CommandEmpty>
                        <CommandGroup>
                          {categoryOptions.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={(currentValue) => {
                                setFormData({
                                  ...formData,
                                  category: currentValue,
                                });
                                setOpenCategory(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.category === category
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Action
              </Label>
              <SearchableSelect
                options={actionSelectOptions}
                value={formData.action}
                onValueChange={(value) =>
                  setFormData({ ...formData, action: value })
                }
                placeholder="Pilih action"
                searchPlaceholder="Cari action..."
                emptyMessage="Action tidak ditemukan"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Nama Permission (Auto-generated, bisa diedit)
              </Label>
              <Input
                id="name"
                required
                placeholder="e.g., users.view"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi permission..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-medium flex items-center gap-2"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Deskripsi
              </Label>
              <Textarea
                id="description"
                required
                placeholder="Deskripsikan apa yang diizinkan oleh permission ini..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/permissions")}
                className="h-10"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 min-w-24"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
