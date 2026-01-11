import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplierController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllSuppliers);
router.get('/:id', auth, getSupplierById);
router.post('/', auth, authorize('admin', 'manager'), createSupplier);
router.put('/:id', auth, authorize('admin', 'manager'), updateSupplier);
router.delete('/:id', auth, authorize('admin'), deleteSupplier);

export default router;
