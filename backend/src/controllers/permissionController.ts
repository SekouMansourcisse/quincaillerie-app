import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PermissionModel } from '../models/Permission';

// Obtenir toutes les permissions
export const getAllPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await PermissionModel.findAll();

    // Grouper par module
    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.json({ permissions, grouped });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les permissions d'un rôle
export const getRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.params;

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const permissions = await PermissionModel.getByRole(role);
    res.json({ role, permissions });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions du rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir toutes les permissions par rôle
export const getAllRolesPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const allPermissions = await PermissionModel.findAll();
    const rolesPermissions = await PermissionModel.getAllRolesWithPermissions();

    // Créer un mapping des permissions par rôle (IDs)
    const rolePermissionIds: Record<string, number[]> = {};
    for (const role of Object.keys(rolesPermissions)) {
      rolePermissionIds[role] = rolesPermissions[role].map(p => p.id!);
    }

    res.json({
      permissions: allPermissions,
      roles: ['admin', 'manager', 'employee'],
      rolePermissions: rolePermissionIds
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour les permissions d'un rôle
export const updateRolePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.params;
    const { permissionIds } = req.body;

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    if (role === 'admin') {
      return res.status(400).json({ error: 'Les permissions de l\'administrateur ne peuvent pas être modifiées' });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds doit être un tableau' });
    }

    await PermissionModel.updateRolePermissions(role, permissionIds);

    const updatedPermissions = await PermissionModel.getByRole(role);
    res.json({
      message: 'Permissions mises à jour avec succès',
      role,
      permissions: updatedPermissions
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Obtenir les permissions de l'utilisateur connecté
export const getMyPermissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const permissions = await PermissionModel.getCodesByRole(req.user.role);
    res.json({
      role: req.user.role,
      permissions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
