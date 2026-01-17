import express from 'express';
import {
  getAllReturns,
  getReturnById,
  createReturn,
  cancelReturn,
  getReturnStats,
  getSaleItemsForReturn
} from '../controllers/returnController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllReturns);
router.get('/stats', auth, getReturnStats);
router.get('/sale/:saleId', auth, getSaleItemsForReturn);
router.get('/:id', auth, getReturnById);
router.post('/', auth, authorize('admin', 'manager'), createReturn);
router.put('/:id/cancel', auth, authorize('admin', 'manager'), cancelReturn);

export default router;
