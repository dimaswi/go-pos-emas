import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute as PermissionGuard } from './components/protected-route';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/login'));
const DashboardPage = lazy(() => import('./pages/dashboard/index'));
const AccountPage = lazy(() => import('./pages/account/index'));
const SettingsPage = lazy(() => import('./pages/settings/index'));

// Users
const UsersIndex = lazy(() => import('./pages/users/index'));
const UsersCreate = lazy(() => import('./pages/users/create'));
const UsersEdit = lazy(() => import('./pages/users/edit'));
const UsersShow = lazy(() => import('./pages/users/show'));

// Roles
const RolesIndex = lazy(() => import('./pages/roles/index'));
const RolesCreate = lazy(() => import('./pages/roles/create'));
const RolesEdit = lazy(() => import('./pages/roles/edit'));
const RolesShow = lazy(() => import('./pages/roles/show'));

// Permissions
const PermissionsIndex = lazy(() => import('./pages/permissions/index'));
const PermissionsCreate = lazy(() => import('./pages/permissions/create'));
const PermissionsEdit = lazy(() => import('./pages/permissions/edit'));
const PermissionsShow = lazy(() => import('./pages/permissions/show'));

// Gold Categories
const GoldCategoriesIndex = lazy(() => import('./pages/gold-categories/index'));
const GoldCategoriesCreate = lazy(() => import('./pages/gold-categories/create'));
const GoldCategoriesEdit = lazy(() => import('./pages/gold-categories/edit'));
const GoldCategoriesShow = lazy(() => import('./pages/gold-categories/show'));

// Products
const ProductsIndex = lazy(() => import('./pages/products/index'));
const ProductsCreate = lazy(() => import('./pages/products/create'));
const ProductsEdit = lazy(() => import('./pages/products/edit'));
const ProductsShow = lazy(() => import('./pages/products/show'));

// Locations
const LocationsIndex = lazy(() => import('./pages/locations/index'));
const LocationsCreate = lazy(() => import('./pages/locations/create'));
const LocationsEdit = lazy(() => import('./pages/locations/edit'));
const LocationsShow = lazy(() => import('./pages/locations/show'));

// Storage Boxes
const StorageBoxesIndex = lazy(() => import('./pages/storage-boxes/index'));
const StorageBoxesCreate = lazy(() => import('./pages/storage-boxes/create'));
const StorageBoxesEdit = lazy(() => import('./pages/storage-boxes/edit'));
const StorageBoxesShow = lazy(() => import('./pages/storage-boxes/show'));

// Members
const MembersIndex = lazy(() => import('./pages/members/index'));
const MembersCreate = lazy(() => import('./pages/members/create'));
const MembersEdit = lazy(() => import('./pages/members/edit'));
const MembersShow = lazy(() => import('./pages/members/show'));

// Stocks
const StocksIndex = lazy(() => import('./pages/stocks/index'));
const StocksCreate = lazy(() => import('./pages/stocks/create'));
const StocksEdit = lazy(() => import('./pages/stocks/edit'));
const StocksShow = lazy(() => import('./pages/stocks/show'));
const StocksTransfer = lazy(() => import('./pages/stocks/transfer'));
const LocationMonitor = lazy(() => import('./pages/stocks/location-monitor'));

// Raw Materials (input via Setor Emas only)
const RawMaterialsIndex = lazy(() => import('./pages/raw-materials/index'));
const RawMaterialsEdit = lazy(() => import('./pages/raw-materials/edit'));
const RawMaterialsShow = lazy(() => import('./pages/raw-materials/show'));

// Transactions
const TransactionsIndex = lazy(() => import('./pages/transactions/index'));
const TransactionsShow = lazy(() => import('./pages/transactions/show'));

// POS & Setor Emas
const POSPage = lazy(() => import('./pages/pos/index'));
const POSHistoryPage = lazy(() => import('./pages/pos/history'));
const SetorEmasPage = lazy(() => import('./pages/setor-emas/index'));
const MemberSelectPage = lazy(() => import('./pages/members/select'));

// Reports
const ReportsPage = lazy(() => import('./pages/reports/index'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

// For full-screen pages without sidebar (like POS)
function AuthOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  // Load theme on app start
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* Users */}
          <Route path="/users" element={<ProtectedRoute><UsersIndex /></ProtectedRoute>} />
          <Route path="/users/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="users.create">
                <UsersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/users/:id" element={<ProtectedRoute><UsersShow /></ProtectedRoute>} />
          <Route path="/users/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="users.update">
                <UsersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Roles */}
          <Route path="/roles" element={<ProtectedRoute><RolesIndex /></ProtectedRoute>} />
          <Route path="/roles/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="roles.create">
                <RolesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/roles/:id" element={<ProtectedRoute><RolesShow /></ProtectedRoute>} />
          <Route path="/roles/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="roles.update">
                <RolesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Permissions */}
          <Route path="/permissions" element={<ProtectedRoute><PermissionsIndex /></ProtectedRoute>} />
          <Route path="/permissions/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="permissions.create">
                <PermissionsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/permissions/:id" element={<ProtectedRoute><PermissionsShow /></ProtectedRoute>} />
          <Route path="/permissions/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="permissions.update">
                <PermissionsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Gold Categories */}
          <Route path="/gold-categories" element={<ProtectedRoute><GoldCategoriesIndex /></ProtectedRoute>} />
          <Route path="/gold-categories/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="gold-categories.create">
                <GoldCategoriesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/gold-categories/:id" element={<ProtectedRoute><GoldCategoriesShow /></ProtectedRoute>} />
          <Route path="/gold-categories/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="gold-categories.update">
                <GoldCategoriesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Products */}
          <Route path="/products" element={<ProtectedRoute><ProductsIndex /></ProtectedRoute>} />
          <Route path="/products/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="products.create">
                <ProductsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={<ProtectedRoute><ProductsShow /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="products.update">
                <ProductsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Locations */}
          <Route path="/locations" element={<ProtectedRoute><LocationsIndex /></ProtectedRoute>} />
          <Route path="/locations/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="locations.create">
                <LocationsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/locations/:id" element={<ProtectedRoute><LocationsShow /></ProtectedRoute>} />
          <Route path="/locations/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="locations.update">
                <LocationsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Storage Boxes */}
          <Route path="/storage-boxes" element={<ProtectedRoute><StorageBoxesIndex /></ProtectedRoute>} />
          <Route path="/storage-boxes/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="locations.create">
                <StorageBoxesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/storage-boxes/:id" element={<ProtectedRoute><StorageBoxesShow /></ProtectedRoute>} />
          <Route path="/storage-boxes/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="locations.update">
                <StorageBoxesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Members */}
          <Route path="/members" element={<ProtectedRoute><MembersIndex /></ProtectedRoute>} />
          <Route path="/members/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="members.create">
                <MembersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/members/:id" element={<ProtectedRoute><MembersShow /></ProtectedRoute>} />
          <Route path="/members/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="members.update">
                <MembersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Stocks */}
          <Route path="/stocks" element={<ProtectedRoute><StocksIndex /></ProtectedRoute>} />
          <Route path="/stocks/location-monitor" element={<ProtectedRoute><LocationMonitor /></ProtectedRoute>} />
          <Route path="/stocks/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="stocks.create">
                <StocksCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/stocks/transfer" element={
            <ProtectedRoute>
              <PermissionGuard permission="stocks.transfer">
                <StocksTransfer />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/stocks/:id" element={<ProtectedRoute><StocksShow /></ProtectedRoute>} />
          <Route path="/stocks/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="stocks.update">
                <StocksEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Raw Materials - Input via Setor Emas */}
          <Route path="/raw-materials" element={<ProtectedRoute><RawMaterialsIndex /></ProtectedRoute>} />
          <Route path="/raw-materials/:id" element={<ProtectedRoute><RawMaterialsShow /></ProtectedRoute>} />
          <Route path="/raw-materials/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="raw-materials.update">
                <RawMaterialsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Transactions */}
          <Route path="/transactions" element={<ProtectedRoute><TransactionsIndex /></ProtectedRoute>} />
          <Route path="/transactions/:id" element={<ProtectedRoute><TransactionsShow /></ProtectedRoute>} />
          
          {/* POS & Setor Emas - Full screen pages without AppLayout sidebar */}
          <Route path="/pos" element={
            <AuthOnly>
              <PermissionGuard permission="transactions.sale">
                <POSPage />
              </PermissionGuard>
            </AuthOnly>
          } />
          <Route path="/pos/history" element={
            <AuthOnly>
              <POSHistoryPage />
            </AuthOnly>
          } />
          <Route path="/pos/history/:id" element={
            <AuthOnly>
              <POSHistoryPage />
            </AuthOnly>
          } />
          <Route path="/setor-emas" element={
            <AuthOnly>
              <PermissionGuard permission="transactions.purchase">
                <SetorEmasPage />
              </PermissionGuard>
            </AuthOnly>
          } />
          <Route path="/members/select" element={
            <AuthOnly>
              <MemberSelectPage />
            </AuthOnly>
          } />
          
          {/* Reports */}
          <Route path="/reports" element={
            <ProtectedRoute>
              <PermissionGuard permission="reports.view">
                <ReportsPage />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
      <SonnerToaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
