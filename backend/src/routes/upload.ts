import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// File upload endpoint — not mounted in current deployment
router.post('/', requireAuth, (_req: Request, res: Response): void => {
  res.status(501).json({ error: 'File upload not configured' });
});

export default router;
