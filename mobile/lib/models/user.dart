import 'package:equatable/equatable.dart';
import 'role.dart';

class User extends Equatable {
  final int id;
  final String email;
  final String username;
  final String fullName;
  final bool isActive;
  final int roleId;
  final Role? role;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.username,
    this.fullName = '',
    this.isActive = true,
    required this.roleId,
    this.role,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? '',
      isActive: json['is_active'] ?? true,
      roleId: json['role_id'] ?? 0,
      role: json['role'] != null ? Role.fromJson(json['role']) : null,
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
      'email': email,
      'username': username,
      'full_name': fullName,
      'is_active': isActive,
      'role_id': roleId,
      if (role != null) 'role': role!.toJson(),
    };
  }

  User copyWith({
    int? id,
    String? email,
    String? username,
    String? fullName,
    bool? isActive,
    int? roleId,
    Role? role,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      isActive: isActive ?? this.isActive,
      roleId: roleId ?? this.roleId,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Check if user has specific permission
  bool hasPermission(String permissionName) {
    if (role?.permissions == null) return false;
    return role!.permissions!.any((p) => p.name == permissionName);
  }

  @override
  List<Object?> get props => [id, email, username, fullName, isActive, roleId, role];
}
