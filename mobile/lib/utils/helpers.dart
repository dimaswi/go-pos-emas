import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_config.dart';

class Helpers {
  // Format currency
  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: '${AppConfig.currencySymbol} ',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }
  
  // Format currency with decimals
  static String formatCurrencyWithDecimal(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: '${AppConfig.currencySymbol} ',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
  
  // Format compact currency (K, M, B)
  static String formatCompactCurrency(double amount) {
    if (amount >= 1000000000) {
      return '${AppConfig.currencySymbol} ${(amount / 1000000000).toStringAsFixed(1)}B';
    } else if (amount >= 1000000) {
      return '${AppConfig.currencySymbol} ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${AppConfig.currencySymbol} ${(amount / 1000).toStringAsFixed(0)}K';
    }
    return formatCurrency(amount);
  }
  
  // Format number
  static String formatNumber(double number, {int decimals = 2}) {
    final formatter = NumberFormat('#,##0.${'0' * decimals}', 'id_ID');
    return formatter.format(number);
  }
  
  // Format weight (gram)
  static String formatWeight(double weight) {
    return '${formatNumber(weight)} gr';
  }
  
  // Format date
  static String formatDate(DateTime date) {
    return DateFormat(AppConfig.dateFormat, 'id_ID').format(date);
  }
  
  // Format datetime
  static String formatDateTime(DateTime date) {
    return DateFormat(AppConfig.dateTimeFormat, 'id_ID').format(date);
  }
  
  // Format time
  static String formatTime(DateTime date) {
    return DateFormat(AppConfig.timeFormat, 'id_ID').format(date);
  }
  
  // Parse date from string
  static DateTime? parseDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    try {
      return DateTime.parse(dateStr);
    } catch (e) {
      return null;
    }
  }
  
  // Get initials from name
  static String getInitials(String name) {
    if (name.isEmpty) return '';
    List<String> parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  
  // Truncate text
  static String truncateText(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }
  
  // Validate email
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  // Validate phone number (Indonesian)
  static bool isValidPhone(String phone) {
    return RegExp(r'^(\+62|62|0)8[1-9][0-9]{6,11}$').hasMatch(phone);
  }
  
  // Format phone number
  static String formatPhone(String phone) {
    if (phone.startsWith('+62')) {
      return phone;
    } else if (phone.startsWith('62')) {
      return '+$phone';
    } else if (phone.startsWith('0')) {
      return '+62${phone.substring(1)}';
    }
    return phone;
  }
  
  // Show snackbar
  static void showSnackBar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
  
  // Show loading dialog
  static void showLoadingDialog(BuildContext context, {String? message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 20),
            Text(message ?? 'Loading...'),
          ],
        ),
      ),
    );
  }
  
  // Hide loading dialog
  static void hideLoadingDialog(BuildContext context) {
    Navigator.of(context, rootNavigator: true).pop();
  }
  
  // Show confirmation dialog
  static Future<bool> showConfirmDialog(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Ya',
    String cancelText = 'Batal',
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(confirmText),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}
