import api from './api';
import { PaginationMetadata } from '../types';

export interface StockMovement {
  id?: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  reference?: string;
  reason?: string;
  notes?: string;
  user_id?: number;
  sale_id?: number;
  previous_stock?: number;
  new_stock?: number;
  movement_date?: string;
  created_at?: string;
  product_name?: string;
  username?: string;
}

export interface StockValue {
  total_purchase_value: number;
  total_selling_value: number;
  total_items: number;
}

export interface MovementSummary {
  movement_type: string;
  count: number;
  total_quantity: number;
}

export const stockMovementService = {
  async getAllMovements(filters?: {
    product_id?: number;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ movements: StockMovement[]; pagination: PaginationMetadata }> {
    const response = await api.get<{ movements: StockMovement[]; pagination: PaginationMetadata }>(
      '/stock-movements',
      { params: filters }
    );
    return response.data;
  },

  async createMovement(movement: {
    product_id: number;
    movement_type: 'in' | 'out' | 'adjustment' | 'return';
    quantity: number;
    reference?: string;
    reason?: string;
    notes?: string;
  }): Promise<StockMovement> {
    const response = await api.post<{ movement: StockMovement }>('/stock-movements', movement);
    return response.data.movement;
  },

  async getMovementsByProduct(productId: number, limit?: number): Promise<StockMovement[]> {
    const response = await api.get<{ movements: StockMovement[] }>(
      `/stock-movements/product/${productId}`,
      { params: { limit } }
    );
    return response.data.movements;
  },

  async getSummary(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<MovementSummary[]> {
    const response = await api.get<{ summary: MovementSummary[] }>(
      '/stock-movements/summary',
      { params: filters }
    );
    return response.data.summary;
  },

  async getStockValue(): Promise<StockValue> {
    const response = await api.get<{ value: StockValue }>('/stock-movements/value');
    return response.data.value;
  }
};
