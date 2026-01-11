import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllCategories);
router.get('/:id', auth, getCategoryById);
router.post('/', auth, authorize('admin', 'manager'), createCategory);
router.put('/:id', auth, authorize('admin', 'manager'), updateCategory);
router.delete('/:id', auth, authorize('admin'), deleteCategory);

export default router;
