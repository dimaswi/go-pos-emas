import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/transaction_service.dart';
import '../../utils/helpers.dart';

class TransactionDetailScreen extends StatefulWidget {
  final Transaction transaction;

  const TransactionDetailScreen({
    super.key,
    required this.transaction,
  });

  @override
  State<TransactionDetailScreen> createState() => _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  final _transactionService = TransactionService();
  Transaction? _transaction;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    try {
      final tx = await _transactionService.getTransaction(widget.transaction.id);
      if (mounted) {
        setState(() {
          _transaction = tx;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        // Use widget.transaction if API fails
        _transaction = widget.transaction;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tx = _transaction ?? widget.transaction;
    final isSale = tx.type == 'sale';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Detail Transaksi'),
        actions: [
          if (tx.status == 'completed')
            IconButton(
              icon: const Icon(Icons.print_rounded),
              onPressed: () {
                // Print receipt
                Helpers.showSnackBar(context, 'Fitur cetak struk coming soon');
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Card
                  _buildHeaderCard(tx, isSale),
                  const SizedBox(height: 16),

                  // Customer Info
                  _buildInfoCard(tx, isSale),
                  const SizedBox(height: 16),

                  // Items
                  _buildItemsCard(tx),
                  const SizedBox(height: 16),

                  // Summary
                  _buildSummaryCard(tx),
                ],
              ),
            ),
    );
  }

  Widget _buildHeaderCard(Transaction tx, bool isSale) {
    final statusColor = _getStatusColor(tx.status);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isSale ? AppTheme.primaryGradient : AppTheme.successGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isSale ? Icons.shopping_cart_rounded : Icons.savings_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isSale ? 'Penjualan' : 'Pembelian',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      tx.transactionCode,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _getStatusLabel(tx.status),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Total ',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
                Text(
                  Helpers.formatCurrency(tx.grandTotal),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
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

  Widget _buildInfoCard(Transaction tx, bool isSale) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark ? null : AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Informasi Transaksi',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow(Icons.calendar_today_rounded, 'Tanggal', Helpers.formatDateTime(tx.transactionDate)),
          _buildInfoRow(Icons.person_rounded, isSale ? 'Pelanggan' : 'Customer', tx.customerName ?? 'Non-Member'),
          if (tx.customerPhone != null && tx.customerPhone!.isNotEmpty)
            _buildInfoRow(Icons.phone_rounded, 'Telepon', tx.customerPhone!),
          _buildInfoRow(Icons.payment_rounded, 'Pembayaran', _getPaymentMethodLabel(tx.paymentMethod)),
          _buildInfoRow(Icons.store_rounded, 'Lokasi', tx.location?.name ?? '-'),
          _buildInfoRow(Icons.badge_rounded, 'Kasir', tx.cashier?.fullName ?? tx.cashier?.username ?? '-'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: isDark ? Colors.white54 : Colors.grey.shade600,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsCard(Transaction tx) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark ? null : AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Detail Item',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${tx.items?.length ?? 0} item',
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (tx.items != null && tx.items!.isNotEmpty)
            ...tx.items!.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return _buildItemRow(index + 1, item);
            })
          else
            Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Tidak ada item',
                  style: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade500),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildItemRow(int index, TransactionItem item) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF2D2D44) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '$index',
                style: const TextStyle(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
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
                  item.itemName,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (item.barcode.isNotEmpty)
                  Text(
                    item.barcode,
                    style: TextStyle(
                      color: isDark ? Colors.white38 : Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                Text(
                  '${item.weight.toStringAsFixed(2)}gr × ${item.quantity}',
                  style: TextStyle(
                    color: isDark ? Colors.white54 : Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Helpers.formatCurrency(item.subTotal),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              if (item.discount > 0)
                Text(
                  '-${Helpers.formatCurrency(item.discount)}',
                  style: const TextStyle(
                    color: AppTheme.errorColor,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(Transaction tx) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark ? null : AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ringkasan Pembayaran',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          _buildSummaryRow('Subtotal', tx.subTotal),
          if (tx.discount > 0)
            _buildSummaryRow('Diskon', -tx.discount, isNegative: true),
          if (tx.tax > 0)
            _buildSummaryRow('Pajak', tx.tax),
          const Divider(height: 24),
          _buildSummaryRow('Grand Total', tx.grandTotal, isBold: true),
          const SizedBox(height: 8),
          _buildSummaryRow('Dibayar', tx.paidAmount),
          if (tx.changeAmount > 0)
            _buildSummaryRow('Kembalian', tx.changeAmount),
          if (tx.notes.isNotEmpty) ...[
            const Divider(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.notes_rounded, size: 18, color: isDark ? Colors.white38 : Colors.grey.shade500),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    tx.notes,
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, double value, {bool isBold = false, bool isNegative = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isDark ? Colors.white54 : Colors.grey.shade600,
              fontSize: isBold ? 15 : 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            isNegative ? '-${Helpers.formatCurrency(value.abs())}' : Helpers.formatCurrency(value),
            style: TextStyle(
              fontSize: isBold ? 16 : 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: isNegative ? AppTheme.errorColor : (isBold ? AppTheme.primaryColor : null),
            ),
          ),
        ],
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
