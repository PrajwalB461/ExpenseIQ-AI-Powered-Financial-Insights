import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getOverview, 
  getInsights, 
  exportDashboardData 
} from '../controllers/dashboardController.js';

const router = Router();

// Protect all dashboard endpoints
router.use(protect);

router.get('/overview', getOverview);
router.get('/insights', getInsights);
router.get('/export', exportDashboardData);

export default router;
