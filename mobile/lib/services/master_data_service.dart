import '../models/models.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class GoldCategoryService {
  final ApiService _api = ApiService();

  // Get all gold categories
  Future<List<GoldCategory>> getGoldCategories({bool? isActive}) async {
    final queryParams = <String, dynamic>{};
    if (isActive != null) queryParams['is_active'] = isActive;

    final response = await _api.get(
      ApiEndpoints.goldCategories,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => GoldCategory.fromJson(json)).toList();
    }

    return [];
  }

  // Get gold category by ID
  Future<GoldCategory> getGoldCategory(int id) async {
    final response = await _api.get('${ApiEndpoints.goldCategories}/$id');

    if (response.success && response.data != null) {
      return GoldCategory.fromJson(response.data);
    }

    throw Exception('Gold category not found');
  }
}

class LocationService {
  final ApiService _api = ApiService();

  // Get all locations
  Future<List<Location>> getLocations({String? type, bool? isActive}) async {
    final queryParams = <String, dynamic>{};
    if (type != null) queryParams['type'] = type;
    if (isActive != null) queryParams['is_active'] = isActive;

    final response = await _api.get(
      ApiEndpoints.locations,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Location.fromJson(json)).toList();
    }

    return [];
  }

  // Get location by ID
  Future<Location> getLocation(int id) async {
    final response = await _api.get('${ApiEndpoints.locations}/$id');

    if (response.success && response.data != null) {
      return Location.fromJson(response.data);
    }

    throw Exception('Location not found');
  }

  // Get storage boxes for a location
  Future<List<StorageBox>> getStorageBoxes(int locationId) async {
    final response = await _api.get(
      ApiEndpoints.storageBoxes,
      queryParameters: {'location_id': locationId},
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => StorageBox.fromJson(json)).toList();
    }

    return [];
  }
}
