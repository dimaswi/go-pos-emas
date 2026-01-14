import 'package:equatable/equatable.dart';
import 'storage_box.dart';
import 'stock.dart';

class Location extends Equatable {
  final int id;
  final String code;
  final String name;
  final String type; // gudang, toko
  final String address;
  final String phone;
  final String description;
  final bool isActive;
  final List<StorageBox>? boxes;
  final List<Stock>? stocks;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Location({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
    this.address = '',
    this.phone = '',
    this.description = '',
    this.isActive = true,
    this.boxes,
    this.stocks,
    this.createdAt,
    this.updatedAt,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      id: json['id'] ?? 0,
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'toko',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      description: json['description'] ?? '',
      isActive: json['is_active'] ?? true,
      boxes: json['boxes'] != null
          ? (json['boxes'] as List).map((b) => StorageBox.fromJson(b)).toList()
          : null,
      stocks: json['stocks'] != null
          ? (json['stocks'] as List).map((s) => Stock.fromJson(s)).toList()
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
      'code': code,
      'name': name,
      'type': type,
      'address': address,
      'phone': phone,
      'description': description,
      'is_active': isActive,
    };
  }

  Location copyWith({
    int? id,
    String? code,
    String? name,
    String? type,
    String? address,
    String? phone,
    String? description,
    bool? isActive,
    List<StorageBox>? boxes,
    List<Stock>? stocks,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Location(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      type: type ?? this.type,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      boxes: boxes ?? this.boxes,
      stocks: stocks ?? this.stocks,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, code, name, type, isActive];
}
