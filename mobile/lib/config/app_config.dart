class AppConfig {
  static const String appName = 'POS Emas';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://10.0.2.2:8080/api'; // Android Emulator
  // static const String baseUrl = 'http://localhost:8080/api'; // iOS Simulator
  // static const String baseUrl = 'http://YOUR_IP:8080/api'; // Physical Device
  
  // Timeout settings (in seconds)
  static const int connectionTimeout = 30;
  static const int receiveTimeout = 30;
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String refreshTokenKey = 'refresh_token';
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Currency
  static const String currencySymbol = 'Rp';
  static const String currencyCode = 'IDR';
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';
}
