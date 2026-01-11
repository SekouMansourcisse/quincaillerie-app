import api from './api';
import { Product, PaginatedResult, PaginationMetadata } from '../types';

export const productService = {
  async getAllProducts(filters?: {
    search?: string;
    category_id?: number;
    supplier_id?: number;
    low_stock?: boolean;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Product>> {
    const response = await api.get<{ products: Product[]; pagination: PaginationMetadata }>('/products', { params: filters });
    return {
      data: response.data.products,
      pagination: response.data.pagination
    };
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<{ product: Product }>(`/products/${id}`);
    return response.data.product;
  },

  async createProduct(product: Product): Promise<Product> {
    const response = await api.post<{ product: Product }>('/products', product);
    return response.data.product;
  },

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await api.put<{ product: Product }>(`/products/${id}`, product);
    return response.data.product;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get<{ products: Product[] }>('/products/low-stock');
    return response.data.products;
  },
};
