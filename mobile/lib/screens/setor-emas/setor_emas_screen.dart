import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../services/services.dart';
import '../../utils/helpers.dart';
import 'widgets/setor_item_card.dart';
import 'widgets/setor_payment_dialog.dart';

class SetorEmasScreen extends StatelessWidget {
  const SetorEmasScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Setor Emas')),
      body: const SetorEmasScreenBody(),
    );
  }
}

class SetorEmasScreenBody extends StatefulWidget {
  const SetorEmasScreenBody({super.key});

  @override
  State<SetorEmasScreenBody> createState() => _SetorEmasScreenBodyState();
}

class _SetorEmasScreenBodyState extends State<SetorEmasScreenBody> {
  final List<SetorItem> _items = [];
  Member? _selectedMember;
  String _customerName = '';
  String _customerPhone = '';

  double get _grandTotal => _items.fold(0, (sum, item) => sum + item.totalPrice);

  void _addNewItem() => setState(() => _items.add(SetorItem()));

  void _removeItem(int index) => setState(() => _items.removeAt(index));

  void _updateItem(int index, SetorItem item) => setState(() => _items[index] = item);

  void _clearAll() => setState(() {
    _items.clear();
    _selectedMember = null;
    _customerName = '';
    _customerPhone = '';
  });

  void _showMemberSearch() async {
    final member = await showDialog<Member>(
      context: context,
      builder: (context) => const _MemberSearchDialog(),
    );
    if (member != null && mounted) {
      setState(() {
        _selectedMember = member;
        _customerName = member.name;
        _customerPhone = member.phone;
      });
    }
  }

  void _showPaymentDialog() async {
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentLocation == null) {
      Helpers.showSnackBar(context, 'Pilih lokasi terlebih dahulu', isError: true);
      return;
    }
    if (_items.isEmpty) {
      Helpers.showSnackBar(context, 'Tambahkan item terlebih dahulu', isError: true);
      return;
    }
    for (int i = 0; i < _items.length; i++) {
      if (_items[i].weight <= 0) {
        Helpers.showSnackBar(context, 'Item ${i + 1}: Berat harus diisi', isError: true);
        return;
      }
      if (_items[i].pricePerGram <= 0) {
        Helpers.showSnackBar(context, 'Item ${i + 1}: Harga per gram harus diisi', isError: true);
        return;
      }
    }
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => SetorPaymentDialog(
        items: _items,
        grandTotal: _grandTotal,
        memberId: _selectedMember?.id,
        customerName: _customerName,
        customerPhone: _customerPhone,
        locationId: appProvider.currentLocation!.id,
      ),
    );
    if (result == true && mounted) {
      Helpers.showSnackBar(context, 'Transaksi setor emas berhasil!');
      _clearAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            children: [
              InkWell(
                onTap: _showMemberSearch,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.person, color: _selectedMember != null ? AppTheme.primaryColor : Colors.grey),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedMember?.name ?? 'Pilih Member / Customer',
                              style: TextStyle(
                                fontWeight: _selectedMember != null ? FontWeight.bold : FontWeight.normal,
                                color: _selectedMember != null ? Colors.black : Colors.grey[600],
                              ),
                            ),
                            if (_selectedMember != null)
                              Text('${_selectedMember!.memberCode} • ${_selectedMember!.phone}',
                                style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                          ],
                        ),
                      ),
                      if (_selectedMember != null)
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => setState(() => _selectedMember = null),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        )
                      else
                        const Icon(Icons.chevron_right, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              if (_selectedMember == null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          labelText: 'Nama Customer',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          isDense: true,
                        ),
                        onChanged: (v) => _customerName = v,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          labelText: 'No. Telepon',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          isDense: true,
                        ),
                        keyboardType: TextInputType.phone,
                        onChanged: (v) => _customerPhone = v,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 80, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      Text('Belum ada item', style: TextStyle(fontSize: 16, color: Colors.grey[500])),
                      const SizedBox(height: 8),
                      Text('Tekan tombol + untuk menambah item setor', style: TextStyle(fontSize: 14, color: Colors.grey[400])),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _items.length,
                  itemBuilder: (context, index) => SetorItemCard(
                    index: index,
                    item: _items[index],
                    onUpdate: (item) => _updateItem(index, item),
                    onRemove: () => _removeItem(index),
                  ),
                ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.grey.withAlpha(50), blurRadius: 10, offset: const Offset(0, -2))],
          ),
          child: SafeArea(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${_items.length} Item'),
                    Text('Total Berat: ${_items.fold<double>(0, (sum, item) => sum + item.weight).toStringAsFixed(2)} gr'),
                  ],
                ),
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Bayar', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text(Helpers.formatCurrency(_grandTotal),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: OutlinedButton.icon(onPressed: _addNewItem, icon: const Icon(Icons.add), label: const Text('Tambah Item'))),
                    const SizedBox(width: 12),
                    Expanded(flex: 2, child: ElevatedButton.icon(
                      onPressed: _items.isEmpty ? null : _showPaymentDialog,
                      icon: const Icon(Icons.check),
                      label: const Text('PROSES', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    )),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class SetorItem {
  GoldCategory? goldCategory;
  String purity;
  double weightGross;
  double shrinkagePercent;
  double weight;
  double pricePerGram;
  String condition;
  String notes;

  SetorItem({
    this.goldCategory,
    this.purity = '',
    this.weightGross = 0,
    this.shrinkagePercent = 0,
    this.weight = 0,
    this.pricePerGram = 0,
    this.condition = 'Baik',
    this.notes = '',
  });

  double get totalPrice => weight * pricePerGram;

  SetorItem copyWith({
    GoldCategory? goldCategory, String? purity, double? weightGross,
    double? shrinkagePercent, double? weight, double? pricePerGram,
    String? condition, String? notes,
  }) => SetorItem(
    goldCategory: goldCategory ?? this.goldCategory,
    purity: purity ?? this.purity,
    weightGross: weightGross ?? this.weightGross,
    shrinkagePercent: shrinkagePercent ?? this.shrinkagePercent,
    weight: weight ?? this.weight,
    pricePerGram: pricePerGram ?? this.pricePerGram,
    condition: condition ?? this.condition,
    notes: notes ?? this.notes,
  );

  Map<String, dynamic> toJson() => {
    'gold_category_id': goldCategory?.id,
    'purity': purity,
    'weight_gross': weightGross,
    'shrinkage_percent': shrinkagePercent,
    'weight': weight,
    'price_per_gram': pricePerGram,
    'condition': condition,
    'notes': notes,
  };
}

class _MemberSearchDialog extends StatefulWidget {
  const _MemberSearchDialog();
  @override
  State<_MemberSearchDialog> createState() => _MemberSearchDialogState();
}

class _MemberSearchDialogState extends State<_MemberSearchDialog> {
  final _searchController = TextEditingController();
  final _memberService = MemberService();
  List<Member> _members = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMembers({String? search}) async {
    setState(() => _isLoading = true);
    try {
      final members = await _memberService.getMembers(search: search);
      if (mounted) setState(() { _members = members; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxHeight: 500),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person_search, color: Colors.white),
                  const SizedBox(width: 12),
                  const Expanded(child: Text('Pilih Member', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold))),
                  IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Cari nama atau kode...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onChanged: (v) { if (v.length >= 2 || v.isEmpty) _loadMembers(search: v.isEmpty ? null : v); },
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _members.isEmpty
                      ? const Center(child: Text('Tidak ada member'))
                      : ListView.builder(
                          itemCount: _members.length,
                          itemBuilder: (context, index) {
                            final member = _members[index];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.primaryColor.withAlpha(30),
                                child: Text(member.name[0].toUpperCase()),
                              ),
                              title: Text(member.name),
                              subtitle: Text('${member.memberCode} • ${member.phone}'),
                              onTap: () => Navigator.pop(context, member),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
