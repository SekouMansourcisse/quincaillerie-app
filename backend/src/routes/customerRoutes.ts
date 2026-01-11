import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllCustomers);
router.get('/:id', auth, getCustomerById);
router.post('/', auth, createCustomer);
router.put('/:id', auth, authorize('admin', 'manager'), updateCustomer);
router.delete('/:id', auth, authorize('admin'), deleteCustomer);

export default router;
