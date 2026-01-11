import express from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  getSalesStats
} from '../controllers/saleController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllSales);
router.get('/stats', auth, getSalesStats);
router.get('/:id', auth, getSaleById);
router.post('/', auth, createSale);

export default router;
