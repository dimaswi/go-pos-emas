import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;

  AuthProvider() {
    checkAuthStatus();
  }

  // Check if user is already logged in
  Future<void> checkAuthStatus() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final isLoggedIn = await _storageService.isLoggedIn();
      if (isLoggedIn) {
        _user = await _storageService.getUser();
        if (_user != null) {
          _status = AuthStatus.authenticated;
        } else {
          // Try to get profile from server
          try {
            _user = await _authService.getProfile();
            _status = AuthStatus.authenticated;
          } catch (e) {
            await _storageService.clearAll();
            _status = AuthStatus.unauthenticated;
          }
        }
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      _status = AuthStatus.unauthenticated;
    }

    notifyListeners();
  }

  // Login
  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _authService.login(email, password);
      _user = response.user;
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  // Refresh user profile
  Future<void> refreshProfile() async {
    try {
      _user = await _authService.getProfile();
      notifyListeners();
    } catch (e) {
      // Handle error silently
    }
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    if (_status == AuthStatus.error) {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  // Check if user has permission
  bool hasPermission(String permissionName) {
    return _user?.hasPermission(permissionName) ?? false;
  }
}
