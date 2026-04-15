import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const experienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  startDate: z.string().transform((d) => new Date(d)),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((d) => (d ? new Date(d) : null)),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

const experienceUpdateSchema = z.object({
  jobTitle: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  startDate: z
    .string()
    .optional()
    .transform((d) => (d ? new Date(d) : undefined)),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((d) => (d ? new Date(d) : null)),
  isCurrent: z.boolean().optional(),
  bullets: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/experience (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'desc' }],
    });
    res.json({ success: true, data: experiences });
  } catch (err) {
    next(err);
  }
});

// GET /api/experience/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const experience = await prisma.experience.findUnique({
      where: { id: req.params.id },
    });

    if (!experience) {
      throw createError('Experience not found', 404);
    }

    res.json({ success: true, data: experience });
  } catch (err) {
    next(err);
  }
});

// POST /api/experience (admin)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = experienceSchema.parse(req.body);
    const experience = await prisma.experience.create({ data });
    res.status(201).json({ success: true, data: experience });
  } catch (err) {
    next(err);
  }
});

// PUT /api/experience/:id (admin)
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = experienceUpdateSchema.parse(req.body);

    const existing = await prisma.experience.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Experience not found', 404);
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ success: true, data: experience });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/experience/:id (admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.experience.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Experience not found', 404);
    }

    await prisma.experience.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Experience deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
