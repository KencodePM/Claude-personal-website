import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public: Get profile
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) { res.status(404).json({ success: false, error: 'Profile not found' }); return; }
    res.json({ success: true, data: profile });
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// Admin: Update profile
router.put('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.profile.findFirst();
    const data = { ...req.body, updatedAt: new Date() };
    if (existing) {
      const updated = await prisma.profile.update({ where: { id: existing.id }, data });
      res.json({ success: true, data: updated });
    } else {
      const created = await prisma.profile.create({ data });
      res.json({ success: true, data: created });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
