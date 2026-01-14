import '../models/models.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class MemberService {
  final ApiService _api = ApiService();

  // Get all members
  Future<List<Member>> getMembers({
    int page = 1,
    int limit = 20,
    String? search,
    String? type,
    bool? isActive,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (type != null) queryParams['type'] = type;
    if (isActive != null) queryParams['is_active'] = isActive;

    final response = await _api.get(
      ApiEndpoints.members,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      // Backend returns {"data": [...]}
      final dynamic rawData = response.data['data'] ?? response.data;
      if (rawData is List) {
        return rawData.map((json) => Member.fromJson(json)).toList();
      }
      return [];
    }

    throw Exception(response.message ?? 'Failed to load members');
  }

  // Get member by ID
  Future<Member> getMember(int id) async {
    final response = await _api.get('${ApiEndpoints.members}/$id');

    if (response.success && response.data != null) {
      return Member.fromJson(response.data);
    }

    throw Exception('Member not found');
  }

  // Get member by code
  Future<Member> getMemberByCode(String code) async {
    final response = await _api.get('${ApiEndpoints.members}/code/$code');

    if (response.success && response.data != null) {
      return Member.fromJson(response.data);
    }

    throw Exception('Member not found');
  }

  // Search members
  Future<List<Member>> searchMembers(String query) async {
    if (query.isEmpty) return [];

    final response = await _api.get(
      ApiEndpoints.members,
      queryParameters: {'search': query, 'limit': 10},
    );

    if (response.success && response.data != null) {
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => Member.fromJson(json)).toList();
    }

    return [];
  }

  // Create member
  Future<Member> createMember(Map<String, dynamic> data) async {
    final response = await _api.post(
      ApiEndpoints.members,
      data: data,
    );

    if (response.success && response.data != null) {
      // Backend returns {"data": member}
      final memberData = response.data['data'] ?? response.data;
      return Member.fromJson(memberData);
    }

    throw Exception(response.message ?? 'Failed to create member');
  }

  // Update member
  Future<Member> updateMember(int id, Map<String, dynamic> data) async {
    final response = await _api.put(
      '${ApiEndpoints.members}/$id',
      data: data,
    );

    if (response.success && response.data != null) {
      final memberData = response.data['data'] ?? response.data;
      return Member.fromJson(memberData);
    }

    throw Exception(response.message ?? 'Failed to update member');
  }

  // Delete member
  Future<void> deleteMember(int id) async {
    await _api.delete('${ApiEndpoints.members}/$id');
  }
}
