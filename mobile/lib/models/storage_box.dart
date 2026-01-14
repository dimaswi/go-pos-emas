import 'package:equatable/equatable.dart';

class StorageBox extends Equatable {
  final int id;
  final int locationId;
  final String code;
  final String name;
  final String description;
  final int capacity;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const StorageBox({
    required this.id,
    required this.locationId,
    required this.code,
    required this.name,
    this.description = '',
    this.capacity = 0,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory StorageBox.fromJson(Map<String, dynamic> json) {
    return StorageBox(
      id: json['id'] ?? 0,
      locationId: json['location_id'] ?? 0,
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      capacity: json['capacity'] ?? 0,
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'location_id': locationId,
      'code': code,
      'name': name,
      'description': description,
      'capacity': capacity,
      'is_active': isActive,
    };
  }

  StorageBox copyWith({
    int? id,
    int? locationId,
    String? code,
    String? name,
    String? description,
    int? capacity,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return StorageBox(
      id: id ?? this.id,
      locationId: locationId ?? this.locationId,
      code: code ?? this.code,
      name: name ?? this.name,
      description: description ?? this.description,
      capacity: capacity ?? this.capacity,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, locationId, code, name, isActive];
}
