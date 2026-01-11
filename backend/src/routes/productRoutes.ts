import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} from '../controllers/productController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllProducts);
router.get('/low-stock', auth, getLowStockProducts);
router.get('/:id', auth, getProductById);
router.post('/', auth, authorize('admin', 'manager'), createProduct);
router.put('/:id', auth, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', auth, authorize('admin'), deleteProduct);

export default router;
