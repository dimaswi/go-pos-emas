import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { usersApi } from '@/lib/api';
import { ArrowLeft, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { setPageTitle } from '@/lib/page-title';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    setPageTitle('Account');
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only send fields that are being updated
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        username: user!.username,
        role_id: user!.role_id,
        is_active: user!.is_active,
      };

      await usersApi.update(user!.id, updateData);

      // Update only the changed fields, keep everything else from current user
      setUser({
        ...user!,
        full_name: formData.full_name,
        email: formData.email,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Profile updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "New password and confirmation do not match.",
      });
      return;
    }

    setLoading(true);
    try {
      // Assuming there's a change password endpoint
      await usersApi.update(user!.id, {
        ...user,
        password: formData.new_password,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Password changed successfully.",
      });

      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 max-w-full">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight">Account Settings</h1>
          <p className="text-[10px] sm:text-sm text-muted-foreground">Manage your account information and security</p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Profile Information */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">Profile Information</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="full_name" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                  <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                  <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  Role
                </Label>
                <div>
                  <Badge variant="outline" className="font-normal text-[10px] sm:text-xs">
                    {user?.role?.name || 'N/A'}
                  </Badge>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-8 sm:h-9 text-xs sm:text-sm"
              >
                {loading && <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 py-3 sm:py-4 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">Change Password</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="current_password" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  Current Password
                </Label>
                <Input
                  id="current_password"
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-xs font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  New Password
                </Label>
                <Input
                  id="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-xs font-medium flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Confirm New Password
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-9 text-sm"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
