import { Router } from 'express';
import { getHealth, getDbHealth, getAIHealth } from '../controllers/healthController';

const router = Router();

router.get('/', getHealth);
router.get('/db', getDbHealth);
router.get('/ai', getAIHealth);

export default router;
