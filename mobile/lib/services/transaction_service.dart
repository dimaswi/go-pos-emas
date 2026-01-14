import '../models/models.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class TransactionService {
  final ApiService _api = ApiService();

  // Get all transactions
  Future<List<Transaction>> getTransactions({
    int page = 1,
    int limit = 20,
    String? type,
    String? status,
    int? locationId,
    int? memberId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (type != null) queryParams['type'] = type;
    if (status != null) queryParams['status'] = status;
    if (locationId != null) queryParams['location_id'] = locationId;
    if (memberId != null) queryParams['member_id'] = memberId;
    if (startDate != null) queryParams['start_date'] = startDate.toIso8601String();
    if (endDate != null) queryParams['end_date'] = endDate.toIso8601String();

    final response = await _api.get(
      ApiEndpoints.transactions,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Transaction.fromJson(json)).toList();
    }

    return [];
  }

  // Get transaction by ID
  Future<Transaction> getTransaction(int id) async {
    final response = await _api.get('${ApiEndpoints.transactions}/$id');

    if (response.success && response.data != null) {
      // Backend returns {"data": transaction}
      final txData = response.data['data'] ?? response.data;
      return Transaction.fromJson(txData);
    }

    throw Exception('Transaction not found');
  }

  // Get transaction by code
  Future<Transaction> getTransactionByCode(String code) async {
    final response = await _api.get('${ApiEndpoints.transactions}/code/$code');

    if (response.success && response.data != null) {
      final txData = response.data['data'] ?? response.data;
      return Transaction.fromJson(txData);
    }

    throw Exception('Transaction not found');
  }

  // Create sale transaction
  Future<Transaction> createSale({
    required int locationId,
    int? memberId,
    String? customerName,
    String? customerPhone,
    required List<Map<String, dynamic>> items, // Items with stock_id, discount, notes
    required String paymentMethod,
    required double paidAmount,
    double discount = 0,
    String? notes,
  }) async {
    final response = await _api.post(
      ApiEndpoints.transactionSale,
      data: {
        'location_id': locationId,
        'member_id': memberId,
        'customer_name': customerName,
        'customer_phone': customerPhone,
        'items': items,
        'payment_method': paymentMethod,
        'paid_amount': paidAmount,
        'discount': discount,
        'notes': notes,
      },
    );

    if (response.success && response.data != null) {
      final txData = response.data['data'] ?? response.data;
      return Transaction.fromJson(txData);
    }

    throw Exception(response.message ?? 'Failed to create sale');
  }

  // Create purchase/setor transaction
  Future<Transaction> createPurchase({
    required int locationId,
    int? memberId,
    String? customerName,
    String? customerPhone,
    required List<Map<String, dynamic>> items, // Items being purchased
    required String paymentMethod,
    String? notes,
  }) async {
    final response = await _api.post(
      ApiEndpoints.transactionPurchase,
      data: {
        'location_id': locationId,
        'member_id': memberId,
        'customer_name': customerName,
        'customer_phone': customerPhone,
        'items': items,
        'payment_method': paymentMethod,
        'notes': notes,
      },
    );

    if (response.success && response.data != null) {
      final txData = response.data['data'] ?? response.data;
      return Transaction.fromJson(txData);
    }

    throw Exception(response.message ?? 'Failed to create purchase');
  }

  // Cancel transaction
  Future<Transaction> cancelTransaction(int id, {String reason = ''}) async {
    final response = await _api.post(
      '${ApiEndpoints.transactions}/$id/cancel',
      data: {'reason': reason},
    );

    if (response.success && response.data != null) {
      return Transaction.fromJson(response.data);
    }

    throw Exception('Failed to cancel transaction');
  }

  // Get today's sales summary
  Future<Map<String, dynamic>> getTodaySummary({int? locationId}) async {
    final queryParams = <String, dynamic>{};
    if (locationId != null) queryParams['location_id'] = locationId;

    final response = await _api.get(
      ApiEndpoints.dailySummary,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      return response.data['data'] ?? response.data;
    }

    return {};
  }

  // Get daily summary for a specific date
  Future<Map<String, dynamic>> getDailySummary({
    required DateTime date,
    int? locationId,
  }) async {
    final queryParams = <String, dynamic>{
      'date': '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
    };
    if (locationId != null) queryParams['location_id'] = locationId;

    final response = await _api.get(
      ApiEndpoints.dailySummary,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      return response.data['data'] ?? response.data;
    }

    return {};
  }

  // Get report for date range
  Future<List<Map<String, dynamic>>> getReportRange({
    required DateTime startDate,
    required DateTime endDate,
    int? locationId,
  }) async {
    final List<Map<String, dynamic>> reports = [];
    DateTime currentDate = startDate;
    
    while (!currentDate.isAfter(endDate)) {
      final summary = await getDailySummary(date: currentDate, locationId: locationId);
      if (summary.isNotEmpty) {
        summary['date'] = '${currentDate.year}-${currentDate.month.toString().padLeft(2, '0')}-${currentDate.day.toString().padLeft(2, '0')}';
        reports.add(summary);
      }
      currentDate = currentDate.add(const Duration(days: 1));
    }
    
    return reports;
  }
}
