import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/transaction_service.dart';
import '../../utils/helpers.dart';
import '../transactions/transaction_detail_screen.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> with SingleTickerProviderStateMixin {
  final _transactionService = TransactionService();
  late TabController _tabController;
  
  // Date range
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  String _selectedPeriod = 'today';
  
  // Data
  Map<String, dynamic> _todaySummary = {};
  List<Transaction> _salesTransactions = [];
  List<Transaction> _purchaseTransactions = [];
  bool _isLoading = false;
  
  // Track location
  int? _currentLocationId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final appProvider = context.read<AppProvider>();
    final newLocationId = appProvider.currentLocation?.id;
    
    if (_currentLocationId != null && _currentLocationId != newLocationId) {
      _currentLocationId = newLocationId;
      _loadData();
    } else {
      _currentLocationId = newLocationId;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _selectPeriod(String period) {
    final now = DateTime.now();
    setState(() {
      _selectedPeriod = period;
      switch (period) {
        case 'today':
          _startDate = now;
          _endDate = now;
          break;
        case 'yesterday':
          _startDate = now.subtract(const Duration(days: 1));
          _endDate = now.subtract(const Duration(days: 1));
          break;
        case 'week':
          _startDate = now.subtract(Duration(days: now.weekday - 1));
          _endDate = now;
          break;
        case 'month':
          _startDate = DateTime(now.year, now.month, 1);
          _endDate = now;
          break;
        case 'custom':
          break;
      }
    });
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final appProvider = context.read<AppProvider>();
      final locationId = appProvider.currentLocation?.id;
      
      // Load summary
      final summary = await _transactionService.getDailySummary(
        date: _startDate,
        locationId: locationId,
      );
      
      // Load sales transactions
      final sales = await _transactionService.getTransactions(
        type: 'sale',
        status: 'completed',
        locationId: locationId,
        startDate: _startDate,
        endDate: _endDate.add(const Duration(days: 1)),
      );
      
      // Load purchase transactions
      final purchases = await _transactionService.getTransactions(
        type: 'purchase',
        status: 'completed',
        locationId: locationId,
        startDate: _startDate,
        endDate: _endDate.add(const Duration(days: 1)),
      );
      
      if (mounted) {
        setState(() {
          _todaySummary = summary;
          _salesTransactions = sales;
          _purchaseTransactions = purchases;
        });
      }
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
        _selectedPeriod = 'custom';
      });
      _loadData();
    }
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Laporan'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Ringkasan'),
            Tab(text: 'Penjualan'),
            Tab(text: 'Pembelian'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Period Selector
          _buildPeriodSelector(context),
          
          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildSummaryTab(),
                _buildSalesTab(),
                _buildPurchasesTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodSelector(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildPeriodChip('today', 'Hari Ini'),
                const SizedBox(width: 8),
                _buildPeriodChip('yesterday', 'Kemarin'),
                const SizedBox(width: 8),
                _buildPeriodChip('week', 'Minggu Ini'),
                const SizedBox(width: 8),
                _buildPeriodChip('month', 'Bulan Ini'),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: Icon(
                    Icons.date_range_rounded,
                    size: 18,
                    color: _selectedPeriod == 'custom' ? Colors.white : AppTheme.primaryColor,
                  ),
                  label: Text(
                    _selectedPeriod == 'custom' 
                        ? '${DateFormat('d/M').format(_startDate)} - ${DateFormat('d/M').format(_endDate)}'
                        : 'Pilih Tanggal',
                  ),
                  backgroundColor: _selectedPeriod == 'custom' ? AppTheme.primaryColor : null,
                  labelStyle: TextStyle(
                    color: _selectedPeriod == 'custom' ? Colors.white : null,
                  ),
                  onPressed: _selectDateRange,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today_rounded, size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  _startDate == _endDate
                      ? DateFormat('EEEE, d MMMM yyyy', 'id').format(_startDate)
                      : '${DateFormat('d MMM', 'id').format(_startDate)} - ${DateFormat('d MMM yyyy', 'id').format(_endDate)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodChip(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => _selectPeriod(value),
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : null,
        fontWeight: isSelected ? FontWeight.w600 : null,
      ),
    );
  }

  Widget _buildSummaryTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    final salesAmount = _toDouble(_todaySummary['sales_amount']);
    final purchasesAmount = _toDouble(_todaySummary['purchases_amount']);
    final netAmount = _toDouble(_todaySummary['net_amount']);
    final totalSales = _todaySummary['total_sales'] ?? 0;
    final totalPurchases = _todaySummary['total_purchases'] ?? 0;
    
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Summary Cards
            Row(
              children: [
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Total Penjualan',
                    amount: salesAmount,
                    count: totalSales,
                    icon: Icons.trending_up_rounded,
                    color: AppTheme.successColor,
                    context: context,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Total Pembelian',
                    amount: purchasesAmount,
                    count: totalPurchases,
                    icon: Icons.trending_down_rounded,
                    color: AppTheme.warningColor,
                    context: context,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Net Amount Card
            _buildNetCard(netAmount),
            
            const SizedBox(height: 24),
            
            // Quick Stats Table
            _buildQuickStatsTable(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required double amount,
    required int count,
    required IconData icon,
    required Color color,
    required BuildContext context,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$count tx',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            Helpers.formatCurrency(amount),
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNetCard(double netAmount) {
    final isPositive = netAmount >= 0;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isPositive 
            ? const LinearGradient(colors: [Color(0xFF2E7D32), Color(0xFF43A047)])
            : const LinearGradient(colors: [Color(0xFFC62828), Color(0xFFE53935)]),
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isPositive ? Icons.trending_up_rounded : Icons.trending_down_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pendapatan Bersih',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  Helpers.formatCurrency(netAmount.abs()),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            isPositive ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
            color: Colors.white,
            size: 32,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStatsTable(BuildContext context) {
     final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Ringkasan Transaksi',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const Divider(height: 1),
          _buildTableRow('Total Transaksi Masuk (Penjualan)', '${_salesTransactions.length}', AppTheme.successColor),
          _buildTableRow('Total Transaksi Keluar (Pembelian)', '${_purchaseTransactions.length}', AppTheme.warningColor),
          const Divider(height: 1),
          _buildTableRow(
            'Total Nilai Masuk', 
            Helpers.formatCurrency(_salesTransactions.fold(0.0, (sum, t) => sum + t.grandTotal)),
            AppTheme.successColor,
          ),
          _buildTableRow(
            'Total Nilai Keluar', 
            Helpers.formatCurrency(_purchaseTransactions.fold(0.0, (sum, t) => sum + t.grandTotal)),
            AppTheme.warningColor,
          ),
          const Divider(height: 1),
          _buildTableRow(
            'Selisih Bersih', 
            Helpers.formatCurrency(
              _salesTransactions.fold(0.0, (sum, t) => sum + t.grandTotal) -
              _purchaseTransactions.fold(0.0, (sum, t) => sum + t.grandTotal)
            ),
            AppTheme.primaryColor,
            isBold: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTableRow(String label, String value, Color color, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade700,
                fontWeight: isBold ? FontWeight.w600 : null,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: isBold ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSalesTab() {
    return _buildTransactionList(_salesTransactions, 'Penjualan', AppTheme.successColor);
  }

  Widget _buildPurchasesTab() {
    return _buildTransactionList(_purchaseTransactions, 'Pembelian', AppTheme.warningColor);
  }

  Widget _buildTransactionList(List<Transaction> transactions, String title, Color color) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (transactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'Tidak ada transaksi $title',
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }
    
    final totalAmount = transactions.fold(0.0, (sum, t) => sum + t.grandTotal);
    
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: Column(
        children: [
          // Summary Header
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total $title',
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Helpers.formatCurrency(totalAmount),
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${transactions.length} transaksi',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Transaction Table
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(12),
                boxShadow: AppTheme.cardShadow,
              ),
              child: Column(
                children: [
                  // Table Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F0F1A) : Colors.grey.shade100,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    ),
                    child: const Row(
                      children: [
                        Expanded(flex: 2, child: Text('Kode', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                        Expanded(flex: 2, child: Text('Waktu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                        Expanded(flex: 2, child: Text('Customer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                        Expanded(flex: 2, child: Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12), textAlign: TextAlign.right)),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  // Table Body
                  Expanded(
                    child: ListView.separated(
                      itemCount: transactions.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final tx = transactions[index];
                        return InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => TransactionDetailScreen(transaction: tx),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    tx.transactionCode,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    DateFormat('HH:mm').format(tx.transactionDate),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    tx.member?.name ?? tx.customerName ?? '-',
                                    style: const TextStyle(fontSize: 11),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Text(
                                    Helpers.formatCurrency(tx.grandTotal),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: color,
                                    ),
                                    textAlign: TextAlign.right,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
