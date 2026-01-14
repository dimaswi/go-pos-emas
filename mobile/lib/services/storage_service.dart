import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user.dart';

class StorageService {
  static StorageService? _instance;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  StorageService._internal();

  factory StorageService() {
    _instance ??= StorageService._internal();
    return _instance!;
  }

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // =============== Secure Storage (for sensitive data) ===============

  // Save token
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppConfig.tokenKey, value: token);
  }

  // Get token
  Future<String?> getToken() async {
    return await _secureStorage.read(key: AppConfig.tokenKey);
  }

  // Delete token
  Future<void> deleteToken() async {
    await _secureStorage.delete(key: AppConfig.tokenKey);
  }

  // Save refresh token
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: AppConfig.refreshTokenKey, value: token);
  }

  // Get refresh token
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConfig.refreshTokenKey);
  }

  // Delete refresh token
  Future<void> deleteRefreshToken() async {
    await _secureStorage.delete(key: AppConfig.refreshTokenKey);
  }

  // =============== Shared Preferences (for non-sensitive data) ===============

  // Save user data
  Future<void> saveUser(User user) async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setString(AppConfig.userKey, jsonEncode(user.toJson()));
  }

  // Get user data
  Future<User?> getUser() async {
    _prefs ??= await SharedPreferences.getInstance();
    final userJson = _prefs!.getString(AppConfig.userKey);
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    return null;
  }

  // Delete user data
  Future<void> deleteUser() async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.remove(AppConfig.userKey);
  }

  // Save selected location ID
  Future<void> saveSelectedLocationId(int locationId) async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setInt('selected_location_id', locationId);
  }

  // Get selected location ID
  Future<int?> getSelectedLocationId() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getInt('selected_location_id');
  }

  // Save theme mode
  Future<void> saveThemeMode(bool isDark) async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setBool('theme_mode_dark', isDark);
  }

  // Get theme mode
  Future<bool> getThemeMode() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getBool('theme_mode_dark') ?? false;
  }

  // Check if first launch
  Future<bool> isFirstLaunch() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getBool('first_launch') ?? true;
  }

  // Set first launch complete
  Future<void> setFirstLaunchComplete() async {
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setBool('first_launch', false);
  }

  // Clear all data
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.clear();
  }

  // Check if logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
