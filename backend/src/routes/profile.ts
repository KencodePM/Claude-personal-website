import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public: Get profile
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }
    res.json(profile);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Update profile
router.put('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.profile.findFirst();
    const data = req.body;
    if (existing) {
      const updated = await prisma.profile.update({ where: { id: existing.id }, data });
      res.json(updated);
    } else {
      const created = await prisma.profile.create({ data });
      res.json(created);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
