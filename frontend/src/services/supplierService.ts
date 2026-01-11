import api from './api';
import { Supplier } from '../types';

export const supplierService = {
  async getAllSuppliers(isActive?: boolean): Promise<Supplier[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await api.get<{ suppliers: Supplier[] }>('/suppliers', { params });
    return response.data.suppliers;
  },

  async getSupplierById(id: number): Promise<Supplier> {
    const response = await api.get<{ supplier: Supplier }>(`/suppliers/${id}`);
    return response.data.supplier;
  },

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    const response = await api.post<{ supplier: Supplier }>('/suppliers', supplier);
    return response.data.supplier;
  },

  async updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
    const response = await api.put<{ supplier: Supplier }>(`/suppliers/${id}`, supplier);
    return response.data.supplier;
  },

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
