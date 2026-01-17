import express from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  getSalesStats,
  getCashReport,
  getDashboardStats
} from '../controllers/saleController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllSales);
router.get('/stats', auth, getSalesStats);
router.get('/dashboard-stats', auth, getDashboardStats);
router.get('/cash-report', auth, getCashReport);
router.get('/:id', auth, getSaleById);
router.post('/', auth, createSale);

export default router;
