import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createEMI,
  getEMIs,
  updateEMI,
  deleteEMI,
  markEMIPaid,
  cashFlowCheck
} from '../controllers/emiController.js';

const router = Router();

// Protect all EMI endpoints
router.use(protect);

router.post('/', createEMI);
router.get('/', getEMIs);
router.get('/cash-flow-check', cashFlowCheck);
router.put('/:id', updateEMI);
router.delete('/:id', deleteEMI);
router.post('/:id/mark-paid', markEMIPaid);

export default router;
