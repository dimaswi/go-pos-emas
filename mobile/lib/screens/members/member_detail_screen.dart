import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../utils/helpers.dart';

class MemberDetailScreen extends StatelessWidget {
  final Member member;

  const MemberDetailScreen({super.key, required this.member});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            stretch: true,
            backgroundColor: _getTypeColor(member.type),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      _getTypeColor(member.type),
                      _getTypeColor(member.type).withAlpha(180),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 32),
                      // Avatar
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor.withAlpha(50),
                            child: Text(
                              member.name.isNotEmpty ? member.name[0].toUpperCase() : '?',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                            child: Icon(
                              _getTypeIcon(member.type),
                              color: _getTypeColor(member.type),
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Name
                      Text(
                        member.name,
                        style: TextStyle(
                          color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Member code
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: member.memberCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Kode member disalin')),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.badge_outlined, color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                member.memberCode,
                                style: TextStyle(color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(width: 4),
                              Icon(Icons.copy_rounded, color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor, size: 14),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type badge
                  _buildTypeBadge(),
                  const SizedBox(height: 16),
                  
                  // Stats cards
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Poin', '${member.points}', Icons.star_rounded, Colors.amber, context)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Total Beli', Helpers.formatCompactCurrency(member.totalPurchase), Icons.shopping_bag_rounded, AppTheme.successColor, context)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard('Total Jual', Helpers.formatCompactCurrency(member.totalSell), Icons.sell_rounded, Colors.orange, context)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  // Contact info
                  _buildSectionTitle('Informasi Kontak'),
                  _buildInfoCard([
                    _buildInfoRow(Icons.phone_rounded, 'Telepon', member.phone.isNotEmpty ? member.phone : '-'),
                    _buildInfoRow(Icons.email_rounded, 'Email', member.email.isNotEmpty ? member.email : '-'),
                    _buildInfoRow(Icons.location_on_rounded, 'Alamat', member.address.isNotEmpty ? member.address : '-'),
                  ], context),
                  const SizedBox(height: 16),
                  
                  // Personal info
                  _buildSectionTitle('Informasi Personal'),
                  _buildInfoCard([
                    _buildInfoRow(Icons.badge_rounded, 'No. KTP/ID', member.idNumber.isNotEmpty ? member.idNumber : '-'),
                    _buildInfoRow(Icons.cake_rounded, 'Tanggal Lahir', member.birthDate != null ? Helpers.formatDate(member.birthDate!) : '-'),
                    _buildInfoRow(Icons.calendar_today_rounded, 'Bergabung', member.joinDate != null ? Helpers.formatDate(member.joinDate!) : '-'),
                  ], context),
                  const SizedBox(height: 16),
                  
                  // Notes
                  if (member.notes.isNotEmpty) ...[
                    _buildSectionTitle('Catatan'),
                    _buildInfoCard([
                      Builder(
                        builder: (context) {
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          return Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              member.notes,
                              style: TextStyle(color: isDark ? Colors.grey.shade300 : Colors.grey.shade700),
                            ),
                          );
                        },
                      ),
                    ], context),
                    const SizedBox(height: 16),
                  ],
                  
                  // Status
                  _buildStatusSection(context),
                  
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
      
      // Bottom action buttons
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withAlpha(30),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _callMember(context),
                  icon: const Icon(Icons.phone_rounded),
                  label: const Text('Hubungi'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Return member to caller
                    Navigator.pop(context, member);
                  },
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('Pilih Member'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: _getTypeColor(member.type).withAlpha(30),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getTypeColor(member.type).withAlpha(100)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getTypeIcon(member.type), color: _getTypeColor(member.type), size: 20),
          const SizedBox(width: 8),
          Text(
            'Member ${member.type.toUpperCase()}',
            style: TextStyle(
              color: _getTypeColor(member.type),
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: member.isActive ? AppTheme.successColor : Colors.red,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              member.isActive ? 'AKTIF' : 'TIDAK AKTIF',
              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(30),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSection(BuildContext context) {
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
          const Text('Timeline', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (member.createdAt != null)
            _buildTimelineItem(
              Icons.add_circle_rounded,
              'Dibuat',
              Helpers.formatDateTime(member.createdAt!),
              AppTheme.successColor,
              isLast: member.updatedAt == null,
              context: context,
            ),
          if (member.updatedAt != null)
            _buildTimelineItem(
              Icons.update_rounded,
              'Terakhir Diperbarui',
              Helpers.formatDateTime(member.updatedAt!),
              AppTheme.primaryColor,
              isLast: true,
              context: context,
            ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(IconData icon, String title, String time, Color color, {bool isLast = false, required BuildContext context}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(icon, color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor, size: 14),
            ),
            if (!isLast)
              Container(width: 2, height: 30, color: Colors.grey.shade300),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(time, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _callMember(BuildContext context) {
    if (member.phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nomor telepon tidak tersedia')),
      );
      return;
    }
    // In a real app, you would launch the phone dialer
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Menghubungi ${member.phone}')),
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
        return Colors.grey.shade600;
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
