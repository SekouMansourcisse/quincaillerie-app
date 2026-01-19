import api from './api';

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  module: string;
}

export interface RolesPermissionsResponse {
  permissions: Permission[];
  roles: string[];
  rolePermissions: Record<string, number[]>;
}

export const permissionService = {
  // Obtenir mes permissions
  async getMyPermissions(): Promise<{ role: string; permissions: string[] }> {
    const response = await api.get('/permissions/me');
    return response.data;
  },

  // Obtenir toutes les permissions groupées
  async getAllPermissions(): Promise<{ permissions: Permission[]; grouped: Record<string, Permission[]> }> {
    const response = await api.get('/permissions');
    return response.data;
  },

  // Obtenir toutes les permissions par rôle
  async getAllRolesPermissions(): Promise<RolesPermissionsResponse> {
    const response = await api.get('/permissions/roles');
    return response.data;
  },

  // Obtenir les permissions d'un rôle
  async getRolePermissions(role: string): Promise<{ role: string; permissions: Permission[] }> {
    const response = await api.get(`/permissions/role/${role}`);
    return response.data;
  },

  // Mettre à jour les permissions d'un rôle
  async updateRolePermissions(role: string, permissionIds: number[]): Promise<void> {
    await api.put(`/permissions/role/${role}`, { permissionIds });
  }
};
