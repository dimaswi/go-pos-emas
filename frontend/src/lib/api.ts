import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Permission {
  id: number;
  name: string;
  module: string;
  category: string;
  description: string;
  actions: string; // JSON string containing array of actions
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  role_id?: number;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/auth/login', data),
  
  getProfile: () => 
    api.get<User>('/auth/profile'),
};

export const usersApi = {
  getAll: () => 
    api.get<{ data: User[] }>('/users'),
  
  getById: (id: number) => 
    api.get<{ data: User }>(`/users/${id}`),
  
  create: (data: any) => 
    api.post<{ data: User }>('/users', data),
  
  update: (id: number, data: any) => 
    api.put<{ data: User }>(`/users/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/users/${id}`),
};

export const rolesApi = {
  getAll: () => 
    api.get('/roles'),
  
  getById: (id: number) => 
    api.get(`/roles/${id}`),
  
  create: (data: any) => 
    api.post('/roles', data),
  
  update: (id: number, data: any) => 
    api.put(`/roles/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/roles/${id}`),
};

export const permissionsApi = {
  getAll: () => 
    api.get('/permissions'),
  
  getById: (id: number) => 
    api.get(`/permissions/${id}`),
  
  create: (data: any) => 
    api.post('/permissions', data),
  
  update: (id: number, data: any) => 
    api.put(`/permissions/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/permissions/${id}`),
};

export const settingsApi = {
  getAll: () => 
    api.get('/settings'),
  
  update: (data: Record<string, string>) => 
    api.put('/settings', data),

  uploadLogo: (file: File, type: 'logo' | 'favicon') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ==================== POS API ====================

// Gold Category Types
export interface GoldCategory {
  id: number;
  code: string;
  name: string;
  purity: number;
  buy_price: number;
  sell_price: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const goldCategoriesApi = {
  getAll: (params?: { page?: number; page_size?: number }) => 
    api.get<{ data: GoldCategory[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/gold-categories', { params }),
  getById: (id: number) => api.get<{ data: GoldCategory }>(`/gold-categories/${id}`),
  create: (data: Partial<GoldCategory>) => api.post<{ data: GoldCategory }>('/gold-categories', data),
  update: (id: number, data: Partial<GoldCategory>) => api.put<{ data: GoldCategory }>(`/gold-categories/${id}`, data),
  delete: (id: number) => api.delete(`/gold-categories/${id}`),
};

// Product Types
export type ProductType = 'gelang' | 'cincin' | 'kalung' | 'anting' | 'liontin' | 'other';
export type ProductCategory = 'dewasa' | 'anak' | 'unisex';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  type: ProductType;
  category: ProductCategory;
  gold_category_id: number;
  gold_category?: GoldCategory;
  weight: number;
  description: string;
  ring_size?: string;
  bracelet_length?: number;
  necklace_length?: number;
  earring_type?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const productsApi = {
  getAll: (params?: { type?: string; category?: string; gold_category_id?: number; page?: number; page_size?: number }) => 
    api.get<{ data: Product[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/products', { params }),
  getById: (id: number) => api.get<{ data: Product }>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<{ data: Product }>(`/products/barcode/${barcode}`),
  create: (data: Partial<Product>) => api.post<{ data: Product }>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<{ data: Product }>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Location Types
export type LocationType = 'gudang' | 'toko';

export interface Location {
  id: number;
  code: string;
  name: string;
  type: LocationType;
  address: string;
  phone: string;
  description: string;
  is_active: boolean;
  boxes?: StorageBox[];
  created_at: string;
  updated_at: string;
}

export interface StorageBox {
  id: number;
  location_id: number;
  location?: Location;
  code: string;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const locationsApi = {
  getAll: (params?: { type?: string; page?: number; page_size?: number }) => 
    api.get<{ data: Location[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/locations', { params }),
  getById: (id: number) => api.get<{ data: Location }>(`/locations/${id}`),
  create: (data: Partial<Location>) => api.post<{ data: Location }>('/locations', data),
  update: (id: number, data: Partial<Location>) => api.put<{ data: Location }>(`/locations/${id}`, data),
  delete: (id: number) => api.delete(`/locations/${id}`),
};

export const storageBoxesApi = {
  getAll: (params?: { location_id?: number; page?: number; page_size?: number }) => 
    api.get<{ data: StorageBox[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/storage-boxes', { params }),
  getById: (id: number) => api.get<{ data: StorageBox }>(`/storage-boxes/${id}`),
  create: (data: Partial<StorageBox>) => api.post<{ data: StorageBox }>('/storage-boxes', data),
  update: (id: number, data: Partial<StorageBox>) => api.put<{ data: StorageBox }>(`/storage-boxes/${id}`, data),
  delete: (id: number) => api.delete(`/storage-boxes/${id}`),
};

// Member Types
export type MemberType = 'regular' | 'silver' | 'gold' | 'platinum';

export interface Member {
  id: number;
  code: string;
  member_code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  id_number: string;
  id_card_number: string;
  member_type: MemberType;
  type: MemberType;
  points: number;
  total_purchase: number;
  total_sell: number;
  transaction_count: number;
  join_date: string;
  birth_date?: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const membersApi = {
  getAll: (params?: { type?: string; is_active?: boolean; search?: string; page?: number; page_size?: number }) => 
    api.get<{ data: Member[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/members', { params }),
  getById: (id: number) => api.get<{ data: Member }>(`/members/${id}`),
  getByCode: (code: string) => api.get<{ data: Member }>(`/members/code/${code}`),
  create: (data: Partial<Member>) => api.post<{ data: Member }>('/members', data),
  update: (id: number, data: Partial<Member>) => api.put<{ data: Member }>(`/members/${id}`, data),
  delete: (id: number) => api.delete(`/members/${id}`),
  addPoints: (id: number, amount: number) => api.post(`/members/${id}/points`, { amount }),
};

// Stock Types
export type StockStatus = 'available' | 'reserved' | 'sold' | 'transfer';

export interface Stock {
  id: number;
  product_id: number;
  product?: Product;
  location_id: number;
  location?: Location;
  storage_box_id: number;
  storage_box?: StorageBox;
  serial_number: string;
  status: StockStatus;
  buy_price: number;
  sell_price: number;
  supplier_name?: string;
  received_at?: string;
  sold_at?: string;
  transaction_id?: number;
  notes?: string;
  barcode_printed: boolean;
  barcode_printed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStockRequest {
  product_id: number;
  location_id: number;
  storage_box_id: number;
  quantity: number;
  supplier_name?: string;
  notes?: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  stock_id: number;
  stock?: Stock;
  from_location_id: number;
  from_location?: Location;
  from_box_id: number;
  from_box?: StorageBox;
  to_location_id: number;
  to_location?: Location;
  to_box_id: number;
  to_box?: StorageBox;
  transferred_by_id: number;
  transferred_by?: User;
  transferred_at: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const stocksApi = {
  getAll: (params?: { location_id?: number; storage_box_id?: number; status?: string; product_id?: number; page?: number; page_size?: number }) => 
    api.get<{ data: Stock[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/stocks', { params }),
  getById: (id: number) => api.get<{ data: Stock }>(`/stocks/${id}`),
  getBySerial: (serial: string) => api.get<{ data: Stock }>(`/stocks/serial/${serial}`),
  create: (data: CreateStockRequest) => api.post<{ data: Stock[]; count: number }>('/stocks', data),
  update: (id: number, data: Partial<Stock>) => api.put<{ data: Stock }>(`/stocks/${id}`, data),
  delete: (id: number) => api.delete(`/stocks/${id}`),
  transfer: (data: { stock_id: number; from_location_id?: number; to_location_id: number; to_box_id?: number; quantity?: number; notes?: string }) => 
    api.post<{ data: StockTransfer }>('/stocks/transfer', data),
  getTransfers: (params?: { stock_id?: number; from_location_id?: number; to_location_id?: number }) => 
    api.get<{ data: StockTransfer[] }>('/stock-transfers', { params }),
};

// Transaction Types
export type TransactionType = 'sale' | 'purchase';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';

export interface TransactionItem {
  id: number;
  transaction_id: number;
  stock_id?: number;
  stock?: Stock;
  product_id?: number;
  product?: Product;
  gold_category_id?: number;
  gold_category?: GoldCategory;
  item_name: string;
  barcode: string;
  weight: number;
  price_per_gram: number;
  unit_price: number;
  quantity: number;
  discount: number;
  sub_total: number;
  notes: string;
}

export interface Transaction {
  id: number;
  transaction_code: string;
  type: TransactionType;
  member_id?: number;
  member?: Member;
  location_id: number;
  location?: Location;
  cashier_id: number;
  cashier?: User;
  sub_total: number;
  discount: number;
  discount_percent: number;
  tax: number;
  grand_total: number;
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  customer_name?: string;
  customer_phone?: string;
  notes: string;
  status: string;
  transaction_date: string;
  items?: TransactionItem[];
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  total_sales: number;
  total_purchases: number;
  sales_count: number;
  purchases_count: number;
  sales_amount: number;
  purchases_amount: number;
  total_weight: number;
  net_amount: number;
}

export const transactionsApi = {
  getAll: (params?: { type?: string; location_id?: number; member_id?: number; status?: string; start_date?: string; end_date?: string; page?: number; page_size?: number }) => 
    api.get<{ data: Transaction[]; pagination?: { total: number; total_pages: number; page: number; page_size: number } }>('/transactions', { params }),
  getById: (id: number) => api.get<{ data: Transaction }>(`/transactions/${id}`),
  getByCode: (code: string) => api.get<{ data: Transaction }>(`/transactions/code/${code}`),
  createSale: (data: {
    location_id: number;
    member_id?: number;
    customer_name?: string;
    customer_phone?: string;
    items: { stock_id: number; discount?: number; notes?: string }[];
    discount_percent?: number;
    discount?: number;
    tax?: number;
    payment_method: string;
    paid_amount: number;
    notes?: string;
  }) => api.post<{ data: Transaction }>('/transactions/sale', data),
  createPurchase: (data: {
    location_id: number;
    member_id?: number;
    customer_name?: string;
    customer_phone?: string;
    items: { gold_category_id?: number; purity?: string; weight: number; price_per_gram: number; condition?: string; notes?: string }[];
    payment_method: string;
    notes?: string;
  }) => api.post<{ data: Transaction }>('/transactions/purchase', data),
  cancel: (id: number) => api.put<{ data: Transaction }>(`/transactions/${id}/cancel`),
  getDailySummary: (params?: { date?: string; location_id?: number }) => 
    api.get<{ data: DailySummary }>('/transactions/daily-summary', { params }),
};

// Raw Material Types
export type RawMaterialStatus = 'available' | 'processed' | 'sold';
export type RawMaterialCondition = 'new' | 'like_new' | 'scratched' | 'dented' | 'damaged';

export interface RawMaterial {
  id: number;
  code: string;
  gold_category_id?: number;
  gold_category?: GoldCategory;
  location_id: number;
  location?: Location;
  weight_gross: number;         // Berat kotor (sebelum susut)
  shrinkage_percent: number;    // Persentase susut
  weight_grams: number;         // Berat bersih (setelah susut)
  purity: number;
  buy_price_per_gram: number;
  total_buy_price: number;
  condition: RawMaterialCondition;
  status: RawMaterialStatus;
  supplier_name?: string;
  member_id?: number;
  member?: Member;
  transaction_id?: number;
  received_at?: string;
  received_by_id?: number;
  received_by?: User;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RawMaterialStats {
  total_count: number;
  total_weight: number;
  total_value: number;
  location_stats: {
    location_id: number;
    location_name: string;
    total_weight: number;
    total_value: number;
    total_count: number;
  }[];
}

export const rawMaterialsApi = {
  getAll: (params?: { location_id?: number; gold_category_id?: number; status?: string; condition?: string; search?: string; page?: number; limit?: number }) => 
    api.get<{ data: RawMaterial[]; meta?: { total: number; total_pages: number; page: number; limit: number } }>('/raw-materials', { params }),
  getById: (id: number) => api.get<{ data: RawMaterial }>(`/raw-materials/${id}`),
  getStats: () => api.get<RawMaterialStats>('/raw-materials/stats'),
  create: (data: {
    gold_category_id?: number;
    location_id: number;
    weight_gross?: number;
    shrinkage_percent?: number;
    weight_grams: number;
    purity?: number;
    buy_price_per_gram: number;
    condition?: string;
    supplier_name?: string;
    member_id?: number;
    transaction_id?: number;
    notes?: string;
  }) => api.post<RawMaterial>('/raw-materials', data),
  update: (id: number, data: Partial<RawMaterial>) => api.put<RawMaterial>(`/raw-materials/${id}`, data),
  delete: (id: number) => api.delete(`/raw-materials/${id}`),
};
