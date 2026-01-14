import '../models/user.dart';
import '../utils/constants.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthResponse {
  final User user;
  final String token;

  AuthResponse({required this.user, required this.token});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: User.fromJson(json['user']),
      token: json['token'] ?? '',
    );
  }
}

class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  // Login
  Future<AuthResponse> login(String email, String password) async {
    final response = await _api.post(
      ApiEndpoints.login,
      data: {
        'email': email,
        'password': password,
      },
    );

    if (response.success && response.data != null) {
      final authResponse = AuthResponse.fromJson(response.data);
      
      // Save token and user
      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user);
      
      return authResponse;
    }

    throw Exception(response.message ?? 'Login failed');
  }

  // Logout
  Future<void> logout() async {
    try {
      await _api.post(ApiEndpoints.logout);
    } catch (e) {
      // Ignore error on logout
    } finally {
      await _storage.clearAll();
    }
  }

  // Get current user profile
  Future<User> getProfile() async {
    final response = await _api.get(
      ApiEndpoints.profile,
      fromJson: (data) => User.fromJson(data),
    );

    if (response.success && response.data != null) {
      final user = response.data as User;
      await _storage.saveUser(user);
      return user;
    }

    throw Exception(response.message ?? 'Failed to get profile');
  }

  // Check auth status
  Future<bool> isAuthenticated() async {
    return await _storage.isLoggedIn();
  }

  // Get current user from storage
  Future<User?> getCurrentUser() async {
    return await _storage.getUser();
  }

  // Get token
  Future<String?> getToken() async {
    return await _storage.getToken();
  }
}
