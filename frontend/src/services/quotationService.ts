import api from './api';
import { Quotation, QuotationItem, PaginatedResult, PaginationMetadata } from '../types';

export interface QuotationStats {
  total_quotations: number;
  total_value: number;
  draft_count: number;
  sent_count: number;
  accepted_count: number;
  rejected_count: number;
  expired_count: number;
  converted_count: number;
  converted_value: number;
  conversion_rate: number;
}

export const quotationService = {
  async getAllQuotations(filters?: {
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Quotation>> {
    const response = await api.get<{ quotations: Quotation[]; pagination: PaginationMetadata }>('/quotations', { params: filters });
    return {
      data: response.data.quotations,
      pagination: response.data.pagination
    };
  },

  async getQuotationById(id: number): Promise<Quotation> {
    const response = await api.get<{ quotation: Quotation }>(`/quotations/${id}`);
    return response.data.quotation;
  },

  async createQuotation(data: {
    customer_id?: number;
    items: QuotationItem[];
    discount?: number;
    tax?: number;
    notes?: string;
    terms_conditions?: string;
    validity_days?: number;
  }): Promise<Quotation> {
    const response = await api.post<{ message: string; quotation: Quotation }>('/quotations', data);
    return response.data.quotation;
  },

  async updateQuotation(id: number, updates: {
    notes?: string;
    terms_conditions?: string;
    validity_days?: number;
    valid_until?: string;
  }): Promise<Quotation> {
    const response = await api.put<{ message: string; quotation: Quotation }>(`/quotations/${id}`, updates);
    return response.data.quotation;
  },

  async updateStatus(id: number, status: string): Promise<Quotation> {
    const response = await api.patch<{ message: string; quotation: Quotation }>(`/quotations/${id}/status`, { status });
    return response.data.quotation;
  },

  async convertToSale(id: number, paymentData: {
    payment_method: 'cash' | 'card' | 'transfer' | 'check';
    payment_status: 'paid' | 'pending' | 'partial';
  }): Promise<any> {
    const response = await api.post<{ message: string; sale: any }>(`/quotations/${id}/convert`, paymentData);
    return response.data.sale;
  },

  async deleteQuotation(id: number): Promise<void> {
    await api.delete(`/quotations/${id}`);
  },

  async getStats(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<QuotationStats> {
    const response = await api.get<{ stats: QuotationStats }>('/quotations/stats', { params: filters });
    return response.data.stats;
  },

  async markExpiredQuotations(): Promise<number> {
    const response = await api.post<{ message: string; count: number }>('/quotations/mark-expired');
    return response.data.count;
  }
};
