import 'package:flutter/material.dart';
import '../../../config/theme.dart';
import '../../../services/services.dart';
import '../../../utils/helpers.dart';
import '../setor_emas_screen.dart';

class SetorPaymentDialog extends StatefulWidget {
  final List<SetorItem> items;
  final double grandTotal;
  final int? memberId;
  final String customerName;
  final String customerPhone;
  final int locationId;

  const SetorPaymentDialog({
    super.key,
    required this.items,
    required this.grandTotal,
    this.memberId,
    required this.customerName,
    required this.customerPhone,
    required this.locationId,
  });

  @override
  State<SetorPaymentDialog> createState() => _SetorPaymentDialogState();
}

class _SetorPaymentDialogState extends State<SetorPaymentDialog> {
  final _notesController = TextEditingController();
  String _paymentMethod = 'cash';
  bool _isProcessing = false;

  final _transactionService = TransactionService();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _processPayment() async {
    setState(() => _isProcessing = true);

    try {
      await _transactionService.createPurchase(
        locationId: widget.locationId,
        memberId: widget.memberId,
        customerName: widget.customerName.isNotEmpty ? widget.customerName : null,
        customerPhone: widget.customerPhone.isNotEmpty ? widget.customerPhone : null,
        items: widget.items.map((item) => item.toJson()).toList(),
        paymentMethod: _paymentMethod,
        notes: _notesController.text.isEmpty ? null : _notesController.text,
      );

      if (!mounted) return;

      // Show success
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          icon: const Icon(
            Icons.check_circle,
            color: Colors.green,
            size: 64,
          ),
          title: const Text('Setor Emas Berhasil!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Total Bayar: ${Helpers.formatCurrency(widget.grandTotal)}'),
              const SizedBox(height: 8),
              Text(
                'Metode: ${_paymentMethod == 'cash' ? 'Tunai' : _paymentMethod == 'transfer' ? 'Transfer' : 'Debit'}',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          actions: [
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context); // Close success dialog
                Navigator.pop(context, true); // Close payment dialog
              },
              icon: const Icon(Icons.check),
              label: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        Helpers.showSnackBar(context, e.toString(), isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.payment, color: Colors.white),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Konfirmasi Pembayaran',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Content
            SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        _buildSummaryRow('Jumlah Item', '${widget.items.length} item'),
                        const Divider(height: 16),
                        _buildSummaryRow(
                          'Total Berat',
                          '${widget.items.fold<double>(0, (sum, item) => sum + item.weight).toStringAsFixed(2)} gr',
                        ),
                        const Divider(height: 16),
                        _buildSummaryRow(
                          'Total Bayar ke Customer',
                          Helpers.formatCurrency(widget.grandTotal),
                          isBold: true,
                          valueColor: AppTheme.primaryColor,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Customer info
                  if (widget.customerName.isNotEmpty || widget.memberId != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.person, color: AppTheme.primaryColor),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.customerName,
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                if (widget.customerPhone.isNotEmpty)
                                  Text(
                                    widget.customerPhone,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 20),

                  // Payment method
                  const Text(
                    'Metode Pembayaran',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildPaymentOption('cash', Icons.payments, 'Tunai'),
                      const SizedBox(width: 12),
                      _buildPaymentOption('transfer', Icons.account_balance, 'Transfer'),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Notes
                  TextField(
                    controller: _notesController,
                    decoration: InputDecoration(
                      labelText: 'Catatan (Opsional)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
            ),

            // Actions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withAlpha(30),
                    blurRadius: 5,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isProcessing ? null : () => Navigator.pop(context),
                      child: const Text('Batal'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _processPayment,
                      icon: _isProcessing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.check),
                      label: Text(_isProcessing ? 'Memproses...' : 'Bayar'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: valueColor,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentOption(String value, IconData icon, String label) {
    final isSelected = _paymentMethod == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _paymentMethod = value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor.withAlpha(30) : Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? AppTheme.primaryColor : Colors.transparent,
              width: 2,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
