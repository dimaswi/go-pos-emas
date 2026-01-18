import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import {
  usersApi,
  rolesApi,
  productsApi,
  membersApi,
  goldCategoriesApi,
  dashboardApi,
  type Transaction,
  type Member,
  type UserDashboardData
} from '@/lib/api';
import { PriceUpdateModal } from '@/components/price-update-modal';
import {
  Users,
  Shield,
  Activity,
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Coins,
  MapPin,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Receipt,
  Crown,
  Boxes,
  BarChart3,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Banknote,
  Computer,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { setPageTitle } from '@/lib/page-title';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalProducts: number;
  totalStocks: number;
  availableStocks: number;
  totalMembers: number;
  totalLocations: number;
  totalGoldCategories: number;
  dashboardData: UserDashboardData | null;
  recentTransactions: Transaction[];
  recentMembers: Member[];
  stocksByStatus: { status: string; count: number }[];
  membersByType: { type: string; count: number }[];
  weeklyTransactions: { date: string; sales: number; purchases: number; profit: number }[];
  // New stats
  totalSalesAllTime: number;
  totalPurchasesAllTime: number;
  totalProfit: number;
  monthlyCashFlow: { month: string; income: number; expense: number }[];
  stocksByCategory: { name: string; count: number; weight: number }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)}M`;
  } else if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  } else if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)}rb`;
  }
  return formatCurrency(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

const getTransactionStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getMemberTypeColor = (type: string) => {
  switch (type) {
    case 'platinum':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'gold':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'silver':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  }
};

const CHART_COLORS = {
  sales: 'hsl(142, 76%, 36%)',
  purchases: 'hsl(221, 83%, 53%)',
  profit: 'hsl(45, 93%, 47%)',
  income: '#22c55e',
  expense: '#3b82f6',
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const priceModalCheckedRef = useRef(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalProducts: 0,
    totalStocks: 0,
    availableStocks: 0,
    totalMembers: 0,
    totalLocations: 0,
    totalGoldCategories: 0,
    dashboardData: null,
    recentTransactions: [],
    recentMembers: [],
    stocksByStatus: [],
    membersByType: [],
    weeklyTransactions: [],
    totalSalesAllTime: 0,
    totalPurchasesAllTime: 0,
    totalProfit: 0,
    monthlyCashFlow: [],
    stocksByCategory: [],
  });

  // Initial page load and show price update modal
  useEffect(() => {
    setPageTitle('Dashboard');
    loadDashboardData();

    // Show price update modal once per login session as a reminder
    // Use ref to ensure it only runs once even in Strict Mode
    if (priceModalCheckedRef.current) return;
    priceModalCheckedRef.current = true;

    if (!user?.id) return;

    // Check if user already dismissed the modal in this session
    const dismissedKey = `price_update_dismissed_${user.id}`;
    const dismissedInSession = sessionStorage.getItem(dismissedKey);

    // If already dismissed in this browser session, don't show
    if (dismissedInSession === 'true') {
      return;
    }

    // Always show modal on first dashboard visit after login as reminder
    setShowPriceUpdateModal(true);
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      // First, load dashboard data (this endpoint is always accessible)
      let dashboardData: UserDashboardData | null = null;
      try {
        const dashboardRes = await dashboardApi.getData();
        dashboardData = dashboardRes.data.data || null;
      } catch (error) {
        console.warn('Failed to load dashboard data:', error);
      }

      // Helper function to safely call API and return default on error
      const safeApiCall = async (apiCall: () => Promise<any>): Promise<any> => {
        try {
          return await apiCall();
        } catch (error) {
          // Silently fail - we have dashboardData as fallback
          return { data: { data: [] } };
        }
      };

      // Call optional APIs with error handling - these may fail due to permissions
      // CATATAN: Data stok dan transaksi diambil dari dashboardApi yang sudah difilter per lokasi
      const [
        usersRes,
        rolesRes,
        productsRes,
        membersRes,
        goldCategoriesRes,
      ] = await Promise.all([
        safeApiCall(() => usersApi.getAll()),
        safeApiCall(() => rolesApi.getAll()),
        safeApiCall(() => productsApi.getAll({ page_size: 1000 })),
        safeApiCall(() => membersApi.getAll({ page_size: 1000 })),
        safeApiCall(() => goldCategoriesApi.getAll()),
      ]);

      const users = usersRes?.data?.data || [];
      const roles = rolesRes?.data?.data || [];
      const products = productsRes?.data?.data || [];
      const members = membersRes?.data?.data || [];
      const goldCategories = goldCategoriesRes?.data?.data || [];

      // Calculate stats (hanya yang tidak terikat lokasi)
      const activeUsers = users.filter((u: any) => u.is_active).length;

      // Members by type
      const memberTypeMap: Record<string, number> = {};
      members.forEach((m: any) => {
        const type = m.member_type || m.type || 'regular';
        memberTypeMap[type] = (memberTypeMap[type] || 0) + 1;
      });
      const membersByType = Object.entries(memberTypeMap).map(([type, count]) => ({ type, count }));

      // Recent members (last 5)
      const sortedMembers = [...members].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);

      // Use dashboardData as primary source (it's filtered by user's locations)
      // Fall back to API data if dashboardData is not available
      // PENTING: Semua data transaksi/stok HARUS dari dashboardData yang sudah difilter per lokasi
      setStats({
        totalUsers: users.length,
        activeUsers: activeUsers,
        totalRoles: roles.length,
        totalProducts: products.length,
        // Data stok HANYA dari dashboardData (sudah difilter per lokasi)
        totalStocks: dashboardData?.total_stock ?? 0,
        availableStocks: dashboardData?.available_stock ?? 0,
        totalMembers: dashboardData?.total_members ?? 0,
        totalLocations: dashboardData?.total_locations ?? 0,
        totalGoldCategories: goldCategories.length,
        dashboardData: dashboardData,
        // Transaksi HANYA dari dashboardData
        recentTransactions: dashboardData?.recent_transactions?.length 
          ? dashboardData.recent_transactions.map(t => ({
              id: t.id,
              transaction_code: t.transaction_code,
              type: t.type as 'sale' | 'purchase',
              transaction_date: t.transaction_date,
              grand_total: t.grand_total,
              payment_method: t.payment_method,
              status: t.status,
              location: { name: t.location_name } as any,
              cashier: { full_name: t.cashier_name } as any,
              member: t.member_name ? { name: t.member_name } as any : undefined,
              customer_name: t.customer_name,
            } as Transaction))
          : [],
        recentMembers: sortedMembers,
        stocksByStatus: [], // Tidak pakai karena tidak difilter
        membersByType: membersByType,
        weeklyTransactions: [], // Grafik mingguan perlu endpoint baru yang difilter
        // Data penjualan HANYA dari dashboardData
        totalSalesAllTime: dashboardData?.month_sales ?? 0,
        totalPurchasesAllTime: dashboardData?.month_purchases ?? 0,
        totalProfit: dashboardData 
          ? (dashboardData.month_sales - dashboardData.month_purchases) 
          : 0,
        monthlyCashFlow: [], // Grafik bulanan perlu endpoint baru yang difilter
        stocksByCategory: dashboardData?.stocks_by_category?.length 
          ? dashboardData.stocks_by_category.map(c => ({
              name: c.category_name,
              count: c.count,
              weight: c.total_weight
            }))
          : [],
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigate = useNavigate();

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleToPOS = () => {
    navigate('/pos');
  }

  const quickLinks = [
    { title: 'POS Penjualan', href: '/pos', icon: ShoppingCart, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950' },
    { title: 'Setor Emas', href: '/setor-emas', icon: Coins, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950' },
    { title: 'Daftar Stok', href: '/stocks', icon: Boxes, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950' },
    { title: 'Daftar Member', href: '/members', icon: Users, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  ];

  const chartConfig = {
    sales: { label: 'Penjualan', color: CHART_COLORS.sales },
    purchases: { label: 'Pembelian', color: CHART_COLORS.purchases },
    income: { label: 'Uang Masuk', color: CHART_COLORS.income },
    expense: { label: 'Uang Keluar', color: CHART_COLORS.expense },
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Selamat datang kembali, {user?.full_name}!
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowPriceUpdateModal(true)}
            className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Coins className="h-4 w-4 mr-2" />
            <span className="sm:inline">Update Harga</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleToPOS}
            className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Computer className="h-4 w-4 mr-2" />
            <span className="sm:inline">POS</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            <span className="sm:inline">Refresh</span>
          </Button>
          <Badge variant="outline" className="hidden sm:flex">
            <Clock className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* Warning if user has no assigned locations */}
      {stats.dashboardData && stats.dashboardData.assigned_location_ids?.length === 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Anda belum di-assign ke toko manapun
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Hubungi administrator untuk mengassign Anda ke toko yang sesuai. Data dashboard tidak akan muncul sampai Anda di-assign ke minimal satu toko.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.title} to={link.href} className="group">
              <Card className="shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer">
                <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className={cn(link.bgColor, "p-2 sm:p-2.5 rounded-lg group-hover:scale-110 transition-transform")}>
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", link.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{link.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform hidden sm:block" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Financial Summary Cards - Row 1 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Penjualan Semua Waktu */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Penjualan</span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCompactCurrency(stats.totalSalesAllTime)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Seluruh waktu</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Pembelian/Setor Emas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Setor Emas</span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCompactCurrency(stats.totalPurchasesAllTime)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Seluruh waktu</p>
            </div>
          </CardContent>
        </Card>

        {/* Pendapatan Bersih */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Pendapatan Bersih</span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className={cn("text-lg sm:text-2xl font-bold", stats.totalProfit >= 0 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600")}>
                {stats.totalProfit >= 0 ? '+' : ''}{formatCompactCurrency(stats.totalProfit)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Penjualan - Setor</p>
            </div>
          </CardContent>
        </Card>

        {/* Stok Tersedia */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Stok Tersedia</span>
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold">{formatNumber(stats.availableStocks)}</div>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  dari {formatNumber(stats.totalStocks)}
                </Badge>
                <Progress
                  value={stats.totalStocks > 0 ? (stats.availableStocks / stats.totalStocks) * 100 : 0}
                  className="h-1 sm:h-1.5 w-10 sm:w-16"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Cards - Row 2 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Penjualan Hari Ini */}
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Jual Hari Ini</span>
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCompactCurrency(stats.dashboardData?.today_sales || 0)}
              </div>
              <Badge className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 text-[10px] sm:text-xs">
                {stats.dashboardData?.today_sales_count || 0} trx
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pembelian Hari Ini */}
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Setor Hari Ini</span>
              <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCompactCurrency(stats.dashboardData?.today_purchases || 0)}
              </div>
              <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 text-[10px] sm:text-xs">
                {stats.dashboardData?.today_purchases_count || 0} trx
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profit Hari Ini */}
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">Profit Hari Ini</span>
              <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className={cn("text-lg sm:text-2xl font-bold",
                ((stats.dashboardData?.today_sales || 0) - (stats.dashboardData?.today_purchases || 0)) >= 0
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-600"
              )}>
                {((stats.dashboardData?.today_sales || 0) - (stats.dashboardData?.today_purchases || 0)) >= 0 ? '+' : ''}
                {formatCompactCurrency((stats.dashboardData?.today_sales || 0) - (stats.dashboardData?.today_purchases || 0))}
              </div>
              <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">Jual - Setor</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Member */}
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Total Member</span>
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
              <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{formatNumber(stats.totalMembers)}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {stats.membersByType.slice(0, 2).map((m) => (
                  <Badge key={m.type} variant="secondary" className="text-[9px] sm:text-[10px] capitalize bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                    {m.type}: {m.count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section with Tabs */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <Tabs defaultValue="weekly" className="w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Grafik Keuangan
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Uang Masuk vs Uang Keluar</CardDescription>
                </div>
                <TabsList className="h-7 sm:h-8">
                  <TabsTrigger value="weekly" className="text-[10px] sm:text-xs px-2 sm:px-3">Mingguan</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-[10px] sm:text-xs px-2 sm:px-3">Bulanan</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="weekly" className="mt-4">
                <ChartContainer config={chartConfig} className="h-[200px] sm:h-[280px] w-full">
                  <BarChart data={stats.weeklyTransactions} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-[10px] sm:text-xs" tickFormatter={(value) => `${value}jt`} tick={{ fontSize: 10 }} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`Rp ${value.toFixed(1)} jt`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="sales" name="Penjualan" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Setor Emas" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="monthly" className="mt-4">
                <ChartContainer config={chartConfig} className="h-[200px] sm:h-[280px] w-full">
                  <BarChart data={stats.monthlyCashFlow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-[10px] sm:text-xs" tickFormatter={(value) => `${value}jt`} tick={{ fontSize: 10 }} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`Rp ${value.toFixed(1)} jt`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="income" name="Uang Masuk" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Uang Keluar" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Stock by Category */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Stok per Kategori Emas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Top 5 kategori (tersedia)</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {stats.stocksByCategory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Boxes className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada data stok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.stocksByCategory.map((item, index) => {
                  const maxCount = Math.max(...stats.stocksByCategory.map(s => s.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="text-xs">{item.weight.toFixed(2)}g</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.count} pcs
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{ 
                          ['--progress-background' as string]: PIE_COLORS[index % PIE_COLORS.length] 
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Stok Tersedia</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {stats.stocksByCategory.reduce((sum, item) => sum + item.count, 0)} pcs
                </Badge>
                <Badge variant="outline">
                  {stats.stocksByCategory.reduce((sum, item) => sum + item.weight, 0).toFixed(2)}g
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Transaksi Terbaru
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">5 transaksi terakhir</CardDescription>
              </div>
              <Link to="/pos/history">
                <Button variant="ghost" size="sm" className="text-xs h-7 sm:h-8">
                  <span className="hidden sm:inline">Lihat Semua</span>
                  <ChevronRight className="h-3 w-3 sm:ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {stats.recentTransactions.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {stats.recentTransactions.map((transaction) => (
                  <Link
                    key={transaction.id}
                    to={`/pos/history/${transaction.id}`}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "p-1.5 sm:p-2 rounded-lg flex-shrink-0",
                        transaction.type === 'sale'
                          ? 'bg-green-50 dark:bg-green-950'
                          : 'bg-blue-50 dark:bg-blue-950'
                      )}>
                        {transaction.type === 'sale' ? (
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{transaction.transaction_code}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {transaction.customer_name || transaction.member?.name || 'Umum'} • {' '}
                          {new Date(transaction.transaction_date || transaction.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={cn(
                        "text-xs sm:text-sm font-semibold",
                        transaction.type === 'sale' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      )}>
                        {transaction.type === 'sale' ? '+' : '-'}{formatCompactCurrency(transaction.grand_total || 0)}
                      </p>
                      <Badge variant="outline" className={cn("text-[8px] sm:text-[10px]", getTransactionStatusColor(transaction.status))}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info & Member Stats */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ringkasan Sistem
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Informasi cepat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
            {/* System Stats */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="text-xs sm:text-sm">Pengguna Aktif</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats.activeUsers}/{stats.totalUsers}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs sm:text-sm">Role</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats.totalRoles}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  <span className="text-xs sm:text-sm">Produk</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats.totalProducts}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  <span className="text-xs sm:text-sm">Lokasi</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats.totalLocations}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                  <span className="text-xs sm:text-sm">Kategori Emas</span>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">{stats.totalGoldCategories}</Badge>
              </div>
            </div>

            <Separator />

            {/* Member Types Distribution */}
            <div>
              <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                Tipe Member
              </p>
              <div className="space-y-1.5 sm:space-y-2">
                {stats.membersByType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <Badge className={cn("capitalize text-[10px] sm:text-xs", getMemberTypeColor(item.type))}>
                      {item.type}
                    </Badge>
                    <span className="text-xs sm:text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b bg-muted/50 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base font-semibold">Profil Anda</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Informasi akun</CardDescription>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base sm:text-lg truncate">{user?.full_name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] sm:text-xs">{user?.role?.name || 'N/A'}</Badge>
                <Badge className={cn("text-[10px] sm:text-xs", user?.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700')}>
                  {user?.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
            <Link to="/account" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                Edit Profil
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Price Update Modal */}
      <PriceUpdateModal
        open={showPriceUpdateModal}
        onOpenChange={(open) => {
          setShowPriceUpdateModal(open);
          // If closing the modal (dismissed), save to sessionStorage so it won't auto-show again in this session
          if (!open && user?.id) {
            const dismissedKey = `price_update_dismissed_${user.id}`;
            sessionStorage.setItem(dismissedKey, 'true');
          }
        }}
        onSuccess={() => {
          loadDashboardData(true);
        }}
      />
    </div>
  );
}
