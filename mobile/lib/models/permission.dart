import 'package:equatable/equatable.dart';

class Permission extends Equatable {
  final int id;
  final String name;
  final String description;
  final String module;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Permission({
    required this.id,
    required this.name,
    this.description = '',
    this.module = '',
    this.createdAt,
    this.updatedAt,
  });

  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      module: json['module'] ?? '',
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
      'module': module,
    };
  }

  @override
  List<Object?> get props => [id, name, description, module];
}
