import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Public: List projects
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({ orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }] });
    const parsed = projects.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    res.json(parsed);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Public: Get single project
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ...project, tags: JSON.parse(project.tags || '[]') });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Create project
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tags, ...rest } = req.body;
    const project = await prisma.project.create({ data: { ...rest, tags: JSON.stringify(tags || []) } });
    res.status(201).json({ ...project, tags: JSON.parse(project.tags) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Admin: Update project
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tags, ...rest } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...rest, ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}) }
    });
    res.json({ ...project, tags: JSON.parse(project.tags) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Admin: Delete project
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;
