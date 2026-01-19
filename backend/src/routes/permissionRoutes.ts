import express from 'express';
import {
  getAllPermissions,
  getRolePermissions,
  getAllRolesPermissions,
  updateRolePermissions,
  getMyPermissions
} from '../controllers/permissionController';
import { auth, authorize, requirePermission } from '../middleware/auth';

const router = express.Router();

// Obtenir mes permissions (utilisateur connecté)
router.get('/me', auth, getMyPermissions);

// Obtenir toutes les permissions
router.get('/', auth, requirePermission('permissions.manage'), getAllPermissions);

// Obtenir toutes les permissions par rôle
router.get('/roles', auth, requirePermission('permissions.manage'), getAllRolesPermissions);

// Obtenir les permissions d'un rôle spécifique
router.get('/role/:role', auth, requirePermission('permissions.manage'), getRolePermissions);

// Mettre à jour les permissions d'un rôle
router.put('/role/:role', auth, authorize('admin'), updateRolePermissions);

export default router;
