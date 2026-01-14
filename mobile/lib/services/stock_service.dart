import '../models/models.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class StockService {
  final ApiService _api = ApiService();

  // Get all stocks
  Future<List<Stock>> getStocks({
    int page = 1,
    int limit = 20,
    String? search,
    int? productId,
    int? locationId,
    int? storageBoxId,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (productId != null) queryParams['product_id'] = productId;
    if (locationId != null) queryParams['location_id'] = locationId;
    if (storageBoxId != null) queryParams['storage_box_id'] = storageBoxId;
    if (status != null) queryParams['status'] = status;

    final response = await _api.get(
      ApiEndpoints.stocks,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Stock.fromJson(json)).toList();
    }

    return [];
  }

  // Get stock by ID
  Future<Stock> getStock(int id) async {
    final response = await _api.get('${ApiEndpoints.stocks}/$id');

    if (response.success && response.data != null) {
      return Stock.fromJson(response.data);
    }

    throw Exception('Stock not found');
  }

  // Get stock by serial number
  Future<Stock> getStockBySerialNumber(String serialNumber) async {
    final response = await _api.get(
      '${ApiEndpoints.stocks}/serial/$serialNumber',
    );

    if (response.success && response.data != null) {
      // Backend returns {"data": stock}
      final stockData = response.data['data'] ?? response.data;
      return Stock.fromJson(stockData);
    }

    throw Exception(response.message ?? 'Stock not found');
  }

  // Get available stocks for sale at a location
  Future<List<Stock>> getAvailableStocks(int locationId, {String? search}) async {
    final queryParams = <String, dynamic>{
      'location_id': locationId,
      'status': 'available',
    };
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await _api.get(
      ApiEndpoints.stocks,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Stock.fromJson(json)).toList();
    }

    return [];
  }

  // Create stock
  Future<Stock> createStock(Stock stock) async {
    final response = await _api.post(
      ApiEndpoints.stocks,
      data: stock.toJson(),
    );

    if (response.success && response.data != null) {
      return Stock.fromJson(response.data);
    }

    throw Exception('Failed to create stock');
  }

  // Update stock
  Future<Stock> updateStock(int id, Stock stock) async {
    final response = await _api.put(
      '${ApiEndpoints.stocks}/$id',
      data: stock.toJson(),
    );

    if (response.success && response.data != null) {
      return Stock.fromJson(response.data);
    }

    throw Exception('Failed to update stock');
  }

  // Delete stock
  Future<void> deleteStock(int id) async {
    await _api.delete('${ApiEndpoints.stocks}/$id');
  }
}
