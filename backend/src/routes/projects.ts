import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  briefDesc: z.string().min(1, 'Brief description is required'),
  caseStudyBody: z.string().min(1, 'Case study body is required'),
  tags: z.array(z.string()).default([]),
  impact: z.string().min(1, 'Impact is required'),
  year: z.number().int().min(2000).max(2100),
  imageUrl: z.string().optional().nullable(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.DRAFT),
  sortOrder: z.number().int().default(0),
});

const projectUpdateSchema = projectSchema.partial();

const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
  status: z.nativeEnum(ProjectStatus).optional(),
});

// GET /api/projects (public: PUBLISHED only; admin: all)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    let isAuthenticated = false;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const { env } = await import('../config/env');
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          jwt.default.verify(token, env.JWT_SECRET);
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    const where = isAuthenticated
      ? status ? { status } : {}
      : { status: ProjectStatus.PUBLISHED };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    let isAuthenticated = false;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const { env } = await import('../config/env');
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          jwt.default.verify(token, env.JWT_SECRET);
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated && project.status !== ProjectStatus.PUBLISHED) {
      throw createError('Project not found', 404);
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects (admin)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({ data });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id (admin)
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = projectUpdateSchema.parse(req.body);

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Project not found', 404);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id/status (admin)
router.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(ProjectStatus) }).parse(req.body);

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Project not found', 404);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id (admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Project not found', 404);
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Project deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
