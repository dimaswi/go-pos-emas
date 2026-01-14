import 'package:equatable/equatable.dart';
import 'product.dart';
import 'location.dart';
import 'storage_box.dart';

class Stock extends Equatable {
  final int id;
  final int productId;
  final Product? product;
  final int locationId;
  final Location? location;
  final int storageBoxId;
  final StorageBox? storageBox;
  final String serialNumber;
  final String status; // available, reserved, sold, transfer
  final double buyPrice;
  final double sellPrice;
  final String notes;
  final String? supplierName;
  final DateTime? receivedAt;
  final DateTime? soldAt;
  final int? transactionId;
  final bool barcodePrinted;
  final DateTime? barcodePrintedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Stock({
    required this.id,
    required this.productId,
    this.product,
    required this.locationId,
    this.location,
    required this.storageBoxId,
    this.storageBox,
    required this.serialNumber,
    this.status = 'available',
    required this.buyPrice,
    required this.sellPrice,
    this.notes = '',
    this.supplierName,
    this.receivedAt,
    this.soldAt,
    this.transactionId,
    this.barcodePrinted = false,
    this.barcodePrintedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory Stock.fromJson(Map<String, dynamic> json) {
    return Stock(
      id: json['id'] ?? 0,
      productId: json['product_id'] ?? 0,
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
      locationId: json['location_id'] ?? 0,
      location: json['location'] != null ? Location.fromJson(json['location']) : null,
      storageBoxId: json['storage_box_id'] ?? 0,
      storageBox: json['storage_box'] != null ? StorageBox.fromJson(json['storage_box']) : null,
      serialNumber: json['serial_number'] ?? '',
      status: json['status'] ?? 'available',
      buyPrice: (json['buy_price'] ?? 0).toDouble(),
      sellPrice: (json['sell_price'] ?? json['selling_price'] ?? 0).toDouble(),
      notes: json['notes'] ?? '',
      supplierName: json['supplier_name'],
      receivedAt: json['received_at'] != null ? DateTime.parse(json['received_at']) : null,
      soldAt: json['sold_at'] != null ? DateTime.parse(json['sold_at']) : null,
      transactionId: json['transaction_id'],
      barcodePrinted: json['barcode_printed'] ?? false,
      barcodePrintedAt: json['barcode_printed_at'] != null
          ? DateTime.parse(json['barcode_printed_at'])
          : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  // Alias for sellPrice
  double get sellingPrice => sellPrice;
  double get weight => product?.weight ?? 0;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product_id': productId,
      'location_id': locationId,
      'storage_box_id': storageBoxId,
      'serial_number': serialNumber,
      'status': status,
      'buy_price': buyPrice,
      'sell_price': sellPrice,
      'notes': notes,
      'supplier_name': supplierName,
      'barcode_printed': barcodePrinted,
    };
  }

  Stock copyWith({
    int? id,
    int? productId,
    Product? product,
    int? locationId,
    Location? location,
    int? storageBoxId,
    StorageBox? storageBox,
    String? serialNumber,
    String? status,
    double? buyPrice,
    double? sellPrice,
    String? notes,
    String? supplierName,
    DateTime? receivedAt,
    DateTime? soldAt,
    int? transactionId,
    bool? barcodePrinted,
    DateTime? barcodePrintedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Stock(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      product: product ?? this.product,
      locationId: locationId ?? this.locationId,
      location: location ?? this.location,
      storageBoxId: storageBoxId ?? this.storageBoxId,
      storageBox: storageBox ?? this.storageBox,
      serialNumber: serialNumber ?? this.serialNumber,
      status: status ?? this.status,
      buyPrice: buyPrice ?? this.buyPrice,
      sellPrice: sellPrice ?? this.sellPrice,
      notes: notes ?? this.notes,
      supplierName: supplierName ?? this.supplierName,
      receivedAt: receivedAt ?? this.receivedAt,
      soldAt: soldAt ?? this.soldAt,
      transactionId: transactionId ?? this.transactionId,
      barcodePrinted: barcodePrinted ?? this.barcodePrinted,
      barcodePrintedAt: barcodePrintedAt ?? this.barcodePrintedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, productId, serialNumber, status, locationId];
}
