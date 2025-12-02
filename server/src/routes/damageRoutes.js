// server/src/routes/damageRoutes.js
import express from 'express';
import { 
  getCalculations, 
  createCalculation, 
  generateSyntheticData,
  getConfigData,
  updateConfigData,
  deleteCalculation
} from '../controllers/damageController.js';

const router = express.Router();

router.get('/', getCalculations);
router.post('/', createCalculation);
router.delete('/:id', deleteCalculation);

// Синтетика
router.post('/generate', generateSyntheticData);

// Конфігурація
router.get('/config', getConfigData);
router.put('/config', updateConfigData);

export default router;