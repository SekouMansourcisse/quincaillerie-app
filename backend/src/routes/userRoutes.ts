import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/userController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent d'être admin
router.get('/', auth, authorize('admin'), getAllUsers);
router.get('/:id', auth, authorize('admin'), getUserById);
router.post('/', auth, authorize('admin'), createUser);
router.put('/:id', auth, authorize('admin'), updateUser);
router.delete('/:id', auth, authorize('admin'), deleteUser);
router.patch('/:id/toggle-status', auth, authorize('admin'), toggleUserStatus);

export default router;
