import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/providers.dart';
import '../../utils/helpers.dart';
import '../../models/models.dart';
import 'widgets/cart_item_card.dart';
import 'widgets/member_search_dialog.dart';
import 'widgets/payment_dialog.dart';
import 'barcode_scan_validator_screen.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Point of Sale'),
        actions: [
          Consumer<POSProvider>(
            builder: (context, pos, _) {
              if (pos.isEmpty) return const SizedBox();
              return IconButton(
                icon: const Icon(Icons.delete_sweep),
                tooltip: 'Kosongkan Keranjang',
                onPressed: () async {
                  final confirm = await Helpers.showConfirmDialog(
                    context,
                    title: 'Kosongkan Keranjang',
                    message: 'Apakah Anda yakin ingin mengosongkan keranjang?',
                  );
                  if (confirm && context.mounted) {
                    context.read<POSProvider>().clearCart();
                  }
                },
              );
            },
          ),
        ],
      ),
      body: const POSScreenBody(),
    );
  }
}

// Separate body widget for reuse in tabs
class POSScreenBody extends StatefulWidget {
  const POSScreenBody({super.key});

  @override
  State<POSScreenBody> createState() => _POSScreenBodyState();
}

class _POSScreenBodyState extends State<POSScreenBody> {
  final _serialController = TextEditingController();

  @override
  void dispose() {
    _serialController.dispose();
    super.dispose();
  }

  Future<void> _scanBarcode() async {
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const UniversalBarcodeScanner(
          returnCodeOnly: true,
        ),
      ),
    );

    if (result != null && result.isNotEmpty && mounted) {
      _addItemBySerial(result);
    }
  }

  Future<void> _addItemBySerial(String serial) async {
    final posProvider = context.read<POSProvider>();
    final success = await posProvider.addItemBySerial(serial);
    
    if (!success && mounted) {
      Helpers.showSnackBar(
        context, 
        posProvider.errorMessage ?? 'Gagal menambahkan item',
        isError: true,
      );
      posProvider.clearError();
    } else if (success && mounted) {
      _serialController.clear();
      Helpers.showSnackBar(context, 'Item berhasil ditambahkan');
    }
  }

  void _showMemberSearch() async {
    final member = await showDialog<Member>(
      context: context,
      builder: (context) => const MemberSearchDialog(),
    );

    if (member != null && mounted) {
      context.read<POSProvider>().setMember(member);
    }
  }

  void _showPaymentDialog() async {
    final appProvider = context.read<AppProvider>();
    final posProvider = context.read<POSProvider>();
    
    if (appProvider.currentLocation == null) {
      Helpers.showSnackBar(context, 'Pilih lokasi terlebih dahulu', isError: true);
      return;
    }

    if (posProvider.isEmpty) {
      Helpers.showSnackBar(context, 'Keranjang masih kosong', isError: true);
      return;
    }

    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => const PaymentDialog(),
    );

    if (result == true && mounted) {
      Helpers.showSnackBar(context, 'Transaksi berhasil!');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Column(
      children: [
        // Input serial / scan barcode
        Container(
          padding: const EdgeInsets.all(16),
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _serialController,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    hintText: 'Masukkan serial number...',
                    hintStyle: TextStyle(color: isDark ? Colors.white54 : null),
                    prefixIcon: Icon(Icons.search, color: isDark ? Colors.white54 : null),
                    suffixIcon: IconButton(
                      icon: Icon(Icons.arrow_forward, color: isDark ? Colors.white54 : null),
                      onPressed: () {
                        if (_serialController.text.isNotEmpty) {
                          _addItemBySerial(_serialController.text.trim());
                        }
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF2D2D44) : null,
                  ),
                  onSubmitted: (value) {
                    if (value.isNotEmpty) {
                      _addItemBySerial(value.trim());
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: _scanBarcode,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ],
          ),
        ),

        // Member selection
        Consumer<POSProvider>(
          builder: (context, pos, _) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: isDark ? const Color(0xFF16162A) : Colors.grey[100],
              child: InkWell(
                onTap: _showMemberSearch,
                child: Row(
                  children: [
                    Icon(
                      Icons.person,
                      color: pos.selectedMember != null 
                          ? AppTheme.primaryColor 
                          : (isDark ? Colors.white54 : Colors.grey),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pos.selectedMember?.name ?? 'Pilih Member (Opsional)',
                            style: TextStyle(
                              fontWeight: pos.selectedMember != null 
                                  ? FontWeight.bold 
                                  : FontWeight.normal,
                              color: pos.selectedMember != null 
                                  ? (isDark ? Colors.white : Colors.black) 
                                  : (isDark ? Colors.white54 : Colors.grey[600]),
                            ),
                          ),
                          if (pos.selectedMember != null)
                            Text(
                              '${pos.selectedMember!.memberCode} • ${pos.selectedMember!.phone}',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white54 : Colors.grey[600],
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (pos.selectedMember != null)
                      IconButton(
                        icon: Icon(Icons.close, size: 20, color: isDark ? Colors.white54 : null),
                        onPressed: () => pos.setMember(null),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      )
                    else
                      Icon(Icons.chevron_right, color: isDark ? Colors.white54 : Colors.grey),
                  ],
                ),
              ),
            );
          },
        ),

        // Cart items
        Expanded(
          child: Consumer<POSProvider>(
            builder: (context, pos, _) {
              if (pos.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_cart_outlined,
                        size: 80,
                        color: isDark ? Colors.white24 : Colors.grey[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Keranjang masih kosong',
                        style: TextStyle(
                          fontSize: 16,
                          color: isDark ? Colors.white54 : Colors.grey[500],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Scan barcode atau masukkan serial number',
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? Colors.white38 : Colors.grey[400],
                        ),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: pos.cartItems.length,
                itemBuilder: (context, index) {
                  final item = pos.cartItems[index];
                  return CartItemCard(
                    item: item,
                    onRemove: () => pos.removeItem(item.stock.id),
                    onDiscountChanged: (discount) {
                      pos.updateItemDiscount(item.stock.id, discount);
                    },
                  );
                },
              );
            },
          ),
        ),

        // Bottom summary & checkout
        Consumer<POSProvider>(
          builder: (context, pos, _) {
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withAlpha(50),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${pos.itemCount} Item',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? Colors.white70 : null,
                          ),
                        ),
                        Text(
                          'Subtotal: ${Helpers.formatCurrency(pos.subTotal)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? Colors.white70 : null,
                          ),
                        ),
                      ],
                    ),
                    if (pos.totalDiscount > 0) ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Diskon',
                            style: TextStyle(fontSize: 14, color: Colors.red),
                          ),
                          Text(
                            '- ${Helpers.formatCurrency(pos.totalDiscount)}',
                            style: const TextStyle(fontSize: 14, color: Colors.red),
                          ),
                        ],
                      ),
                    ],
                    Divider(
                      height: 16,
                      color: isDark ? Colors.white24 : null,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : null,
                          ),
                        ),
                        Text(
                          Helpers.formatCurrency(pos.grandTotal),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: pos.isEmpty ? null : _showPaymentDialog,
                        icon: const Icon(Icons.payment),
                        label: const Text(
                          'BAYAR',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
