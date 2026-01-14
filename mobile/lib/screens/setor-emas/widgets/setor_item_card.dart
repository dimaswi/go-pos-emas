import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../config/theme.dart';
import '../../../models/models.dart';
import '../../../providers/providers.dart';
import '../../../utils/helpers.dart';
import '../setor_emas_screen.dart';

class SetorItemCard extends StatefulWidget {
  final int index;
  final SetorItem item;
  final Function(SetorItem) onUpdate;
  final VoidCallback onRemove;

  const SetorItemCard({
    super.key,
    required this.index,
    required this.item,
    required this.onUpdate,
    required this.onRemove,
  });

  @override
  State<SetorItemCard> createState() => _SetorItemCardState();
}

class _SetorItemCardState extends State<SetorItemCard> {
  late TextEditingController _weightGrossController;
  late TextEditingController _shrinkageController;
  late TextEditingController _weightController;
  late TextEditingController _priceController;
  late TextEditingController _notesController;

  final List<String> _conditions = ['Baik', 'Cukup', 'Rusak'];
  final List<String> _purities = ['24K', '23K', '22K', '21K', '20K', '18K', '17K', '16K', ''];

  @override
  void initState() {
    super.initState();
    _weightGrossController = TextEditingController(
      text: widget.item.weightGross > 0 ? widget.item.weightGross.toString() : '',
    );
    _shrinkageController = TextEditingController(
      text: widget.item.shrinkagePercent > 0 ? widget.item.shrinkagePercent.toString() : '',
    );
    _weightController = TextEditingController(
      text: widget.item.weight > 0 ? widget.item.weight.toString() : '',
    );
    _priceController = TextEditingController(
      text: widget.item.pricePerGram > 0 ? widget.item.pricePerGram.toStringAsFixed(0) : '',
    );
    _notesController = TextEditingController(text: widget.item.notes);
  }

  @override
  void dispose() {
    _weightGrossController.dispose();
    _shrinkageController.dispose();
    _weightController.dispose();
    _priceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _calculateNetWeight() {
    final gross = double.tryParse(_weightGrossController.text) ?? 0;
    final shrinkage = double.tryParse(_shrinkageController.text) ?? 0;
    final netWeight = gross * (1 - shrinkage / 100);
    
    _weightController.text = netWeight.toStringAsFixed(2);
    _updateItem(weight: netWeight);
  }

  void _updateItem({
    GoldCategory? goldCategory,
    String? purity,
    double? weightGross,
    double? shrinkagePercent,
    double? weight,
    double? pricePerGram,
    String? condition,
    String? notes,
  }) {
    widget.onUpdate(widget.item.copyWith(
      goldCategory: goldCategory,
      purity: purity,
      weightGross: weightGross,
      shrinkagePercent: shrinkagePercent,
      weight: weight,
      pricePerGram: pricePerGram,
      condition: condition,
      notes: notes,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final goldCategories = appProvider.goldCategories;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      '${widget.index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Item Setor',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: widget.onRemove,
                ),
              ],
            ),

            const Divider(height: 24),

            // Gold Category
            DropdownButtonFormField<GoldCategory?>(
              value: widget.item.goldCategory,
              decoration: InputDecoration(
                labelText: 'Kategori Emas',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              items: [
                const DropdownMenuItem<GoldCategory?>(
                  value: null,
                  child: Text('Pilih Kategori (Opsional)'),
                ),
                ...goldCategories.map((cat) => DropdownMenuItem(
                  value: cat,
                  child: Text('${cat.name}${cat.purity != null ? ' - ${cat.purity!.toInt()}K' : ''}'),
                )),
              ],
              onChanged: (cat) {
                if (cat != null) {
                  // Auto-fill price and purity from category
                  _priceController.text = cat.buyPrice.toStringAsFixed(0);
                  // Convert double purity (e.g., 24.0) to String format (e.g., "24K")
                  String purityStr = '';
                  if (cat.purity != null) {
                    purityStr = '${cat.purity!.toInt()}K';
                  }
                  _updateItem(
                    goldCategory: cat,
                    purity: purityStr,
                    pricePerGram: cat.buyPrice,
                  );
                } else {
                  _updateItem(goldCategory: cat);
                }
              },
            ),

            const SizedBox(height: 16),

            // Purity (if no category)
            if (widget.item.goldCategory == null)
              DropdownButtonFormField<String>(
                value: widget.item.purity.isEmpty ? '' : widget.item.purity,
                decoration: InputDecoration(
                  labelText: 'Kadar Emas',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: _purities.map((p) => DropdownMenuItem(
                  value: p,
                  child: Text(p.isEmpty ? 'Tidak diketahui' : p),
                )).toList(),
                onChanged: (v) => _updateItem(purity: v ?? ''),
              ),

            if (widget.item.goldCategory == null)
              const SizedBox(height: 16),

            // Weight Gross & Shrinkage
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _weightGrossController,
                    decoration: InputDecoration(
                      labelText: 'Berat Kotor (gr)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (v) {
                      _updateItem(weightGross: double.tryParse(v) ?? 0);
                      _calculateNetWeight();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _shrinkageController,
                    decoration: InputDecoration(
                      labelText: 'Susut (%)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (v) {
                      _updateItem(shrinkagePercent: double.tryParse(v) ?? 0);
                      _calculateNetWeight();
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Net Weight & Price per gram
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _weightController,
                    decoration: InputDecoration(
                      labelText: 'Berat Bersih (gr)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (v) => _updateItem(weight: double.tryParse(v) ?? 0),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _priceController,
                    decoration: InputDecoration(
                      labelText: 'Harga/gram',
                      prefixText: 'Rp ',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (v) => _updateItem(pricePerGram: double.tryParse(v) ?? 0),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Condition
            DropdownButtonFormField<String>(
              value: widget.item.condition,
              decoration: InputDecoration(
                labelText: 'Kondisi Barang',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              items: _conditions.map((c) => DropdownMenuItem(
                value: c,
                child: Text(c),
              )).toList(),
              onChanged: (v) => _updateItem(condition: v ?? 'Baik'),
            ),

            const SizedBox(height: 16),

            // Notes
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Catatan (Opsional)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              onChanged: (v) => _updateItem(notes: v),
            ),

            // Total
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Item:',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  Helpers.formatCurrency(widget.item.totalPrice),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
