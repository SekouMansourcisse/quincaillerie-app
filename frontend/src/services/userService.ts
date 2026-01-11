import api from './api';
import { User } from '../types';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<{ users: User[] }>('/users');
    return response.data.users;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data.user;
  },

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }): Promise<User> {
    const response = await api.post<{ user: User }>('/users', userData);
    return response.data.user;
  },

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await api.put<{ user: User }>(`/users/${id}`, userData);
    return response.data.user;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleUserStatus(id: number): Promise<User> {
    const response = await api.patch<{ user: User }>(`/users/${id}/toggle-status`);
    return response.data.user;
  },
};
