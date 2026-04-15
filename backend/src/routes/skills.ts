import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const skillSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  sortOrder: z.number().int().default(0),
});

const skillUpdateSchema = skillSchema.partial();

const skillCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sortOrder: z.number().int().default(0),
});

// GET /api/skills (public) - grouped by category
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [skills, categories] = await Promise.all([
      prisma.skill.findMany({
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.skillCategory.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Group skills by category
    const grouped = categories.map((cat) => ({
      ...cat,
      skills: skills.filter((s) => s.category === cat.name),
    }));

    // Include skills from categories not in skill_categories table
    const knownCategories = new Set(categories.map((c) => c.name));
    const ungroupedSkills = skills.filter((s) => !knownCategories.has(s.category));
    const ungroupedCategories = [...new Set(ungroupedSkills.map((s) => s.category))];

    ungroupedCategories.forEach((catName) => {
      grouped.push({
        id: catName,
        name: catName,
        sortOrder: 999,
        skills: ungroupedSkills.filter((s) => s.category === catName),
      });
    });

    res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await prisma.skill.findUnique({ where: { id: req.params.id } });
    if (!skill) {
      throw createError('Skill not found', 404);
    }
    res.json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

// POST /api/skills (admin)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = skillSchema.parse(req.body);
    const skill = await prisma.skill.create({ data });
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

// PUT /api/skills/:id (admin)
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = skillUpdateSchema.parse(req.body);

    const existing = await prisma.skill.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Skill not found', 404);
    }

    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/skills/:id (admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.skill.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Skill not found', 404);
    }

    await prisma.skill.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Skill deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/skill-categories (public)
router.get('/categories/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.skillCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// POST /api/skill-categories (admin)
router.post('/categories', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = skillCategorySchema.parse(req.body);
    const category = await prisma.skillCategory.create({ data });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/skill-categories/:id (admin)
router.delete('/categories/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.skillCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Skill category not found', 404);
    }

    await prisma.skillCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Skill category deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
