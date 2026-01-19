import pool from '../config/database';

export interface Permission {
  id?: number;
  code: string;
  name: string;
  description?: string;
  module: string;
  created_at?: Date;
}

export interface RolePermission {
  role: string;
  permission_id: number;
  permission_code?: string;
}

// Liste des permissions disponibles
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Produits
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',

  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',

  // Fournisseurs
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_EDIT: 'suppliers.edit',
  SUPPLIERS_DELETE: 'suppliers.delete',

  // Clients
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',

  // Ventes
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_EDIT: 'sales.edit',
  SALES_DELETE: 'sales.delete',
  SALES_STATS: 'sales.stats',

  // Retours
  RETURNS_VIEW: 'returns.view',
  RETURNS_CREATE: 'returns.create',
  RETURNS_CANCEL: 'returns.cancel',

  // Inventaire
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Rapports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Utilisateurs
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Permissions
  PERMISSIONS_MANAGE: 'permissions.manage'
};

// Permissions par défaut pour chaque rôle
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS), // Admin a toutes les permissions

  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_STATS,
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.RETURNS_CREATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  employee: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.RETURNS_VIEW,
    PERMISSIONS.INVENTORY_VIEW
  ]
};

export class PermissionModel {
  // Obtenir toutes les permissions
  static async findAll(): Promise<Permission[]> {
    const query = 'SELECT * FROM permissions ORDER BY module, name';
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtenir les permissions d'un rôle
  static async getByRole(role: string): Promise<Permission[]> {
    const query = `
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = $1
      ORDER BY p.module, p.name
    `;
    const result = await pool.query(query, [role]);
    return result.rows;
  }

  // Obtenir les codes de permissions d'un rôle
  static async getCodesByRole(role: string): Promise<string[]> {
    const query = `
      SELECT p.code FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = $1
    `;
    const result = await pool.query(query, [role]);
    return result.rows.map((r: any) => r.code);
  }

  // Vérifier si un rôle a une permission
  static async roleHasPermission(role: string, permissionCode: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = $1 AND p.code = $2
    `;
    const result = await pool.query(query, [role, permissionCode]);
    return result.rows.length > 0;
  }

  // Mettre à jour les permissions d'un rôle
  static async updateRolePermissions(role: string, permissionIds: number[]): Promise<void> {
    // Supprimer les anciennes permissions
    await pool.query('DELETE FROM role_permissions WHERE role = $1', [role]);

    // Ajouter les nouvelles permissions
    for (const permissionId of permissionIds) {
      await pool.query(
        'INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)',
        [role, permissionId]
      );
    }
  }

  // Obtenir tous les rôles avec leurs permissions
  static async getAllRolesWithPermissions(): Promise<Record<string, Permission[]>> {
    const roles = ['admin', 'manager', 'employee'];
    const result: Record<string, Permission[]> = {};

    for (const role of roles) {
      result[role] = await this.getByRole(role);
    }

    return result;
  }
}
