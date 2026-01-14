import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart';
import '../../widgets/loading_widgets.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  final _api = ApiService();

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await _api.put(
        ApiEndpoints.changePassword,
        data: {
          'current_password': _currentPasswordController.text,
          'new_password': _newPasswordController.text,
          'confirm_password': _confirmPasswordController.text,
        },
      );

      if (response.success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Password berhasil diubah'),
              ],
            ),
            backgroundColor: AppTheme.successColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
        Navigator.pop(context);
      } else {
        throw Exception(response.message ?? 'Gagal mengubah password');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text(e.toString())),
              ],
            ),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0F0F1A)
          : AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Ganti Password'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        message: 'Menyimpan...',
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                // Lock Icon
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFD4AF37).withOpacity(0.2),
                        const Color(0xFFF4E4BA).withOpacity(0.1),
                      ],
                    ),
                    border: Border.all(
                      color: const Color(0xFFD4AF37).withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                  child: const Icon(
                    Icons.lock_rounded,
                    size: 48,
                    color: Color(0xFFD4AF37),
                  ),
                ),

                const SizedBox(height: 24),

                // Info Text
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.blue.withOpacity(0.1)
                        : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? Colors.blue.withOpacity(0.3)
                          : Colors.blue.shade200,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        color: isDark
                            ? Colors.blue.shade300
                            : Colors.blue.shade700,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Pastikan password baru Anda minimal 6 karakter dan berbeda dari password sebelumnya.',
                          style: TextStyle(
                            color: isDark
                                ? Colors.blue.shade200
                                : Colors.blue.shade700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Form Fields
                _buildPasswordField(
                  controller: _currentPasswordController,
                  label: 'Password Saat Ini',
                  hint: 'Masukkan password saat ini',
                  isVisible: _showCurrentPassword,
                  onToggleVisibility: () {
                    setState(
                      () => _showCurrentPassword = !_showCurrentPassword,
                    );
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password saat ini tidak boleh kosong';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                _buildPasswordField(
                  controller: _newPasswordController,
                  label: 'Password Baru',
                  hint: 'Masukkan password baru',
                  isVisible: _showNewPassword,
                  onToggleVisibility: () {
                    setState(() => _showNewPassword = !_showNewPassword);
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password baru tidak boleh kosong';
                    }
                    if (value.length < 6) {
                      return 'Password minimal 6 karakter';
                    }
                    if (value == _currentPasswordController.text) {
                      return 'Password baru harus berbeda dari password lama';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                _buildPasswordField(
                  controller: _confirmPasswordController,
                  label: 'Konfirmasi Password Baru',
                  hint: 'Masukkan ulang password baru',
                  isVisible: _showConfirmPassword,
                  onToggleVisibility: () {
                    setState(
                      () => _showConfirmPassword = !_showConfirmPassword,
                    );
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Konfirmasi password tidak boleh kosong';
                    }
                    if (value != _newPasswordController.text) {
                      return 'Password tidak sama';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Password Strength Indicator
                _buildPasswordStrengthIndicator(),

                const SizedBox(height: 32),

                // Save Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _changePassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 8,
                      shadowColor: AppTheme.primaryColor.withOpacity(0.5),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.lock_reset_rounded),
                        SizedBox(width: 12),
                        Text(
                          'Ubah Password',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool isVisible,
    required VoidCallback onToggleVisibility,
    String? Function(String?)? validator,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDark ? Colors.white70 : Colors.grey.shade700,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: !isVisible,
          validator: validator,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? Colors.white38 : Colors.grey.shade400,
            ),
            prefixIcon: const Icon(
              Icons.lock_outline_rounded,
              color: AppTheme.primaryColor,
            ),
            suffixIcon: IconButton(
              icon: Icon(
                isVisible
                    ? Icons.visibility_off_rounded
                    : Icons.visibility_rounded,
                color: isDark ? Colors.white54 : Colors.grey.shade600,
              ),
              onPressed: onToggleVisibility,
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A1A2E) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: isDark ? Colors.white12 : Colors.grey.shade200,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(
                color: AppTheme.primaryColor,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.errorColor),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordStrengthIndicator() {
    final password = _newPasswordController.text;
    if (password.isEmpty) return const SizedBox.shrink();

    int strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (password.contains(RegExp(r'[A-Z]'))) strength++;
    if (password.contains(RegExp(r'[0-9]'))) strength++;
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength++;

    String strengthText;
    Color strengthColor;

    if (strength <= 1) {
      strengthText = 'Lemah';
      strengthColor = Colors.red;
    } else if (strength <= 2) {
      strengthText = 'Cukup';
      strengthColor = Colors.orange;
    } else if (strength <= 3) {
      strengthText = 'Sedang';
      strengthColor = Colors.yellow.shade700;
    } else if (strength <= 4) {
      strengthText = 'Kuat';
      strengthColor = Colors.lightGreen;
    } else {
      strengthText = 'Sangat Kuat';
      strengthColor = Colors.green;
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: strength / 5,
                  backgroundColor: isDark
                      ? Colors.white12
                      : Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(strengthColor),
                  minHeight: 6,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text(
              strengthText,
              style: TextStyle(
                color: strengthColor,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            _buildCriteria('6+ karakter', password.length >= 6),
            _buildCriteria('Huruf besar', password.contains(RegExp(r'[A-Z]'))),
            _buildCriteria('Angka', password.contains(RegExp(r'[0-9]'))),
            _buildCriteria(
              'Simbol',
              password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]')),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCriteria(String text, bool met) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: met
            ? Colors.green.withOpacity(0.1)
            : (isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: met
              ? Colors.green.withOpacity(0.3)
              : (isDark ? Colors.white12 : Colors.grey.shade300),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.circle_outlined,
            size: 14,
            color: met ? Colors.green : (isDark ? Colors.white38 : Colors.grey),
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              color: met
                  ? Colors.green
                  : (isDark ? Colors.white54 : Colors.grey.shade600),
            ),
          ),
        ],
      ),
    );
  }
}
