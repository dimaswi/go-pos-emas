// API Endpoints
class ApiEndpoints {
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String profile = '/auth/profile';
  static const String changePassword = '/auth/change-password';
  
  static const String users = '/users';
  static const String roles = '/roles';
  static const String permissions = '/permissions';
  
  static const String products = '/products';
  static const String goldCategories = '/gold-categories';
  static const String stocks = '/stocks';
  static const String stockTransfers = '/stock-transfers';
  static const String locations = '/locations';
  static const String storageBoxes = '/storage-boxes';
  
  static const String transactions = '/transactions';
  static const String transactionSale = '/transactions/sale';
  static const String transactionPurchase = '/transactions/purchase';
  static const String dailySummary = '/transactions/daily-summary';
  
  static const String members = '/members';
  
  static const String settings = '/settings';
}

// Product Types
class ProductTypes {
  static const String gelang = 'gelang';
  static const String cincin = 'cincin';
  static const String kalung = 'kalung';
  static const String anting = 'anting';
  static const String liontin = 'liontin';
  static const String other = 'other';
  
  static List<String> get all => [gelang, cincin, kalung, anting, liontin, other];
  
  static String getLabel(String type) {
    switch (type) {
      case gelang: return 'Gelang';
      case cincin: return 'Cincin';
      case kalung: return 'Kalung';
      case anting: return 'Anting';
      case liontin: return 'Liontin';
      case other: return 'Lainnya';
      default: return type;
    }
  }
}

// Product Categories
class ProductCategories {
  static const String dewasa = 'dewasa';
  static const String anak = 'anak';
  static const String unisex = 'unisex';
  
  static List<String> get all => [dewasa, anak, unisex];
  
  static String getLabel(String category) {
    switch (category) {
      case dewasa: return 'Dewasa';
      case anak: return 'Anak';
      case unisex: return 'Unisex';
      default: return category;
    }
  }
}

// Transaction Types
class TransactionTypes {
  static const String sale = 'sale';
  static const String purchase = 'purchase';
  
  static String getLabel(String type) {
    switch (type) {
      case sale: return 'Penjualan';
      case purchase: return 'Pembelian/Setor';
      default: return type;
    }
  }
}

// Payment Methods
class PaymentMethods {
  static const String cash = 'cash';
  static const String transfer = 'transfer';
  static const String card = 'card';
  static const String mixed = 'mixed';
  
  static List<String> get all => [cash, transfer, card, mixed];
  
  static String getLabel(String method) {
    switch (method) {
      case cash: return 'Tunai';
      case transfer: return 'Transfer';
      case card: return 'Kartu';
      case mixed: return 'Campuran';
      default: return method;
    }
  }
}

// Stock Status
class StockStatus {
  static const String available = 'available';
  static const String reserved = 'reserved';
  static const String sold = 'sold';
  static const String transfer = 'transfer';
  
  static String getLabel(String status) {
    switch (status) {
      case available: return 'Tersedia';
      case reserved: return 'Dipesan';
      case sold: return 'Terjual';
      case transfer: return 'Transfer';
      default: return status;
    }
  }
}

// Member Types
class MemberTypes {
  static const String regular = 'regular';
  static const String silver = 'silver';
  static const String gold = 'gold';
  static const String platinum = 'platinum';
  
  static String getLabel(String type) {
    switch (type) {
      case regular: return 'Regular';
      case silver: return 'Silver';
      case gold: return 'Gold';
      case platinum: return 'Platinum';
      default: return type;
    }
  }
}

// Location Types
class LocationTypes {
  static const String gudang = 'gudang';
  static const String toko = 'toko';
  
  static String getLabel(String type) {
    switch (type) {
      case gudang: return 'Gudang';
      case toko: return 'Toko';
      default: return type;
    }
  }
}
