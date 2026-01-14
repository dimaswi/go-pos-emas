import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/services.dart';

class CartItem {
  final Stock stock;
  double discount;

  CartItem({required this.stock, this.discount = 0});

  double get totalPrice => stock.sellingPrice - discount;
  double get finalPrice => stock.sellingPrice - discount;
}

class POSProvider with ChangeNotifier {
  final StockService _stockService = StockService();
  final TransactionService _transactionService = TransactionService();
  final MemberService _memberService = MemberService();

  // Cart items
  final List<CartItem> _cartItems = [];
  List<CartItem> get cartItems => _cartItems;

  // Selected member
  Member? _selectedMember;
  Member? get selectedMember => _selectedMember;

  // Customer info (for non-member)
  String _customerName = '';
  String _customerPhone = '';
  String get customerName => _customerName;
  String get customerPhone => _customerPhone;

  // Payment
  String _paymentMethod = 'cash';
  double _paidAmount = 0;
  double _discount = 0;
  String get paymentMethod => _paymentMethod;
  double get paidAmount => _paidAmount;
  double get discount => _discount;

  // Notes
  String _notes = '';
  String get notes => _notes;

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // Error
  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // Calculations
  double get subTotal {
    return _cartItems.fold(0, (sum, item) => sum + item.stock.sellingPrice);
  }

  double get itemDiscount {
    return _cartItems.fold(0, (sum, item) => sum + item.discount);
  }

  double get totalDiscount => itemDiscount + _discount;

  double get grandTotal => subTotal - totalDiscount;

  double get changeAmount {
    if (_paidAmount > grandTotal) {
      return _paidAmount - grandTotal;
    }
    return 0;
  }

  int get itemCount => _cartItems.length;

  bool get isEmpty => _cartItems.isEmpty;

  bool get canCheckout => !isEmpty && _paidAmount >= grandTotal;

  // Add item to cart by scanning barcode/serial
  Future<bool> addItemBySerial(String serialNumber) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final stock = await _stockService.getStockBySerialNumber(serialNumber);
      
      // Check if already in cart
      if (_cartItems.any((item) => item.stock.id == stock.id)) {
        _errorMessage = 'Item sudah ada di keranjang';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Check if available
      if (stock.status != 'available') {
        _errorMessage = 'Item tidak tersedia';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _cartItems.add(CartItem(stock: stock));
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Add stock directly
  void addStock(Stock stock) {
    if (!_cartItems.any((item) => item.stock.id == stock.id)) {
      _cartItems.add(CartItem(stock: stock));
      notifyListeners();
    }
  }

  // Remove item from cart
  void removeItem(int stockId) {
    _cartItems.removeWhere((item) => item.stock.id == stockId);
    notifyListeners();
  }

  // Update item discount
  void updateItemDiscount(int stockId, double discount) {
    final index = _cartItems.indexWhere((item) => item.stock.id == stockId);
    if (index != -1) {
      _cartItems[index].discount = discount;
      notifyListeners();
    }
  }

  // Clear cart
  void clearCart() {
    _cartItems.clear();
    _selectedMember = null;
    _customerName = '';
    _customerPhone = '';
    _paymentMethod = 'cash';
    _paidAmount = 0;
    _discount = 0;
    _notes = '';
    _errorMessage = null;
    notifyListeners();
  }

  // Set member
  void setMember(Member? member) {
    _selectedMember = member;
    if (member != null) {
      _customerName = member.name;
      _customerPhone = member.phone;
    }
    notifyListeners();
  }

  // Search member
  Future<List<Member>> searchMembers(String query) async {
    return await _memberService.searchMembers(query);
  }

  // Set customer info
  void setCustomerInfo(String name, String phone) {
    _customerName = name;
    _customerPhone = phone;
    notifyListeners();
  }

  // Set payment method
  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  // Set paid amount
  void setPaidAmount(double amount) {
    _paidAmount = amount;
    notifyListeners();
  }

  // Set discount
  void setDiscount(double discount) {
    _discount = discount;
    notifyListeners();
  }

  // Set notes
  void setNotes(String notes) {
    _notes = notes;
    notifyListeners();
  }

  // Process checkout
  Future<bool> checkout({
    required String paymentMethod,
    required double paidAmount,
    required int locationId,
    String? notes,
  }) async {
    if (isEmpty) {
      _errorMessage = 'Keranjang kosong';
      notifyListeners();
      return false;
    }

    if (paidAmount < grandTotal) {
      _errorMessage = 'Jumlah bayar kurang dari total';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Build items array with stock_id, discount, notes
      final List<Map<String, dynamic>> items = _cartItems.map((item) {
        return <String, dynamic>{
          'stock_id': item.stock.id,
          'discount': item.discount,
          'notes': '',
        };
      }).toList();

      await _transactionService.createSale(
        locationId: locationId,
        memberId: _selectedMember?.id,
        customerName: _customerName.isNotEmpty ? _customerName : null,
        customerPhone: _customerPhone.isNotEmpty ? _customerPhone : null,
        items: items,
        paymentMethod: paymentMethod,
        paidAmount: paidAmount,
        discount: 0, // Discount already included in each item
        notes: notes ?? _notes,
      );

      // Clear cart after successful checkout
      clearCart();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
