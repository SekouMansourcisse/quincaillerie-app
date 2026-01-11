import api from './api';
import { Category } from '../types';

export const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get<{ categories: Category[] }>('/categories');
    return response.data.categories;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<{ category: Category }>(`/categories/${id}`);
    return response.data.category;
  },

  async createCategory(category: Category): Promise<Category> {
    const response = await api.post<{ category: Category }>('/categories', category);
    return response.data.category;
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await api.put<{ category: Category }>(`/categories/${id}`, category);
    return response.data.category;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
