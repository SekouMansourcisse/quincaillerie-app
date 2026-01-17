import api from './api';
import { Sale, SaleItem, DashboardStats, PaginatedResult, PaginationMetadata } from '../types';

export interface DashboardAdvancedStats {
  salesByDay: {
    date: string;
    count: number;
    total: number;
  }[];
  byPaymentMethod: {
    payment_method: string;
    count: number;
    total: number;
  }[];
  topProducts: {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
  byCategory: {
    category_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
  trends: {
    currentPeriod: {
      total_sales: number;
      total_revenue: number;
    };
    previousPeriod: {
      total_sales: number;
      total_revenue: number;
    };
    salesTrend: number;
    revenueTrend: number;
  };
}

export interface CashReport {
  date: string;
  summary: {
    total_transactions: number;
    total_revenue: number;
    total_discount: number;
    average_sale: number;
  };
  byPaymentMethod: {
    payment_method: string;
    count: number;
    total: number;
  }[];
  byPaymentStatus: {
    payment_status: string;
    count: number;
    total: number;
  }[];
  topProducts: {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    count: number;
    total: number;
  }[];
  sales: Sale[];
}

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

  async getCashReport(date?: string): Promise<CashReport> {
    const response = await api.get<CashReport>('/sales/cash-report', { params: { date } });
    return response.data;
  },

  async getDashboardStats(days?: number): Promise<DashboardAdvancedStats> {
    const response = await api.get<{ stats: DashboardAdvancedStats }>('/sales/dashboard-stats', { params: { days } });
    return response.data.stats;
  },
};
