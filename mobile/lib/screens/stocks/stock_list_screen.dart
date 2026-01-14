import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/stock_service.dart';
import '../../utils/helpers.dart';
import 'stock_detail_screen.dart';

class StockListScreen extends StatefulWidget {
  const StockListScreen({super.key});

  @override
  State<StockListScreen> createState() => _StockListScreenState();
}

class _StockListScreenState extends State<StockListScreen> {
  final _stockService = StockService();
  final _searchController = TextEditingController();
  
  List<Stock> _stocks = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  
  String _filterStatus = 'available';
  String _searchQuery = '';
  
  // Track all counts for summary
  int _totalCount = 0;
  int _availableCount = 0;
  int _soldCount = 0;
  
  // Track current location to detect changes
  int? _currentLocationId;

  @override
  void initState() {
    super.initState();
    _loadStocks();
    _loadSummary();
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final appProvider = context.read<AppProvider>();
    final newLocationId = appProvider.currentLocation?.id;
    
    // If location changed, reload data
    if (_currentLocationId != null && _currentLocationId != newLocationId) {
      _currentLocationId = newLocationId;
      _loadStocks(refresh: true);
      _loadSummary();
    } else {
      _currentLocationId = newLocationId;
    }
  }

  Future<void> _loadSummary() async {
    try {
      final appProvider = context.read<AppProvider>();
      // Load all stocks without filter to get counts
      final allStocks = await _stockService.getStocks(
        page: 1,
        limit: 1000,
        locationId: appProvider.currentLocation?.id,
      );
      
      if (mounted) {
        setState(() {
          _totalCount = allStocks.length;
          _availableCount = allStocks.where((s) => s.status == 'available').length;
          _soldCount = allStocks.where((s) => s.status == 'sold').length;
        });
      }
    } catch (e) {
      debugPrint('Failed to load summary: $e');
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadStocks({bool refresh = false, bool loadMore = false}) async {
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
      final appProvider = context.read<AppProvider>();
      final stocks = await _stockService.getStocks(
        page: _currentPage,
        limit: 20,
        status: _filterStatus == 'all' ? null : _filterStatus,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        locationId: appProvider.currentLocation?.id,
      );

      if (mounted) {
        setState(() {
          if (refresh || !loadMore) {
            _stocks = stocks;
          } else {
            _stocks.addAll(stocks);
          }
          
          _hasMore = stocks.length >= 20;
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

  void _onSearch(String query) {
    setState(() => _searchQuery = query);
    _loadStocks(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Daftar Stok'),
        actions: [
          PopupMenuButton<String>(
            icon: Badge(
              isLabelVisible: _filterStatus != 'available',
              child: const Icon(Icons.filter_list_rounded),
            ),
            onSelected: (value) {
              setState(() => _filterStatus = value);
              _loadStocks(refresh: true);
            },
            itemBuilder: (context) => [
              _buildFilterItem('all', 'Semua'),
              _buildFilterItem('available', 'Tersedia'),
              _buildFilterItem('sold', 'Terjual'),
              _buildFilterItem('transferred', 'Dipindahkan'),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Cari serial number, barcode, atau nama...',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          _onSearch('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              onChanged: (value) {
                // Debounce search
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (value == _searchController.text) {
                    _onSearch(value);
                  }
                });
              },
              onSubmitted: _onSearch,
            ),
          ),
          
          // Summary
          _buildSummary(),
          
          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadStocks(refresh: true),
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

  Widget _buildSummary() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark ? null : AppTheme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem(
            '$_totalCount',
            'Total',
            Icons.inventory_2_rounded,
            AppTheme.primaryColor,
          ),
          Container(
            width: 1,
            height: 40,
            color: isDark ? Colors.white24 : Colors.grey.shade200,
          ),
          _buildSummaryItem(
            '$_availableCount',
            'Tersedia',
            Icons.check_circle_rounded,
            AppTheme.successColor,
          ),
          Container(
            width: 1,
            height: 40,
            color: isDark ? Colors.white24 : Colors.grey.shade200,
          ),
          _buildSummaryItem(
            '$_soldCount',
            'Terjual',
            Icons.shopping_cart_rounded,
            AppTheme.warningColor,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String value, String label, IconData icon, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.white54 : Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildBody() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    if (_isLoading && _stocks.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _stocks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: isDark ? Colors.white38 : Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: TextStyle(color: isDark ? Colors.white54 : Colors.grey.shade600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadStocks(refresh: true),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    if (_stocks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 80, color: isDark ? Colors.white24 : Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'Tidak ada stok',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white54 : Colors.grey.shade600,
              ),
            ),
            Text(
              _searchQuery.isNotEmpty ? 'Coba kata kunci lain' : 'Stok akan muncul di sini',
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
          _loadStocks(loadMore: true);
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _stocks.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _stocks.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _StockCard(
            stock: _stocks[index],
            onTap: () => _openDetail(_stocks[index]),
          );
        },
      ),
    );
  }

  void _openDetail(Stock stock) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => StockDetailScreen(stock: stock),
      ),
    );
  }
}

class _StockCard extends StatelessWidget {
  final Stock stock;
  final VoidCallback onTap;

  const _StockCard({
    required this.stock,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _getStatusColor(stock.status);

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
                  // Product Image/Icon
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.diamond_rounded,
                      color: Colors.white,
                      size: 28,
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
                                stock.product?.name ?? 'Unknown Product',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'SN: ${stock.serialNumber}',
                          style: TextStyle(
                            color: isDark ? Colors.white54 : Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          stock.product?.barcode ?? '-',
                          style: TextStyle(
                            color: isDark ? Colors.white38 : Colors.grey.shade500,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status & Price
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _getStatusLabel(stock.status),
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        Helpers.formatCurrency(stock.sellPrice),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
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
                  Icon(Icons.scale_rounded, size: 14, color: isDark ? Colors.white38 : Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text(
                    '${stock.product?.weight.toStringAsFixed(2) ?? '-'}gr',
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.diamond_outlined, size: 14, color: isDark ? Colors.white38 : Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Text(
                    stock.product?.goldCategory?.name ?? '-',
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
      case 'available':
        return AppTheme.successColor;
      case 'sold':
        return AppTheme.warningColor;
      case 'transferred':
        return AppTheme.infoColor;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'sold':
        return 'Terjual';
      case 'transferred':
        return 'Dipindahkan';
      default:
        return status;
    }
  }
}
