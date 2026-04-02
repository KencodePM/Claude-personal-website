import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Public: Submit contact form
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, content } = req.body;
    if (!name || !email || !content) {
      res.status(400).json({ error: 'Name, email and message are required' });
      return;
    }
    const message = await prisma.message.create({ data: { name, email, subject, content } });
    res.status(201).json({ message: 'Message sent successfully', id: message.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Admin: List messages
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(messages);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Mark as read
router.put('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await prisma.message.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(message);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Delete
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
