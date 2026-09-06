import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { setPageTitle, getAppName, setAppFavicon } from '@/lib/page-title';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('Tanah Mas');
  const [appLogo, setAppLogo] = useState('');

  useEffect(() => {
    setPageTitle('Login');
    const savedLogo = localStorage.getItem('appLogo');
    if (savedLogo) setAppLogo(savedLogo);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      const settings = response.data.data;

      if (settings.app_name) {
        setAppName(settings.app_name);
        localStorage.setItem('appName', settings.app_name);
      }
      if (settings.app_subtitle) {
        localStorage.setItem('appSubtitle', settings.app_subtitle);
      }
      if (settings.app_logo) {
        setAppLogo(settings.app_logo);
        localStorage.setItem('appLogo', settings.app_logo);
      }
      if (settings.app_favicon) {
        localStorage.setItem('appFavicon', settings.app_favicon);
        setAppFavicon();
      }
    } catch (error) {
      // Use default if API fails
      setAppName(getAppName());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-0 shadow-sm">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            {appLogo ? (
              <img
                src={(import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8088/api')).replace(/\/api$/, '') + appLogo}
                alt="Logo"
                className="h-8 w-auto object-contain rounded"
              />
            ) : (
              <div className="flex aspect-square size-8 items-center justify-center rounded bg-foreground text-background">
                <Building2 className="size-4" />
              </div>
            )}
            <span className="text-lg font-semibold">{appName}</span>
          </div>
          <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
