import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/storage_service.dart';

class ThemeProvider with ChangeNotifier {
  final StorageService _storageService = StorageService();

  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final isDark = await _storageService.getThemeMode();
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    _updateSystemUI();
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _themeMode = _themeMode == ThemeMode.light
        ? ThemeMode.dark
        : ThemeMode.light;
    await _storageService.saveThemeMode(_themeMode == ThemeMode.dark);
    _updateSystemUI();
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    await _storageService.saveThemeMode(mode == ThemeMode.dark);
    _updateSystemUI();
    notifyListeners();
  }

  void _updateSystemUI() {
    SystemChrome.setSystemUIOverlayStyle(
      _themeMode == ThemeMode.dark
          ? SystemUiOverlayStyle.light.copyWith(
              statusBarColor: Colors.transparent,
            )
          : SystemUiOverlayStyle.dark.copyWith(
              statusBarColor: Colors.transparent,
            ),
    );
  }
}
