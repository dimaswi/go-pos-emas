import 'package:equatable/equatable.dart';

class Member extends Equatable {
  final int id;
  final String memberCode;
  final String name;
  final String phone;
  final String email;
  final String address;
  final String idNumber;
  final String type; // regular, silver, gold, platinum
  final int points;
  final double totalPurchase;
  final double totalSell;
  final DateTime? joinDate;
  final DateTime? birthDate;
  final String notes;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Member({
    required this.id,
    required this.memberCode,
    required this.name,
    this.phone = '',
    this.email = '',
    this.address = '',
    this.idNumber = '',
    this.type = 'regular',
    this.points = 0,
    this.totalPurchase = 0,
    this.totalSell = 0,
    this.joinDate,
    this.birthDate,
    this.notes = '',
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  // Alias for consistency
  int get totalPurchases => totalPurchase.toInt();

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      id: json['id'] ?? 0,
      memberCode: json['member_code'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      address: json['address'] ?? '',
      idNumber: json['id_number'] ?? '',
      type: json['type'] ?? 'regular',
      points: json['points'] ?? 0,
      totalPurchase: (json['total_purchase'] ?? 0).toDouble(),
      totalSell: (json['total_sell'] ?? 0).toDouble(),
      joinDate: json['join_date'] != null ? DateTime.parse(json['join_date']) : null,
      birthDate: json['birth_date'] != null ? DateTime.parse(json['birth_date']) : null,
      notes: json['notes'] ?? '',
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_code': memberCode,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'id_number': idNumber,
      'type': type,
      'points': points,
      'total_purchase': totalPurchase,
      'total_sell': totalSell,
      'join_date': joinDate?.toIso8601String(),
      'birth_date': birthDate?.toIso8601String(),
      'notes': notes,
      'is_active': isActive,
    };
  }

  Member copyWith({
    int? id,
    String? memberCode,
    String? name,
    String? phone,
    String? email,
    String? address,
    String? idNumber,
    String? type,
    int? points,
    double? totalPurchase,
    double? totalSell,
    DateTime? joinDate,
    DateTime? birthDate,
    String? notes,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Member(
      id: id ?? this.id,
      memberCode: memberCode ?? this.memberCode,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      idNumber: idNumber ?? this.idNumber,
      type: type ?? this.type,
      points: points ?? this.points,
      totalPurchase: totalPurchase ?? this.totalPurchase,
      totalSell: totalSell ?? this.totalSell,
      joinDate: joinDate ?? this.joinDate,
      birthDate: birthDate ?? this.birthDate,
      notes: notes ?? this.notes,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [id, memberCode, name, phone, type, isActive];
}
