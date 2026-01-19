import api from './api';
import { PurchaseOrder, PurchaseOrderItem, PaginatedResult, PaginationMetadata } from '../types';

export interface PurchaseOrderStats {
  total_orders: number;
  total_value: number;
  draft_count: number;
  sent_count: number;
  partial_count: number;
  received_count: number;
  cancelled_count: number;
  pending_value: number;
}

export const purchaseOrderService = {
  async getAllPurchaseOrders(filters?: {
    supplier_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<PurchaseOrder>> {
    const response = await api.get<{ purchase_orders: PurchaseOrder[]; pagination: PaginationMetadata }>('/purchase-orders', { params: filters });
    return {
      data: response.data.purchase_orders,
      pagination: response.data.pagination
    };
  },

  async getPurchaseOrderById(id: number): Promise<PurchaseOrder> {
    const response = await api.get<{ purchase_order: PurchaseOrder }>(`/purchase-orders/${id}`);
    return response.data.purchase_order;
  },

  async createPurchaseOrder(data: {
    supplier_id?: number;
    items: PurchaseOrderItem[];
    discount?: number;
    tax?: number;
    expected_delivery_date?: string;
    notes?: string;
    payment_terms?: string;
  }): Promise<PurchaseOrder> {
    const response = await api.post<{ message: string; purchase_order: PurchaseOrder }>('/purchase-orders', data);
    return response.data.purchase_order;
  },

  async updatePurchaseOrder(id: number, updates: {
    notes?: string;
    payment_terms?: string;
    expected_delivery_date?: string;
  }): Promise<PurchaseOrder> {
    const response = await api.put<{ message: string; purchase_order: PurchaseOrder }>(`/purchase-orders/${id}`, updates);
    return response.data.purchase_order;
  },

  async receiveGoods(id: number, items: { item_id: number; quantity_received: number }[]): Promise<PurchaseOrder> {
    const response = await api.post<{ message: string; purchase_order: PurchaseOrder }>(`/purchase-orders/${id}/receive`, { items });
    return response.data.purchase_order;
  },

  async deletePurchaseOrder(id: number): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },

  async getStats(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<PurchaseOrderStats> {
    const response = await api.get<{ stats: PurchaseOrderStats }>('/purchase-orders/stats', { params: filters });
    return response.data.stats;
  }
};
