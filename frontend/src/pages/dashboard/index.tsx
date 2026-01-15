import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import {
  usersApi,
  rolesApi,
  stocksApi,
  productsApi,
  membersApi,
  transactionsApi,
  locationsApi,
  goldCategoriesApi,
  type Transaction,
  type Member,
  type DailySummary
} from '@/lib/api';
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
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { setPageTitle } from '@/lib/page-title';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
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
  dailySummary: DailySummary | null;
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
    dailySummary: null,
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

  useEffect(() => {
    setPageTitle('Dashboard');
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const [
        usersRes,
        rolesRes,
        stocksRes,
        productsRes,
        membersRes,
        transactionsRes,
        locationsRes,
        goldCategoriesRes,
        dailySummaryRes,
        allTransactionsRes
      ] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
        stocksApi.getAll({ page_size: 1000 }),
        productsApi.getAll({ page_size: 1000 }),
        membersApi.getAll({ page_size: 1000 }),
        transactionsApi.getAll({ page_size: 10 }),
        locationsApi.getAll(),
        goldCategoriesApi.getAll(),
        transactionsApi.getDailySummary(),
        transactionsApi.getAll({ page_size: 1000 }), // Get all transactions for totals
      ]);

      const users = usersRes.data.data || [];
      const roles = rolesRes.data.data || [];
      const stocks = stocksRes.data.data || [];
      const products = productsRes.data.data || [];
      const members = membersRes.data.data || [];
      const transactions = transactionsRes.data.data || [];
      const locations = locationsRes.data.data || [];
      const goldCategories = goldCategoriesRes.data.data || [];
      const dailySummary = dailySummaryRes.data.data || null;
      const allTransactions = allTransactionsRes.data.data || [];

      // Calculate stats
      const activeUsers = users.filter((u: any) => u.is_active).length;
      const availableStocks = stocks.filter((s: any) => s.status === 'available').length;

      // Calculate total sales and purchases all time
      const totalSalesAllTime = allTransactions
        .filter((t: Transaction) => t.type === 'sale' && t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      const totalPurchasesAllTime = allTransactions
        .filter((t: Transaction) => t.type === 'purchase' && t.status === 'completed')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      const totalProfit = totalSalesAllTime - totalPurchasesAllTime;

      // Stocks by status
      const stockStatusMap: Record<string, number> = {};
      stocks.forEach((s: any) => {
        stockStatusMap[s.status] = (stockStatusMap[s.status] || 0) + 1;
      });
      const stocksByStatus = Object.entries(stockStatusMap).map(([status, count]) => ({ status, count }));

      // Stocks by gold category (available stocks only)
      const stockCategoryMap: Record<string, { count: number; weight: number }> = {};
      stocks
        .filter((s: any) => s.status === 'available')
        .forEach((s: any) => {
          const categoryName = s.product?.gold_category?.name || 'Lainnya';
          if (!stockCategoryMap[categoryName]) {
            stockCategoryMap[categoryName] = { count: 0, weight: 0 };
          }
          stockCategoryMap[categoryName].count += 1;
          stockCategoryMap[categoryName].weight += parseFloat(s.weight) || 0;
        });
      const stocksByCategory = Object.entries(stockCategoryMap)
        .map(([name, data]) => ({ name, count: data.count, weight: data.weight }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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

      // Generate weekly transaction data (last 7 days)
      const weeklyTransactions = generateWeeklyData(allTransactions);

      // Generate monthly cash flow data
      const monthlyCashFlow = generateMonthlyCashFlow(allTransactions);

      setStats({
        totalUsers: users.length,
        activeUsers: activeUsers,
        totalRoles: roles.length,
        totalProducts: products.length,
        totalStocks: stocks.length,
        availableStocks: availableStocks,
        totalMembers: members.length,
        totalLocations: locations.length,
        totalGoldCategories: goldCategories.length,
        dailySummary: dailySummary,
        recentTransactions: transactions.slice(0, 5),
        recentMembers: sortedMembers,
        stocksByStatus: stocksByStatus,
        membersByType: membersByType,
        weeklyTransactions: weeklyTransactions,
        totalSalesAllTime,
        totalPurchasesAllTime,
        totalProfit,
        monthlyCashFlow,
        stocksByCategory,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateWeeklyData = (transactions: Transaction[]) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      const dayTransactions = transactions.filter((t: Transaction) => {
        const tDate = new Date(t.transaction_date || t.created_at);
        return tDate.toDateString() === date.toDateString() && t.status === 'completed';
      });

      const sales = dayTransactions
        .filter((t: Transaction) => t.type === 'sale')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      const purchases = dayTransactions
        .filter((t: Transaction) => t.type === 'purchase')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      data.push({
        date: dayName,
        sales: sales / 1000000,
        purchases: purchases / 1000000,
        profit: (sales - purchases) / 1000000,
      });
    }

    return data;
  };

  const generateMonthlyCashFlow = (transactions: Transaction[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      const monthTransactions = transactions.filter((t: Transaction) => {
        const tDate = new Date(t.transaction_date || t.created_at);
        return tDate.getMonth() === monthIndex && tDate.getFullYear() === year && t.status === 'completed';
      });

      const income = monthTransactions
        .filter((t: Transaction) => t.type === 'sale')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      const expense = monthTransactions
        .filter((t: Transaction) => t.type === 'purchase')
        .reduce((sum: number, t: Transaction) => sum + (t.grand_total || 0), 0);

      data.push({
        month: year === currentYear ? months[monthIndex] : `${months[monthIndex]} ${year}`,
        income: income / 1000000,
        expense: expense / 1000000,
      });
    }

    return data;
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

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
                {formatCompactCurrency(stats.dailySummary?.sales_amount || 0)}
              </div>
              <Badge className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 text-[10px] sm:text-xs">
                {stats.dailySummary?.sales_count || 0} trx
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
                {formatCompactCurrency(stats.dailySummary?.purchases_amount || 0)}
              </div>
              <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200 text-[10px] sm:text-xs">
                {stats.dailySummary?.purchases_count || 0} trx
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
                ((stats.dailySummary?.sales_amount || 0) - (stats.dailySummary?.purchases_amount || 0)) >= 0
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-600"
              )}>
                {((stats.dailySummary?.sales_amount || 0) - (stats.dailySummary?.purchases_amount || 0)) >= 0 ? '+' : ''}
                {formatCompactCurrency((stats.dailySummary?.sales_amount || 0) - (stats.dailySummary?.purchases_amount || 0))}
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
    </div>
  );
}
