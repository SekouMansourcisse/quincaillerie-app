import express from 'express';
import {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  receiveGoods,
  deletePurchaseOrder,
  getPurchaseOrderStats
} from '../controllers/purchaseOrderController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllPurchaseOrders);
router.get('/stats', auth, getPurchaseOrderStats);
router.get('/:id', auth, getPurchaseOrderById);
router.post('/', auth, authorize('admin', 'manager'), createPurchaseOrder);
router.put('/:id', auth, authorize('admin', 'manager'), updatePurchaseOrder);
router.post('/:id/receive', auth, authorize('admin', 'manager'), receiveGoods);
router.delete('/:id', auth, authorize('admin', 'manager'), deletePurchaseOrder);

export default router;
