import api from './api';
import { Sale, SaleItem, DashboardStats, PaginatedResult, PaginationMetadata } from '../types';

export const saleService = {
  async getAllSales(filters?: {
    start_date?: string;
    end_date?: string;
    customer_id?: number;
    payment_status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Sale>> {
    const response = await api.get<{ sales: Sale[]; pagination: PaginationMetadata }>('/sales', { params: filters });
    return {
      data: response.data.sales,
      pagination: response.data.pagination
    };
  },

  async getSaleById(id: number): Promise<Sale> {
    const response = await api.get<{ sale: Sale }>(`/sales/${id}`);
    return response.data.sale;
  },

  async createSale(saleData: {
    customer_id?: number;
    total_amount: number;
    discount?: number;
    tax?: number;
    net_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
    items: SaleItem[];
  }): Promise<Sale> {
    const response = await api.post<{ sale: Sale }>('/sales', saleData);
    return response.data.sale;
  },

  async getSalesStats(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<DashboardStats> {
    const response = await api.get<{ stats: DashboardStats }>('/sales/stats', { params: filters });
    return response.data.stats;
  },
};
