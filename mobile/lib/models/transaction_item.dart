import 'package:equatable/equatable.dart';
import 'stock.dart';
import 'product.dart';
import 'gold_category.dart';

class TransactionItem extends Equatable {
  final int id;
  final int transactionId;
  
  // For sale transactions - existing stock
  final int? stockId;
  final Stock? stock;
  
  // For purchase/setor transactions
  final int? productId;
  final Product? product;
  final int? goldCategoryId;
  final GoldCategory? goldCategory;
  
  // Item details
  final String itemName;
  final String barcode;
  final double weight;
  final double pricePerGram;
  final double unitPrice;
  final int quantity;
  final double discount;
  final double subTotal;
  final String notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const TransactionItem({
    required this.id,
    required this.transactionId,
    this.stockId,
    this.stock,
    this.productId,
    this.product,
    this.goldCategoryId,
    this.goldCategory,
    required this.itemName,
    this.barcode = '',
    required this.weight,
    required this.pricePerGram,
    required this.unitPrice,
    this.quantity = 1,
    this.discount = 0,
    required this.subTotal,
    this.notes = '',
    this.createdAt,
    this.updatedAt,
  });

  factory TransactionItem.fromJson(Map<String, dynamic> json) {
    return TransactionItem(
      id: json['id'] ?? 0,
      transactionId: json['transaction_id'] ?? 0,
      stockId: json['stock_id'],
      stock: json['stock'] != null ? Stock.fromJson(json['stock']) : null,
      productId: json['product_id'],
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      goldCategoryId: json['gold_category_id'],
      goldCategory: json['gold_category'] != null
          ? GoldCategory.fromJson(json['gold_category'])
          : null,
      itemName: json['item_name'] ?? '',
      barcode: json['barcode'] ?? '',
      weight: (json['weight'] ?? 0).toDouble(),
      pricePerGram: (json['price_per_gram'] ?? 0).toDouble(),
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      discount: (json['discount'] ?? 0).toDouble(),
      subTotal: (json['sub_total'] ?? 0).toDouble(),
      notes: json['notes'] ?? '',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transaction_id': transactionId,
      'stock_id': stockId,
      'product_id': productId,
      'gold_category_id': goldCategoryId,
      'item_name': itemName,
      'barcode': barcode,
      'weight': weight,
      'price_per_gram': pricePerGram,
      'unit_price': unitPrice,
      'quantity': quantity,
      'discount': discount,
      'sub_total': subTotal,
      'notes': notes,
    };
  }

  TransactionItem copyWith({
    int? id,
    int? transactionId,
    int? stockId,
    Stock? stock,
    int? productId,
    Product? product,
    int? goldCategoryId,
    GoldCategory? goldCategory,
    String? itemName,
    String? barcode,
    double? weight,
    double? pricePerGram,
    double? unitPrice,
    int? quantity,
    double? discount,
    double? subTotal,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TransactionItem(
      id: id ?? this.id,
      transactionId: transactionId ?? this.transactionId,
      stockId: stockId ?? this.stockId,
      stock: stock ?? this.stock,
      productId: productId ?? this.productId,
      product: product ?? this.product,
      goldCategoryId: goldCategoryId ?? this.goldCategoryId,
      goldCategory: goldCategory ?? this.goldCategory,
      itemName: itemName ?? this.itemName,
      barcode: barcode ?? this.barcode,
      weight: weight ?? this.weight,
      pricePerGram: pricePerGram ?? this.pricePerGram,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      discount: discount ?? this.discount,
      subTotal: subTotal ?? this.subTotal,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, transactionId, itemName, weight, subTotal];
}
