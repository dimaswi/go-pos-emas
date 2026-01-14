import 'package:equatable/equatable.dart';
import 'permission.dart';

class Role extends Equatable {
  final int id;
  final String name;
  final String description;
  final List<Permission>? permissions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Role({
    required this.id,
    required this.name,
    this.description = '',
    this.permissions,
    this.createdAt,
    this.updatedAt,
  });

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      permissions: json['permissions'] != null
          ? (json['permissions'] as List)
              .map((p) => Permission.fromJson(p))
              .toList()
          : null,
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
      'name': name,
      'description': description,
      if (permissions != null)
        'permissions': permissions!.map((p) => p.toJson()).toList(),
    };
  }

  Role copyWith({
    int? id,
    String? name,
    String? description,
    List<Permission>? permissions,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Role(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      permissions: permissions ?? this.permissions,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, name, description, permissions];
}
