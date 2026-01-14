import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../utils/helpers.dart';

class StockDetailScreen extends StatelessWidget {
  final Stock stock;
  const StockDetailScreen({super.key, required this.stock});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Detail Stok'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_rounded),
            onPressed: () {
              // Show barcode
              _showBarcodeDialog(context);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            _buildHeaderCard(context),
            const SizedBox(height: 16),

            // Product Info
            _buildProductCard(context),
            const SizedBox(height: 16),

            // Price Info
            _buildPriceCard(context),
            const SizedBox(height: 16),

            // Location Info
            _buildLocationCard(context),
            const SizedBox(height: 16),

            // Timeline
            _buildTimelineCard(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _getStatusColor(stock.status);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.diamond_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stock.product?.name ?? 'Unknown Product',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                          ClipboardData(text: stock.serialNumber),
                        );
                        Helpers.showSnackBar(context, 'Serial number disalin');
                      },
                      child: Row(
                        children: [
                          Text(
                            'SN: ${stock.serialNumber}',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.9),
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.copy_rounded,
                            color: Colors.white.withOpacity(0.7),
                            size: 14,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Status',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _getStatusLabel(stock.status),
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Berat',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${stock.product?.weight.toStringAsFixed(2) ?? '-'} gr',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final product = stock.product;

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
          const Text(
            'Informasi Produk',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            Icons.qr_code_rounded,
            'Barcode',
            product?.barcode ?? '-',
          ),
          _buildInfoRow(
            Icons.category_rounded,
            'Kategori',
            product?.goldCategory?.name ?? '-',
          ),
          _buildInfoRow(
            Icons.diamond_outlined,
            'Kadar',
            '${product?.goldCategory?.purity ?? '-'}',
          ),
          _buildInfoRow(
            Icons.label_rounded,
            'Tipe',
            _getProductTypeLabel(product?.type ?? ''),
          ),
          if (product != null && product.description.isNotEmpty)
            _buildInfoRow(
              Icons.description_rounded,
              'Deskripsi',
              product.description,
            ),
        ],
      ),
    );
  }

  Widget _buildPriceCard(BuildContext context) {
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
          const Text(
            'Informasi Harga',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildPriceItem(
                  'Harga Beli',
                  Helpers.formatCurrency(stock.buyPrice),
                  Colors.orange,
                  Icons.trending_down_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPriceItem(
                  'Harga Jual',
                  Helpers.formatCurrency(stock.sellPrice),
                  AppTheme.primaryColor,
                  Icons.trending_up_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.attach_money_rounded,
                  color: AppTheme.successColor,
                ),
                const SizedBox(width: 8),
                Text(
                  'Margin: ${Helpers.formatCurrency(stock.sellPrice - stock.buyPrice)}',
                  style: const TextStyle(
                    color: AppTheme.successColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceItem(
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationCard(BuildContext context) {
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
          const Text(
            'Lokasi Penyimpanan',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(
            Icons.store_rounded,
            'Lokasi',
            stock.location?.name ?? '-',
          ),
          _buildInfoRow(
            Icons.inventory_rounded,
            'Box',
            stock.storageBox?.name ?? '-',
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(BuildContext context) {
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
          const Text(
            'Riwayat',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          _buildTimelineItem(
            'Dibuat',
            stock.createdAt != null
                ? Helpers.formatDateTime(stock.createdAt!)
                : '-',
            Icons.add_circle_rounded,
            AppTheme.infoColor,
            isFirst: true,
          ),
          if (stock.status == 'sold' && stock.soldAt != null)
            _buildTimelineItem(
              'Terjual',
              Helpers.formatDateTime(stock.soldAt!),
              Icons.shopping_cart_rounded,
              AppTheme.successColor,
              isLast: true,
            ),
          if (stock.status == 'available')
            _buildTimelineItem(
              'Status Saat Ini',
              'Tersedia untuk dijual',
              Icons.check_circle_rounded,
              AppTheme.successColor,
              isLast: true,
            ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(
    String title,
    String subtitle,
    IconData icon,
    Color color, {
    bool isFirst = false,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            if (!isLast)
              Container(width: 2, height: 30, color: Colors.grey.shade300),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(
                subtitle,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
              if (!isLast) const SizedBox(height: 16),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  void _showBarcodeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Barcode'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                children: [
                  const Icon(Icons.qr_code_2_rounded, size: 100),
                  const SizedBox(height: 12),
                  Text(
                    stock.product?.barcode ?? '-',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(
                ClipboardData(text: stock.product?.barcode ?? ''),
              );
              Navigator.pop(context);
              Helpers.showSnackBar(context, 'Barcode disalin');
            },
            child: const Text('Salin'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tutup'),
          ),
        ],
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

  String _getProductTypeLabel(String type) {
    switch (type) {
      case 'gelang':
        return 'Gelang';
      case 'cincin':
        return 'Cincin';
      case 'kalung':
        return 'Kalung';
      case 'anting':
        return 'Anting';
      case 'liontin':
        return 'Liontin';
      default:
        return type;
    }
  }
}
