import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
  });
}

class ApiService {
  static ApiService? _instance;
  late Dio _dio;
  final StorageService _storage = StorageService();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: Duration(seconds: AppConfig.connectionTimeout),
      receiveTimeout: Duration(seconds: AppConfig.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (kDebugMode) {
          print('REQUEST[${options.method}] => PATH: ${options.path}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) {
          print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (kDebugMode) {
          print('ERROR[${error.response?.statusCode}] => PATH: ${error.requestOptions.path}');
          print('ERROR MESSAGE: ${error.message}');
        }

        // Handle 401 - Unauthorized
        if (error.response?.statusCode == 401) {
          // Clear token and redirect to login
          await _storage.clearAll();
          // You can emit event here or handle navigation
        }

        return handler.next(error);
      },
    ));
  }

  factory ApiService() {
    _instance ??= ApiService._internal();
    return _instance!;
  }

  // GET request
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST request
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PUT request
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PATCH request
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE request
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Upload file
  Future<ApiResponse<T>> uploadFile<T>(
    String path,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? extraData,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      String fileName = file.path.split('/').last;
      FormData formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(file.path, filename: fileName),
        ...?extraData,
      });

      final response = await _dio.post(path, data: formData);
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Handle response
  ApiResponse<T> _handleResponse<T>(
    Response response,
    T Function(dynamic)? fromJson,
  ) {
    final data = response.data;
    
    if (response.statusCode! >= 200 && response.statusCode! < 300) {
      return ApiResponse<T>(
        success: true,
        data: fromJson != null ? fromJson(data) : data,
        statusCode: response.statusCode,
        message: data is Map ? data['message'] : null,
      );
    } else {
      throw ApiException(
        data is Map ? data['message'] ?? 'Request failed' : 'Request failed',
        statusCode: response.statusCode,
        data: data,
      );
    }
  }

  // Handle error
  ApiException _handleError(DioException e) {
    String message;
    int? statusCode = e.response?.statusCode;

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        message = 'Connection timeout';
        break;
      case DioExceptionType.sendTimeout:
        message = 'Send timeout';
        break;
      case DioExceptionType.receiveTimeout:
        message = 'Receive timeout';
        break;
      case DioExceptionType.badResponse:
        final data = e.response?.data;
        if (data is Map && data.containsKey('message')) {
          message = data['message'];
        } else if (data is Map && data.containsKey('error')) {
          message = data['error'];
        } else {
          message = 'Server error: ${e.response?.statusCode}';
        }
        break;
      case DioExceptionType.cancel:
        message = 'Request cancelled';
        break;
      case DioExceptionType.connectionError:
        message = 'No internet connection';
        break;
      default:
        message = 'Network error occurred';
    }

    return ApiException(message, statusCode: statusCode, data: e.response?.data);
  }
}
