import 'package:equatable/equatable.dart';
import 'member.dart';
import 'location.dart';
import 'user.dart';
import 'transaction_item.dart';

class Transaction extends Equatable {
  final int id;
  final String transactionCode;
  final String type; // sale, purchase
  final int? memberId;
  final Member? member;
  final int locationId;
  final Location? location;
  final int cashierId;
  final User? cashier;
  
  // Financial details
  final double subTotal;
  final double discount;
  final double discountPercent;
  final double tax;
  final double grandTotal;
  
  // Payment
  final String paymentMethod; // cash, transfer, card, mixed
  final double paidAmount;
  final double changeAmount;
  
  // Additional info
  final String? customerName;
  final String? customerPhone;
  final String notes;
  final String status; // completed, cancelled, refunded
  final DateTime transactionDate;
  
  final List<TransactionItem>? items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Transaction({
    required this.id,
    required this.transactionCode,
    required this.type,
    this.memberId,
    this.member,
    required this.locationId,
    this.location,
    required this.cashierId,
    this.cashier,
    required this.subTotal,
    this.discount = 0,
    this.discountPercent = 0,
    this.tax = 0,
    required this.grandTotal,
    required this.paymentMethod,
    required this.paidAmount,
    this.changeAmount = 0,
    this.customerName,
    this.customerPhone,
    this.notes = '',
    this.status = 'completed',
    required this.transactionDate,
    this.items,
    this.createdAt,
    this.updatedAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? 0,
      transactionCode: json['transaction_code'] ?? '',
      type: json['type'] ?? 'sale',
      memberId: json['member_id'],
      member: json['member'] != null ? Member.fromJson(json['member']) : null,
      locationId: json['location_id'] ?? 0,
      location: json['location'] != null ? Location.fromJson(json['location']) : null,
      cashierId: json['cashier_id'] ?? 0,
      cashier: json['cashier'] != null ? User.fromJson(json['cashier']) : null,
      subTotal: (json['sub_total'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      discountPercent: (json['discount_percent'] ?? 0).toDouble(),
      tax: (json['tax'] ?? 0).toDouble(),
      grandTotal: (json['grand_total'] ?? 0).toDouble(),
      paymentMethod: json['payment_method'] ?? 'cash',
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      changeAmount: (json['change_amount'] ?? 0).toDouble(),
      customerName: json['customer_name'],
      customerPhone: json['customer_phone'],
      notes: json['notes'] ?? '',
      status: json['status'] ?? 'completed',
      transactionDate: json['transaction_date'] != null
          ? DateTime.parse(json['transaction_date'])
          : DateTime.now(),
      items: json['items'] != null
          ? (json['items'] as List).map((i) => TransactionItem.fromJson(i)).toList()
          : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transaction_code': transactionCode,
      'type': type,
      'member_id': memberId,
      'location_id': locationId,
      'cashier_id': cashierId,
      'sub_total': subTotal,
      'discount': discount,
      'discount_percent': discountPercent,
      'tax': tax,
      'grand_total': grandTotal,
      'payment_method': paymentMethod,
      'paid_amount': paidAmount,
      'change_amount': changeAmount,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'notes': notes,
      'status': status,
      'transaction_date': transactionDate.toIso8601String(),
      if (items != null) 'items': items!.map((i) => i.toJson()).toList(),
    };
  }

  Transaction copyWith({
    int? id,
    String? transactionCode,
    String? type,
    int? memberId,
    Member? member,
    int? locationId,
    Location? location,
    int? cashierId,
    User? cashier,
    double? subTotal,
    double? discount,
    double? discountPercent,
    double? tax,
    double? grandTotal,
    String? paymentMethod,
    double? paidAmount,
    double? changeAmount,
    String? customerName,
    String? customerPhone,
    String? notes,
    String? status,
    DateTime? transactionDate,
    List<TransactionItem>? items,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Transaction(
      id: id ?? this.id,
      transactionCode: transactionCode ?? this.transactionCode,
      type: type ?? this.type,
      memberId: memberId ?? this.memberId,
      member: member ?? this.member,
      locationId: locationId ?? this.locationId,
      location: location ?? this.location,
      cashierId: cashierId ?? this.cashierId,
      cashier: cashier ?? this.cashier,
      subTotal: subTotal ?? this.subTotal,
      discount: discount ?? this.discount,
      discountPercent: discountPercent ?? this.discountPercent,
      tax: tax ?? this.tax,
      grandTotal: grandTotal ?? this.grandTotal,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paidAmount: paidAmount ?? this.paidAmount,
      changeAmount: changeAmount ?? this.changeAmount,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      transactionDate: transactionDate ?? this.transactionDate,
      items: items ?? this.items,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, transactionCode, type, grandTotal, status];
}
