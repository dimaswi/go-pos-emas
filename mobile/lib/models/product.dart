import 'package:equatable/equatable.dart';
import 'gold_category.dart';

class Product extends Equatable {
  final int id;
  final String barcode;
  final String name;
  final String type; // gelang, cincin, kalung, anting, liontin, other
  final String category; // dewasa, anak, unisex
  final int goldCategoryId;
  final GoldCategory? goldCategory;
  final double weight;
  final String description;
  
  // Specifications based on product type
  final String? ringSize;
  final double? braceletLength;
  final double? necklaceLength;
  final String? earringType;
  
  final String? imageUrl;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Product({
    required this.id,
    required this.barcode,
    required this.name,
    required this.type,
    required this.category,
    required this.goldCategoryId,
    this.goldCategory,
    required this.weight,
    this.description = '',
    this.ringSize,
    this.braceletLength,
    this.necklaceLength,
    this.earringType,
    this.imageUrl,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      barcode: json['barcode'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'other',
      category: json['category'] ?? 'unisex',
      goldCategoryId: json['gold_category_id'] ?? 0,
      goldCategory: json['gold_category'] != null
          ? GoldCategory.fromJson(json['gold_category'])
          : null,
      weight: (json['weight'] ?? 0).toDouble(),
      description: json['description'] ?? '',
      ringSize: json['ring_size'],
      braceletLength: json['bracelet_length']?.toDouble(),
      necklaceLength: json['necklace_length']?.toDouble(),
      earringType: json['earring_type'],
      imageUrl: json['image_url'],
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
      'barcode': barcode,
      'name': name,
      'type': type,
      'category': category,
      'gold_category_id': goldCategoryId,
      'weight': weight,
      'description': description,
      'ring_size': ringSize,
      'bracelet_length': braceletLength,
      'necklace_length': necklaceLength,
      'earring_type': earringType,
      'image_url': imageUrl,
      'is_active': isActive,
    };
  }

  // Calculate sell price based on gold category
  double get sellPrice {
    if (goldCategory != null) {
      return goldCategory!.sellPrice * weight;
    }
    return 0;
  }

  // Calculate buy price based on gold category
  double get buyPrice {
    if (goldCategory != null) {
      return goldCategory!.buyPrice * weight;
    }
    return 0;
  }

  Product copyWith({
    int? id,
    String? barcode,
    String? name,
    String? type,
    String? category,
    int? goldCategoryId,
    GoldCategory? goldCategory,
    double? weight,
    String? description,
    String? ringSize,
    double? braceletLength,
    double? necklaceLength,
    String? earringType,
    String? imageUrl,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      barcode: barcode ?? this.barcode,
      name: name ?? this.name,
      type: type ?? this.type,
      category: category ?? this.category,
      goldCategoryId: goldCategoryId ?? this.goldCategoryId,
      goldCategory: goldCategory ?? this.goldCategory,
      weight: weight ?? this.weight,
      description: description ?? this.description,
      ringSize: ringSize ?? this.ringSize,
      braceletLength: braceletLength ?? this.braceletLength,
      necklaceLength: necklaceLength ?? this.necklaceLength,
      earringType: earringType ?? this.earringType,
      imageUrl: imageUrl ?? this.imageUrl,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, barcode, name, type, category, weight, isActive];
}
