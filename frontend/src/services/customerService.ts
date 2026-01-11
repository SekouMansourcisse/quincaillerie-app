import api from './api';

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

export const customerService = {
  async getAllCustomers(isActive?: boolean): Promise<Customer[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await api.get<{ customers: Customer[] }>('/customers', { params });
    return response.data.customers;
  },

  async getCustomerById(id: number): Promise<Customer> {
    const response = await api.get<{ customer: Customer }>(`/customers/${id}`);
    return response.data.customer;
  },

  async createCustomer(customer: Customer): Promise<Customer> {
    const response = await api.post<{ customer: Customer }>('/customers', customer);
    return response.data.customer;
  },

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    const response = await api.put<{ customer: Customer }>(`/customers/${id}`, customer);
    return response.data.customer;
  },

  async deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
