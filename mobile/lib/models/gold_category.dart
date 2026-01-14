import 'package:equatable/equatable.dart';

class GoldCategory extends Equatable {
  final int id;
  final String code;
  final String name;
  final double? purity;
  final double buyPrice;
  final double sellPrice;
  final String description;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const GoldCategory({
    required this.id,
    required this.code,
    required this.name,
    this.purity,
    this.buyPrice = 0,
    this.sellPrice = 0,
    this.description = '',
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory GoldCategory.fromJson(Map<String, dynamic> json) {
    return GoldCategory(
      id: json['id'] ?? 0,
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      purity: json['purity']?.toDouble(),
      buyPrice: (json['buy_price'] ?? 0).toDouble(),
      sellPrice: (json['sell_price'] ?? 0).toDouble(),
      description: json['description'] ?? '',
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
      'code': code,
      'name': name,
      'purity': purity,
      'buy_price': buyPrice,
      'sell_price': sellPrice,
      'description': description,
      'is_active': isActive,
    };
  }

  GoldCategory copyWith({
    int? id,
    String? code,
    String? name,
    double? purity,
    double? buyPrice,
    double? sellPrice,
    String? description,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GoldCategory(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      purity: purity ?? this.purity,
      buyPrice: buyPrice ?? this.buyPrice,
      sellPrice: sellPrice ?? this.sellPrice,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, code, name, purity, buyPrice, sellPrice, isActive];
}
