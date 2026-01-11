export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'employee';
  is_active?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  reference?: string;
  barcode?: string;
  category_id?: number;
  supplier_id?: number;
  purchase_price: number;
  selling_price: number;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  unit?: string;
  image_url?: string;
  is_active?: boolean;
  category_name?: string;
  supplier_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id?: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  is_active?: boolean;
}

export interface SaleItem {
  id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id?: number;
  sale_number: string;
  customer_id?: number;
  user_id?: number;
  total_amount: number;
  discount?: number;
  tax?: number;
  net_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'check';
  payment_status: 'paid' | 'pending' | 'partial';
  notes?: string;
  sale_date?: string;
  created_at?: string;
  items?: SaleItem[];
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_sales: number;
  total_revenue: number;
  average_sale: number;
  paid_amount: number;
  pending_amount: number;
  low_stock_count?: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}
