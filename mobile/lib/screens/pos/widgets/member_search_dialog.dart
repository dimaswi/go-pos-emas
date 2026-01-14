import 'package:flutter/material.dart';
import '../../../config/theme.dart';
import '../../../models/models.dart';
import '../../../services/services.dart';

class MemberSearchDialog extends StatefulWidget {
  const MemberSearchDialog({super.key});

  @override
  State<MemberSearchDialog> createState() => _MemberSearchDialogState();
}

class _MemberSearchDialogState extends State<MemberSearchDialog> {
  final _searchController = TextEditingController();
  final _memberService = MemberService();
  List<Member> _members = [];
  bool _isLoading = false;
  String? _error;

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
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final members = await _memberService.getMembers(search: search);
      
      if (mounted) {
        setState(() {
          _members = members;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxHeight: 500),
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
                  const Icon(Icons.person_search, color: Colors.white),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Pilih Member',
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

            // Search box
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Cari nama atau kode member...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            _loadMembers();
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                ),
                onChanged: (value) {
                  if (value.length >= 2 || value.isEmpty) {
                    _loadMembers(search: value.isEmpty ? null : value);
                  }
                },
              ),
            ),

            // Member list
            Expanded(
              child: _buildContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Gagal memuat data',
              style: TextStyle(color: Colors.grey[600]),
            ),
            TextButton(
              onPressed: _loadMembers,
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    if (_members.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person_off, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'Tidak ada member ditemukan',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 16),
      itemCount: _members.length,
      separatorBuilder: (context, index) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final member = _members[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: AppTheme.primaryColor.withAlpha(30),
            child: Text(
              member.name.isNotEmpty ? member.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          title: Text(
            member.name,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          subtitle: Text(
            '${member.memberCode} • ${member.phone}',
            style: const TextStyle(fontSize: 13),
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: member.isActive 
                      ? Colors.green.withAlpha(30) 
                      : Colors.red.withAlpha(30),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  member.isActive ? 'Aktif' : 'Nonaktif',
                  style: TextStyle(
                    fontSize: 11,
                    color: member.isActive ? Colors.green : Colors.red,
                  ),
                ),
              ),
              if (member.totalPurchases > 0)
                Text(
                  '${member.totalPurchases} transaksi',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
            ],
          ),
          onTap: () => Navigator.pop(context, member),
        );
      },
    );
  }
}
