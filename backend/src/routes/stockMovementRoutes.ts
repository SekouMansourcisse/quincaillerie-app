import express from 'express';
import {
  getAllMovements,
  createMovement,
  getMovementsByProduct,
  getMovementsSummary,
  getStockValue
} from '../controllers/stockMovementController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllMovements);
router.get('/summary', auth, getMovementsSummary);
router.get('/value', auth, getStockValue);
router.get('/product/:id', auth, getMovementsByProduct);
router.post('/', auth, authorize('admin', 'manager'), createMovement);

export default router;
