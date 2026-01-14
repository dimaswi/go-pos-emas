import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/transaction_service.dart';
import '../../utils/helpers.dart';
import 'transaction_detail_screen.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> with SingleTickerProviderStateMixin {
  final _transactionService = TransactionService();
  late TabController _tabController;
  
  List<Transaction> _allTransactions = [];
  List<Transaction> _salesTransactions = [];
  List<Transaction> _purchaseTransactions = [];
  
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  
  String _filterType = 'all';
  String _filterStatus = 'all';
  DateTimeRange? _dateRange;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadTransactions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        switch (_tabController.index) {
          case 0:
            _filterType = 'all';
            break;
          case 1:
            _filterType = 'sale';
            break;
          case 2:
            _filterType = 'purchase';
            break;
        }
        _currentPage = 1;
        _hasMore = true;
      });
      _loadTransactions(refresh: true);
    }
  }

  Future<void> _loadTransactions({bool refresh = false, bool loadMore = false}) async {
    if (_isLoading) return;
    
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }
    
    if (loadMore) {
      if (!_hasMore) return;
      _currentPage++;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final transactions = await _transactionService.getTransactions(
        page: _currentPage,
        limit: 20,
        type: _filterType == 'all' ? null : _filterType,
        status: _filterStatus == 'all' ? null : _filterStatus,
        startDate: _dateRange?.start,
        endDate: _dateRange?.end,
      );

      if (mounted) {
        setState(() {
          if (refresh || !loadMore) {
            _allTransactions = transactions;
          } else {
            _allTransactions.addAll(transactions);
          }
          
          // Filter by type for tabs
          _salesTransactions = _allTransactions.where((t) => t.type == 'sale').toList();
          _purchaseTransactions = _allTransactions.where((t) => t.type == 'purchase').toList();
          
          _hasMore = transactions.length >= 20;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<Transaction> get _currentList {
    switch (_tabController.index) {
      case 1:
        return _salesTransactions;
      case 2:
        return _purchaseTransactions;
      default:
        return _allTransactions;
    }
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: AppTheme.primaryColor),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _dateRange = picked);
      _loadTransactions(refresh: true);
    }
  }

  void _clearDateRange() {
    setState(() => _dateRange = null);
    _loadTransactions(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Riwayat Transaksi'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: isDark ? Colors.white54 : AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'Semua'),
            Tab(text: 'Penjualan'),
            Tab(text: 'Pembelian'),
          ],
        ),
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: _dateRange != null,
              child: const Icon(Icons.date_range_rounded),
            ),
            onPressed: _selectDateRange,
            tooltip: 'Filter Tanggal',
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list_rounded),
            onSelected: (value) {
              setState(() => _filterStatus = value);
              _loadTransactions(refresh: true);
            },
            itemBuilder: (context) => [
              _buildFilterItem('all', 'Semua Status'),
              _buildFilterItem('completed', 'Selesai'),
              _buildFilterItem('pending', 'Pending'),
              _buildFilterItem('cancelled', 'Dibatalkan'),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Date range chip
          if (_dateRange != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Chip(
                    label: Text(
                      '${Helpers.formatDate(_dateRange!.start)} - ${Helpers.formatDate(_dateRange!.end)}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: _clearDateRange,
                  ),
                ],
              ),
            ),
          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadTransactions(refresh: true),
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _buildFilterItem(String value, String label) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(
            _filterStatus == value ? Icons.check_circle : Icons.circle_outlined,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }

  Widget _buildBody() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    if (_isLoading && _allTransactions.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _allTransactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: isDark ? Colors.white38 : Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: TextStyle(color: isDark ? Colors.white54 : Colors.grey.shade600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadTransactions(refresh: true),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    final transactions = _currentList;

    if (transactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 80, color: isDark ? Colors.white24 : Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'Belum ada transaksi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white54 : Colors.grey.shade600,
              ),
            ),
            Text(
              'Transaksi akan muncul di sini',
              style: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade500),
            ),
          ],
        ),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200 &&
            !_isLoading &&
            _hasMore) {
          _loadTransactions(loadMore: true);
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: transactions.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == transactions.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _TransactionCard(
            transaction: transactions[index],
            onTap: () => _openDetail(transactions[index]),
          );
        },
      ),
    );
  }

  void _openDetail(Transaction transaction) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TransactionDetailScreen(transaction: transaction),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  final Transaction transaction;
  final VoidCallback onTap;

  const _TransactionCard({
    required this.transaction,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isSale = transaction.type == 'sale';
    final statusColor = _getStatusColor(transaction.status);

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isDark ? null : AppTheme.cardShadow,
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isSale 
                          ? AppTheme.primaryColor.withOpacity(0.1)
                          : AppTheme.successColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isSale ? Icons.shopping_cart_rounded : Icons.savings_rounded,
                      color: isSale ? AppTheme.primaryColor : AppTheme.successColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                transaction.transactionCode,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _getStatusLabel(transaction.status),
                                style: TextStyle(
                                  color: statusColor,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          transaction.customerName ?? (isSale ? 'Non-Member' : 'Customer'),
                          style: TextStyle(
                            color: isDark ? Colors.white54 : Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          Helpers.formatDateTime(transaction.transactionDate),
                          style: TextStyle(
                            color: isDark ? Colors.white38 : Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Amount
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        isSale ? 'Penjualan' : 'Pembelian',
                        style: TextStyle(
                          color: isDark ? Colors.white38 : Colors.grey.shade500,
                          fontSize: 11,
                        ),
                      ),
                      Text(
                        Helpers.formatCurrency(transaction.grandTotal),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: isSale ? AppTheme.primaryColor : AppTheme.successColor,
                        ),
                      ),
                      Text(
                        '${transaction.items?.length ?? 0} item',
                        style: TextStyle(
                          color: isDark ? Colors.white38 : Colors.grey.shade500,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Bottom bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2D2D44) : Colors.grey.shade50,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Icon(Icons.payment_rounded, size: 16, color: isDark ? Colors.white38 : Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text(
                    _getPaymentMethodLabel(transaction.paymentMethod),
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                      fontSize: 12,
                    ),
                  ),
                  const Spacer(),
                  const Text(
                    'Lihat Detail',
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppTheme.primaryColor),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return AppTheme.successColor;
      case 'pending':
        return AppTheme.warningColor;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Batal';
      default:
        return status;
    }
  }

  String _getPaymentMethodLabel(String method) {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'transfer':
        return 'Transfer';
      case 'debit':
        return 'Debit';
      default:
        return method;
    }
  }
}
