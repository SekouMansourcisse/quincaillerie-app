import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PermissionModel } from '../models/Permission';

// Type alias pour rétrocompatibilité
export type AuthRequest = Request;

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as any;

    // Charger les permissions de l'utilisateur
    try {
      const permissions = await PermissionModel.getCodesByRole(decoded.role);
      req.user = { ...decoded, permissions };
    } catch (error) {
      // Si les permissions ne peuvent pas être chargées, continuer sans
      req.user = decoded;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Autorisation par rôle (rétrocompatibilité)
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    next();
  };
};

// Autorisation par permission
export const requirePermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // Admin a toujours accès
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si l'utilisateur a au moins une des permissions requises
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Permission refusée',
        required: permissions,
        message: 'Vous n\'avez pas les permissions nécessaires pour cette action'
      });
    }

    next();
  };
};

// Vérifier plusieurs permissions (toutes requises)
export const requireAllPermissions = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // Admin a toujours accès
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(perm => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Permissions insuffisantes',
        required: permissions,
        message: 'Vous n\'avez pas toutes les permissions nécessaires'
      });
    }

    next();
  };
};
