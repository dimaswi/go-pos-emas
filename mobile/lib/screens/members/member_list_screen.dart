import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/member_service.dart';
import '../../utils/helpers.dart';
import 'member_detail_screen.dart';
import 'create_member_screen.dart';

class MemberListScreen extends StatefulWidget {
  const MemberListScreen({super.key});

  @override
  State<MemberListScreen> createState() => _MemberListScreenState();
}

class _MemberListScreenState extends State<MemberListScreen> {
  final _memberService = MemberService();
  final _searchController = TextEditingController();
  
  List<Member> _members = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  
  String _filterType = 'all';
  String _searchQuery = '';

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

  Future<void> _loadMembers({bool refresh = false, bool loadMore = false}) async {
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
      final members = await _memberService.getMembers(
        page: _currentPage,
        limit: 20,
        type: _filterType == 'all' ? null : _filterType,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (mounted) {
        setState(() {
          if (refresh || !loadMore) {
            _members = members;
          } else {
            _members.addAll(members);
          }
          
          _hasMore = members.length >= 20;
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
    _loadMembers(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Daftar Member'),
        actions: [
          PopupMenuButton<String>(
            icon: Badge(
              isLabelVisible: _filterType != 'all',
              child: const Icon(Icons.filter_list_rounded),
            ),
            onSelected: (value) {
              setState(() => _filterType = value);
              _loadMembers(refresh: true);
            },
            itemBuilder: (context) => [
              _buildFilterItem('all', 'Semua', Icons.people_rounded),
              _buildFilterItem('regular', 'Regular', Icons.person_outline_rounded),
              _buildFilterItem('silver', 'Silver', Icons.workspace_premium_outlined),
              _buildFilterItem('gold', 'Gold', Icons.star_outline_rounded),
              _buildFilterItem('platinum', 'Platinum', Icons.diamond_outlined),
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
                hintText: 'Cari nama, kode member, atau telepon...',
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
                fillColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              onChanged: (value) {
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
          _buildSummary(context),
          
          const SizedBox(height: 8),
          
          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadMembers(refresh: true),
              child: _buildBody(),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateMemberScreen()),
          );
          if (result != null) {
            _loadMembers(refresh: true);
          }
        },
        backgroundColor: AppTheme.primaryColor,
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Tambah'),
      ),
    );
  }

  PopupMenuItem<String> _buildFilterItem(String value, String label, IconData icon) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(
            _filterType == value ? Icons.check_circle : icon,
            color: _filterType == value ? AppTheme.primaryColor : _getTypeColor(value),
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }

  Widget _buildSummary(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final regular = _members.where((m) => m.type == 'regular').length;
    final silver = _members.where((m) => m.type == 'silver').length;
    final gold = _members.where((m) => m.type == 'gold').length;
    final platinum = _members.where((m) => m.type == 'platinum').length;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem('${_members.length}', 'Total', Icons.people_rounded, AppTheme.primaryColor),
          _buildDivider(),
          _buildSummaryItem('$regular', 'Regular', Icons.person_outline, Colors.grey),
          _buildDivider(),
          _buildSummaryItem('$silver', 'Silver', Icons.workspace_premium_outlined, Colors.blueGrey),
          _buildDivider(),
          _buildSummaryItem('$gold', 'Gold', Icons.star_rounded, AppTheme.primaryColor),
          _buildDivider(),
          _buildSummaryItem('$platinum', 'Platinum', Icons.diamond_rounded, Colors.purple),
        ],
      ),
    );
  }

  Widget _buildDivider() => Container(width: 1, height: 40, color: Colors.grey.shade200);

  Widget _buildSummaryItem(String value, String label, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
      ],
    );
  }

  Widget _buildBody() {
    if (_isLoading && _members.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _members.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: TextStyle(color: Colors.grey.shade600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadMembers(refresh: true),
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
            Icon(Icons.people_outline_rounded, size: 80, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('Tidak ada member', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: Colors.grey.shade600)),
            Text('Member akan muncul di sini', style: TextStyle(color: Colors.grey.shade400)),
          ],
        ),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (scrollInfo) {
        if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent && !_isLoading && _hasMore) {
          _loadMembers(loadMore: true);
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _members.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _members.length) {
            return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
          }
          return _buildMemberCard(_members[index], context);
        },
      ),
    );
  }

  Widget _buildMemberCard(Member member, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final typeColor = _getTypeColor(member.type);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => MemberDetailScreen(member: member)),
        ),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar with type badge
              Stack(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: typeColor.withAlpha(30),
                    child: Text(
                      member.name.isNotEmpty ? member.name[0].toUpperCase() : '?',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: typeColor,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: typeColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(_getTypeIcon(member.type), color: Colors.white, size: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            member.name,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: typeColor.withAlpha(30),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            member.type.toUpperCase(),
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: typeColor),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.badge_outlined, size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Text(member.memberCode, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        const SizedBox(width: 12),
                        Icon(Icons.phone_outlined, size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Text(member.phone.isNotEmpty ? member.phone : '-', 
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatChip(Icons.star_rounded, '${member.points} Poin', Colors.amber),
                        const SizedBox(width: 8),
                        _buildStatChip(Icons.shopping_bag_outlined, Helpers.formatCompactCurrency(member.totalPurchase), AppTheme.successColor),
                      ],
                    ),
                  ],
                ),
              ),
              
              const Icon(Icons.chevron_right_rounded, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'silver':
        return Colors.blueGrey;
      case 'gold':
        return AppTheme.primaryColor;
      case 'platinum':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'silver':
        return Icons.workspace_premium_rounded;
      case 'gold':
        return Icons.star_rounded;
      case 'platinum':
        return Icons.diamond_rounded;
      default:
        return Icons.person_rounded;
    }
  }
}
