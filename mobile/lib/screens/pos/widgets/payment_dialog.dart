import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../config/theme.dart';
import '../../../providers/providers.dart';
import '../../../utils/helpers.dart';

class PaymentDialog extends StatefulWidget {
  const PaymentDialog({super.key});

  @override
  State<PaymentDialog> createState() => _PaymentDialogState();
}

class _PaymentDialogState extends State<PaymentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  
  String _paymentMethod = 'cash';
  bool _isProcessing = false;

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<POSProvider>(
      builder: (context, pos, _) {
        return Dialog(
          insetPadding: const EdgeInsets.all(16),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
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
                            'Pembayaran',
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
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
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
                        // Order summary
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              _buildSummaryRow(
                                'Jumlah Item',
                                '${pos.itemCount} item',
                              ),
                              const Divider(height: 16),
                              _buildSummaryRow(
                                'Subtotal',
                                Helpers.formatCurrency(pos.subTotal),
                              ),
                              if (pos.totalDiscount > 0) ...[
                                const SizedBox(height: 8),
                                _buildSummaryRow(
                                  'Diskon',
                                  '- ${Helpers.formatCurrency(pos.totalDiscount)}',
                                  valueColor: Colors.red,
                                ),
                              ],
                              const Divider(height: 16),
                              _buildSummaryRow(
                                'Total Bayar',
                                Helpers.formatCurrency(pos.grandTotal),
                                isBold: true,
                                valueColor: AppTheme.primaryColor,
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
                        _buildPaymentMethodSelector(),

                        const SizedBox(height: 20),

                        // Amount paid
                        TextFormField(
                          controller: _amountController,
                          decoration: InputDecoration(
                            labelText: 'Jumlah Bayar',
                            prefixText: 'Rp ',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Masukkan jumlah bayar';
                            }
                            final amount = double.tryParse(value);
                            if (amount == null || amount < pos.grandTotal) {
                              return 'Jumlah bayar kurang dari total';
                            }
                            return null;
                          },
                        ),

                        // Quick amount buttons
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildQuickAmountButton(pos.grandTotal, 'Uang Pas'),
                            _buildQuickAmountButton(_roundUp(pos.grandTotal, 50000), null),
                            _buildQuickAmountButton(_roundUp(pos.grandTotal, 100000), null),
                          ],
                        ),

                        const SizedBox(height: 20),

                        // Change
                        ValueListenableBuilder(
                          valueListenable: _amountController,
                          builder: (context, value, _) {
                            final paid = double.tryParse(_amountController.text) ?? 0;
                            final change = paid - pos.grandTotal;
                            
                            if (change > 0) {
                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.green.withAlpha(30),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.green.withAlpha(50)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Kembalian',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    Text(
                                      Helpers.formatCurrency(change),
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                            return const SizedBox();
                          },
                        ),

                        const SizedBox(height: 16),

                        // Note
                        TextFormField(
                          controller: _noteController,
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
                            onPressed: _isProcessing 
                                ? null 
                                : () => Navigator.pop(context),
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
                            label: Text(_isProcessing ? 'Memproses...' : 'Selesaikan'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
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

  Widget _buildPaymentMethodSelector() {
    return Row(
      children: [
        Expanded(
          child: _buildPaymentMethodOption(
            'cash',
            Icons.payments,
            'Tunai',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildPaymentMethodOption(
            'transfer',
            Icons.account_balance,
            'Transfer',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildPaymentMethodOption(
            'debit',
            Icons.credit_card,
            'Debit',
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodOption(
    String value,
    IconData icon,
    String label,
  ) {
    final isSelected = _paymentMethod == value;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppTheme.primaryColor.withAlpha(30) 
              : Colors.grey[100],
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
    );
  }

  Widget _buildQuickAmountButton(double amount, String? label) {
    return ActionChip(
      label: Text(label ?? Helpers.formatCurrency(amount)),
      onPressed: () {
        _amountController.text = amount.toStringAsFixed(0);
      },
    );
  }

  double _roundUp(double value, double multiple) {
    return (value / multiple).ceil() * multiple;
  }

  Future<void> _processPayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);

    try {
      final posProvider = context.read<POSProvider>();
      final appProvider = context.read<AppProvider>();
      
      final paidAmount = double.parse(_amountController.text);
      
      final success = await posProvider.checkout(
        paymentMethod: _paymentMethod,
        paidAmount: paidAmount,
        notes: _noteController.text.isEmpty ? null : _noteController.text,
        locationId: appProvider.currentLocation!.id,
      );

      if (!mounted) return;

      if (success) {
        // Show success dialog
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            icon: const Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 64,
            ),
            title: const Text('Transaksi Berhasil!'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Total: ${Helpers.formatCurrency(posProvider.grandTotal)}'),
                if (paidAmount > posProvider.grandTotal)
                  Text(
                    'Kembalian: ${Helpers.formatCurrency(paidAmount - posProvider.grandTotal)}',
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
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
      } else {
        Helpers.showSnackBar(
          context,
          posProvider.errorMessage ?? 'Gagal memproses transaksi',
          isError: true,
        );
        posProvider.clearError();
      }
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
}
