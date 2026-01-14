import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/member_service.dart';
import '../../utils/helpers.dart';

class CreateMemberScreen extends StatefulWidget {
  const CreateMemberScreen({super.key});

  @override
  State<CreateMemberScreen> createState() => _CreateMemberScreenState();
}

class _CreateMemberScreenState extends State<CreateMemberScreen> {
  final _formKey = GlobalKey<FormState>();
  final _memberService = MemberService();
  
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _notesController = TextEditingController();
  
  DateTime? _birthDate;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _idNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(1990, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: AppTheme.primaryColor),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _birthDate = picked);
    }
  }

  Future<void> _saveMember() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Format birth_date properly for Go backend (RFC3339 with timezone)
      String? birthDateStr;
      if (_birthDate != null) {
        // Convert to UTC and format as RFC3339
        birthDateStr = _birthDate!.toUtc().toIso8601String();
      }
      
      final member = await _memberService.createMember({
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'address': _addressController.text.trim(),
        'id_number': _idNumberController.text.trim(),
        if (birthDateStr != null) 'birth_date': birthDateStr,
        'notes': _notesController.text.trim(),
      });

      if (mounted) {
        Helpers.showSnackBar(context, 'Member berhasil dibuat');
        Navigator.pop(context, member);
      }
    } catch (e) {
      if (mounted) {
        Helpers.showSnackBar(context, 'Gagal membuat member: $e', isError: true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF121212) : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Tambah Member Baru'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor.withAlpha(50),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.person_add_rounded, color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor, size: 32),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Builder(
                            builder: (context) {
                              final isDark = Theme.of(context).brightness == Brightness.dark;
                              return Text(
                                'Member Baru',
                                style: TextStyle(
                                  color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 4),
                          const Text('Isi data member untuk mendaftar', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Form fields
              _buildSectionTitle('Informasi Utama'),
              _buildTextField(
                controller: _nameController,
                label: 'Nama Lengkap',
                icon: Icons.person_rounded,
                validator: (v) => v == null || v.isEmpty ? 'Nama wajib diisi' : null,
                context: context,
              ),
              _buildTextField(
                controller: _phoneController,
                label: 'Nomor Telepon',
                icon: Icons.phone_rounded,
                keyboardType: TextInputType.phone,
                hint: '08xxxxxxxxxx',
                context: context,
              ),
              _buildTextField(
                controller: _emailController,
                label: 'Email',
                icon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
                context: context,
              ),
              
              const SizedBox(height: 16),
              _buildSectionTitle('Data Pribadi'),
              _buildTextField(
                controller: _idNumberController,
                label: 'Nomor KTP/ID',
                icon: Icons.badge_rounded,
                keyboardType: TextInputType.number,
                context: context,
              ),
              
              // Birth date picker
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: _selectBirthDate,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withAlpha(20),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.cake_rounded, color: AppTheme.primaryColor, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tanggal Lahir', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              const SizedBox(height: 4),
                              Text(
                                _birthDate != null ? Helpers.formatDate(_birthDate!) : 'Pilih tanggal',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: _birthDate != null ? Colors.black : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.calendar_today_rounded, color: Colors.grey.shade400, size: 20),
                      ],
                    ),
                  ),
                ),
              ),
              
              _buildTextField(
                controller: _addressController,
                label: 'Alamat',
                icon: Icons.location_on_rounded,
                maxLines: 2,
                context: context,
              ),
              
              const SizedBox(height: 16),
              _buildSectionTitle('Catatan'),
              _buildTextField(
                controller: _notesController,
                label: 'Catatan (opsional)',
                icon: Icons.note_rounded,
                maxLines: 3,
                context: context,
              ),

              const SizedBox(height: 32),
              
              // Submit button
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _saveMember,
                  icon: _isLoading 
                    ? SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,),
                      )
                    : const Icon(Icons.save_rounded),
                  label: Text(
                    _isLoading ? 'Menyimpan...' : 'Simpan Member',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
    required BuildContext context,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: AppTheme.cardShadow,
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          prefixIcon: Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 20),
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}
