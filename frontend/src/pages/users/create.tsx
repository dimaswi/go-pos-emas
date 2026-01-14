import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi, rolesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, User, Mail, Lock, Shield } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function UserCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    full_name: "",
    role_id: "",
  });

  useEffect(() => {
    setPageTitle("Create User");
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      setRoles(response.data.data);
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersApi.create({
        ...formData,
        role_id: parseInt(formData.role_id),
      });
      toast({
        variant: "success",
        title: "Success!",
        description: "User created successfully.",
      });
      setTimeout(() => navigate("/users"), 500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Failed to create user.",
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
                onClick={() => navigate("/users")}
                className="h-9 w-9"
              >
                <ArrowLeft/>
              </Button>
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Informasi User
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan detail informasi user baru
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Nama Lengkap
                </Label>
                <Input
                  id="full_name"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Username
                </Label>
                <Input
                  id="username"
                  required
                  placeholder="Masukkan username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="role_id"
                className="text-xs font-medium flex items-center gap-2"
              >
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Role
              </Label>
              <select
                id="role_id"
                required
                value={formData.role_id}
                onChange={(e) =>
                  setFormData({ ...formData, role_id: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
                className="h-9 text-sm"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 text-sm min-w-24"
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
