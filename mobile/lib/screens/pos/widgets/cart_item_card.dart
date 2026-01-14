import 'package:flutter/material.dart';
import '../../../config/theme.dart';
import '../../../providers/pos_provider.dart';
import '../../../utils/helpers.dart';

class CartItemCard extends StatefulWidget {
  final CartItem item;
  final VoidCallback onRemove;
  final Function(double) onDiscountChanged;

  const CartItemCard({
    super.key,
    required this.item,
    required this.onRemove,
    required this.onDiscountChanged,
  });

  @override
  State<CartItemCard> createState() => _CartItemCardState();
}

class _CartItemCardState extends State<CartItemCard> {
  late TextEditingController _discountController;

  @override
  void initState() {
    super.initState();
    _discountController = TextEditingController(
      text: widget.item.discount > 0 
          ? widget.item.discount.toStringAsFixed(0) 
          : '',
    );
  }

  @override
  void didUpdateWidget(CartItemCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update controller only if discount changed externally
    if (oldWidget.item.discount != widget.item.discount) {
      final newText = widget.item.discount > 0 
          ? widget.item.discount.toStringAsFixed(0) 
          : '';
      if (_discountController.text != newText) {
        _discountController.text = newText;
      }
    }
  }

  @override
  void dispose() {
    _discountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Product name & remove button
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Gold icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.diamond,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: 12),
                // Product info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.item.stock.product?.name ?? 'Unknown Product',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.item.stock.serialNumber,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                // Remove button
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.red),
                  onPressed: () async {
                    final confirm = await Helpers.showConfirmDialog(
                      context,
                      title: 'Hapus Item',
                      message: 'Apakah Anda yakin ingin menghapus item ini?',
                    );
                    if (confirm) widget.onRemove();
                  },
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),

            const Divider(height: 16),

            // Details
            Row(
              children: [
                _buildDetailChip(
                  icon: Icons.scale,
                  label: '${widget.item.stock.weight.toStringAsFixed(2)} gr',
                ),
                const SizedBox(width: 8),
                if (widget.item.stock.product?.goldCategory != null)
                  _buildDetailChip(
                    icon: Icons.category,
                    label: widget.item.stock.product!.goldCategory!.name,
                  ),
              ],
            ),

            const SizedBox(height: 12),

            // Price & Discount
            Row(
              children: [
                // Original price
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Harga',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        Helpers.formatCurrency(widget.item.stock.sellingPrice),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                // Discount input
                SizedBox(
                  width: 120,
                  child: TextField(
                    controller: _discountController,
                    decoration: InputDecoration(
                      labelText: 'Diskon',
                      prefixText: 'Rp ',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      final discount = double.tryParse(value) ?? 0;
                      widget.onDiscountChanged(discount);
                    },
                  ),
                ),
              ],
            ),

            // Final price if discount applied
            if (widget.item.discount > 0) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text(
                    'Total: ',
                    style: TextStyle(fontSize: 14),
                  ),
                  Text(
                    Helpers.formatCurrency(widget.item.finalPrice),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }
}
