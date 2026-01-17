import api from './api';
import { Sale, PaginationMetadata } from '../types';

export interface ReturnItem {
  id?: number;
  return_id?: number;
  sale_item_id?: number;
  product_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reason?: string;
}

export interface Return {
  id?: number;
  return_number: string;
  sale_id?: number;
  customer_id?: number;
  user_id?: number;
  total_amount: number;
  refund_method: 'cash' | 'credit' | 'exchange';
  status: 'pending' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  return_date?: string;
  created_at?: string;
  items?: ReturnItem[];
  sale_number?: string;
  customer_name?: string;
  username?: string;
}

export interface ReturnStats {
  total_returns: number;
  total_refunded: number;
  average_return: number;
}

export const returnService = {
  async getAllReturns(filters?: {
    sale_id?: number;
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ returns: Return[]; pagination: PaginationMetadata }> {
    const response = await api.get<{ returns: Return[]; pagination: PaginationMetadata }>(
      '/returns',
      { params: filters }
    );
    return response.data;
  },

  async getReturnById(id: number): Promise<Return> {
    const response = await api.get<{ return: Return }>(`/returns/${id}`);
    return response.data.return;
  },

  async createReturn(returnData: {
    sale_id?: number;
    items: ReturnItem[];
    refund_method?: 'cash' | 'credit' | 'exchange';
    reason?: string;
    notes?: string;
  }): Promise<Return> {
    const response = await api.post<{ return: Return }>('/returns', returnData);
    return response.data.return;
  },

  async cancelReturn(id: number): Promise<Return> {
    const response = await api.put<{ return: Return }>(`/returns/${id}/cancel`);
    return response.data.return;
  },

  async getStats(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ReturnStats> {
    const response = await api.get<{ stats: ReturnStats }>('/returns/stats', { params: filters });
    return response.data.stats;
  },

  async getSaleForReturn(saleId: number): Promise<Sale> {
    const response = await api.get<{ sale: Sale }>(`/returns/sale/${saleId}`);
    return response.data.sale;
  }
};
