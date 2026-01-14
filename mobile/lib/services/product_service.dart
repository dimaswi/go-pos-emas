import '../models/models.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class ProductService {
  final ApiService _api = ApiService();

  // Get all products
  Future<List<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? search,
    String? type,
    String? category,
    int? goldCategoryId,
    bool? isActive,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (type != null) queryParams['type'] = type;
    if (category != null) queryParams['category'] = category;
    if (goldCategoryId != null) queryParams['gold_category_id'] = goldCategoryId;
    if (isActive != null) queryParams['is_active'] = isActive;

    final response = await _api.get(
      ApiEndpoints.products,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Product.fromJson(json)).toList();
    }

    return [];
  }

  // Get product by ID
  Future<Product> getProduct(int id) async {
    final response = await _api.get('${ApiEndpoints.products}/$id');

    if (response.success && response.data != null) {
      return Product.fromJson(response.data);
    }

    throw Exception('Product not found');
  }

  // Get product by barcode
  Future<Product> getProductByBarcode(String barcode) async {
    final response = await _api.get(
      '${ApiEndpoints.products}/barcode/$barcode',
    );

    if (response.success && response.data != null) {
      return Product.fromJson(response.data);
    }

    throw Exception('Product not found');
  }

  // Create product
  Future<Product> createProduct(Product product) async {
    final response = await _api.post(
      ApiEndpoints.products,
      data: product.toJson(),
    );

    if (response.success && response.data != null) {
      return Product.fromJson(response.data);
    }

    throw Exception('Failed to create product');
  }

  // Update product
  Future<Product> updateProduct(int id, Product product) async {
    final response = await _api.put(
      '${ApiEndpoints.products}/$id',
      data: product.toJson(),
    );

    if (response.success && response.data != null) {
      return Product.fromJson(response.data);
    }

    throw Exception('Failed to update product');
  }

  // Delete product
  Future<void> deleteProduct(int id) async {
    await _api.delete('${ApiEndpoints.products}/$id');
  }
}
