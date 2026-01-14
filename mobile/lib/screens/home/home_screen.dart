import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../services/transaction_service.dart';
import '../../utils/helpers.dart';
import '../pos/pos_tab_screen.dart';
import '../pos/pos_screen.dart';
import '../pos/barcode_scan_validator_screen.dart';
import '../setor-emas/setor_emas_screen.dart';
import '../transactions/transaction_list_screen.dart';
import '../stocks/stock_list_screen.dart';
import '../members/member_list_screen.dart';
import '../reports/report_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardTab(),
    const POSTabScreen(),
    const TransactionListScreen(),
    const StockListScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.dashboard_outlined, Icons.dashboard_rounded, 'Dashboard'),
                _buildNavItem(1, Icons.point_of_sale_outlined, Icons.point_of_sale_rounded, 'POS'),
                _buildNavItem(2, Icons.receipt_long_outlined, Icons.receipt_long_rounded, 'Transaksi'),
                _buildNavItem(3, Icons.inventory_2_outlined, Icons.inventory_2_rounded, 'Stok'),
                _buildNavItem(4, Icons.person_outline_rounded, Icons.person_rounded, 'Profil'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _currentIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        setState(() => _currentIndex = index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 16 : 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected 
                  ? AppTheme.primaryColor 
                  : (isDark ? Colors.white54 : AppTheme.textSecondary),
              size: 24,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final _transactionService = TransactionService();
  
  bool _isLoading = false;
  int _totalSales = 0;
  int _totalPurchases = 0;
  double _salesAmount = 0;
  double _purchasesAmount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().initialize();
      _loadDailySummary();
    });
  }

  Future<void> _loadDailySummary() async {
    setState(() => _isLoading = true);
    
    try {
      final appProvider = context.read<AppProvider>();
      final summary = await _transactionService.getTodaySummary(
        locationId: appProvider.currentLocation?.id,
      );
      
      if (mounted) {
        setState(() {
          _totalSales = summary['total_sales'] ?? 0;
          _totalPurchases = summary['total_purchases'] ?? 0;
          _salesAmount = (summary['sales_amount'] ?? 0).toDouble();
          _purchasesAmount = (summary['purchases_amount'] ?? 0).toDouble();
        });
      }
    } catch (e) {
      debugPrint('Failed to load summary: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final appProvider = context.watch<AppProvider>();
    final user = authProvider.user;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await appProvider.initialize();
          await _loadDailySummary();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Modern App Bar with gradient
            SliverAppBar(
              expandedHeight: 180,
              floating: false,
              pinned: true,
              stretch: true,
              backgroundColor: AppTheme.secondaryColor,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: AppTheme.darkGradient,
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(3),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppTheme.primaryColor,
                                    width: 2,
                                  ),
                                ),
                                child: CircleAvatar(
                                  radius: 22,
                                  backgroundColor: AppTheme.primaryColor.withOpacity(0.2),
                                  child: Text(
                                    Helpers.getInitials(user?.fullName ?? user?.username ?? 'U'),
                                    style: const TextStyle(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Selamat Datang 👋',
                                      style: TextStyle(
                                        color: Colors.white.withOpacity(0.7),
                                        fontSize: 13,
                                      ),
                                    ),
                                    Text(
                                      user?.fullName ?? user?.username ?? 'User',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 17,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Location selector
                              if (appProvider.locations.isNotEmpty)
                                PopupMenuButton<int>(
                                  icon: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.store_rounded,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  ),
                                  tooltip: 'Pilih Lokasi',
                                  onSelected: (locationId) {
                                    final location = appProvider.getLocationById(locationId);
                                    if (location != null) {
                                      appProvider.setCurrentLocation(location);
                                      _loadDailySummary();
                                    }
                                  },
                                  itemBuilder: (context) {
                                    return appProvider.locations.map((location) {
                                      return PopupMenuItem<int>(
                                        value: location.id,
                                        child: Row(
                                          children: [
                                            Icon(
                                              location.id == appProvider.currentLocation?.id
                                                  ? Icons.check_circle
                                                  : Icons.circle_outlined,
                                              color: AppTheme.primaryColor,
                                              size: 20,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(location.name),
                                          ],
                                        ),
                                      );
                                    }).toList();
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          // Location badge
                          if (appProvider.currentLocation != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.location_on,
                                    color: AppTheme.primaryColor,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    appProvider.currentLocation!.name,
                                    style: const TextStyle(
                                      color: AppTheme.primaryColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quick actions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Menu Cepat',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Lihat Semua'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Modern Quick Action Cards
                    Row(
                      children: [
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.point_of_sale_rounded,
                            label: 'Penjualan',
                            subtitle: 'Catat transaksi',
                            gradient: const LinearGradient(
                              colors: [Color(0xFFD4AF37), Color(0xFFB8860B)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const POSScreen()),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.savings_rounded,
                            label: 'Setor Emas',
                            subtitle: 'Beli dari customer',
                            gradient: const LinearGradient(
                              colors: [Color(0xFF10B981), Color(0xFF059669)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const SetorEmasScreen()),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.qr_code_scanner_rounded,
                            label: 'Scan',
                            subtitle: 'Cek produk',
                            gradient: const LinearGradient(
                              colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const BarcodeScanValidatorScreen()),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.people_rounded,
                            label: 'Member',
                            subtitle: 'Kelola pelanggan',
                            gradient: const LinearGradient(
                              colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const MemberListScreen()),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Report Menu
                    Row(
                      children: [
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.assessment_rounded,
                            label: 'Laporan',
                            subtitle: 'Statistik',
                            gradient: const LinearGradient(
                              colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const ReportScreen()),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModernActionCard(
                            icon: Icons.inventory_rounded,
                            label: 'Stok',
                            subtitle: 'Kelola stok',
                            gradient: const LinearGradient(
                              colors: [Color(0xFF64748B), Color(0xFF475569)],
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const StockListScreen()),
                              );
                            },
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 28),

                    // Today's summary
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Ringkasan Hari Ini',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.white
                                : null,
                          ),
                        ),
                        if (_isLoading)
                          const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Summary Cards
                    Container(
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? const Color(0xFF1A1A2E)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: Theme.of(context).brightness == Brightness.dark
                            ? null
                            : AppTheme.cardShadow,
                      ),
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.trending_up_rounded,
                                    iconColor: AppTheme.successColor,
                                    label: 'Penjualan',
                                    value: Helpers.formatCurrency(_salesAmount),
                                    count: '$_totalSales transaksi',
                                  ),
                                ),
                                Container(
                                  width: 1,
                                  height: 60,
                                  color: Theme.of(context).brightness == Brightness.dark
                                      ? Colors.white24
                                      : Colors.grey.shade200,
                                ),
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.trending_down_rounded,
                                    iconColor: Colors.orange,
                                    label: 'Pembelian',
                                    value: Helpers.formatCurrency(_purchasesAmount),
                                    count: '$_totalPurchases transaksi',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Divider(
                            height: 1,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.white24
                                : Colors.grey.shade200,
                          ),
                          // Net Profit
                          _buildNetProfitSection(),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Gold prices
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Harga Emas Hari Ini',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).brightness == Brightness.dark
                                ? Colors.white
                                : null,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '/gram',
                            style: TextStyle(
                              color: AppTheme.primaryDark,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    if (appProvider.goldCategories.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? const Color(0xFF1A1A2E)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: Theme.of(context).brightness == Brightness.dark
                              ? null
                              : AppTheme.cardShadow,
                        ),
                        child: Center(
                          child: Text(
                            'Tidak ada data harga emas',
                            style: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? Colors.white70
                                  : null,
                            ),
                          ),
                        ),
                      )
                    else
                      ...appProvider.goldCategories.map((category) {
                        final isDark = Theme.of(context).brightness == Brightness.dark;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: isDark ? null : AppTheme.cardShadow,
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            leading: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.diamond_rounded, color: Colors.white, size: 24),
                            ),
                            title: Text(
                              category.name,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : null,
                              ),
                            ),
                            subtitle: Text(
                              category.code,
                              style: TextStyle(
                                color: isDark ? Colors.white54 : Colors.grey.shade500,
                                fontSize: 12,
                              ),
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.arrow_downward_rounded, size: 14, color: AppTheme.successColor),
                                    const SizedBox(width: 2),
                                    Text(
                                      Helpers.formatCurrency(category.buyPrice),
                                      style: const TextStyle(
                                        color: AppTheme.successColor,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.arrow_upward_rounded, size: 14, color: AppTheme.primaryColor),
                                    const SizedBox(width: 2),
                                    Text(
                                      Helpers.formatCurrency(category.sellPrice),
                                      style: const TextStyle(
                                        color: AppTheme.primaryColor,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernActionCard({
    required IconData icon,
    required String label,
    required String subtitle,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: (gradient as LinearGradient).colors.first.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required String count,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: isDark ? Colors.white60 : Colors.grey.shade600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: iconColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            count,
            style: TextStyle(
              color: isDark ? Colors.white54 : Colors.grey.shade500,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNetProfitSection() {
    final netAmount = _salesAmount - _purchasesAmount;
    final isProfit = netAmount >= 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isProfit 
            ? AppTheme.successColor.withOpacity(isDark ? 0.15 : 0.05) 
            : Colors.red.withOpacity(isDark ? 0.15 : 0.05),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isProfit ? AppTheme.successColor.withOpacity(0.1) : Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isProfit ? Icons.trending_up_rounded : Icons.trending_down_rounded,
              color: isProfit ? AppTheme.successColor : Colors.red,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isProfit ? 'Laba Bersih' : 'Rugi Bersih',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
                Text(
                  Helpers.formatCurrency(netAmount.abs()),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isProfit ? AppTheme.successColor : Colors.red,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${_totalSales + _totalPurchases} transaksi',
              style: TextStyle(
                color: isDark ? Colors.white60 : Colors.grey.shade600,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
