import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.experience.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
    res.json(items);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.experience.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.experience.update({ where: { id: req.params.id }, data: req.body });
    res.json(item);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.experience.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
