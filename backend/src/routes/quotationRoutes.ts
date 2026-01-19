import express from 'express';
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertQuotationToSale,
  deleteQuotation,
  getQuotationStats,
  markExpiredQuotations
} from '../controllers/quotationController';
import { auth, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getAllQuotations);
router.get('/stats', auth, getQuotationStats);
router.post('/mark-expired', auth, authorize('admin', 'manager'), markExpiredQuotations);
router.get('/:id', auth, getQuotationById);
router.post('/', auth, authorize('admin', 'manager'), createQuotation);
router.put('/:id', auth, authorize('admin', 'manager'), updateQuotation);
router.patch('/:id/status', auth, authorize('admin', 'manager'), updateQuotationStatus);
router.post('/:id/convert', auth, authorize('admin', 'manager'), convertQuotationToSale);
router.delete('/:id', auth, authorize('admin', 'manager'), deleteQuotation);

export default router;
