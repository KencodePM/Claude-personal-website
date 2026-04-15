import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TestimonialStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  linkedinUrl: z.string().url().optional().nullable(),
  quote: z.string().min(1, 'Quote is required'),
  status: z.nativeEnum(TestimonialStatus).default(TestimonialStatus.DRAFT),
  sortOrder: z.number().int().default(0),
});

const testimonialUpdateSchema = testimonialSchema.partial();

// GET /api/testimonials (public: PUBLISHED only; admin: all)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const where = isAuthenticated ? {} : { status: TestimonialStatus.PUBLISHED };

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: testimonials });
  } catch (err) {
    next(err);
  }
});

// GET /api/testimonials/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: req.params.id },
    });

    if (!testimonial) {
      throw createError('Testimonial not found', 404);
    }

    res.json({ success: true, data: testimonial });
  } catch (err) {
    next(err);
  }
});

// POST /api/testimonials (admin)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = testimonialSchema.parse(req.body);
    const testimonial = await prisma.testimonial.create({ data });
    res.status(201).json({ success: true, data: testimonial });
  } catch (err) {
    next(err);
  }
});

// PUT /api/testimonials/:id (admin)
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = testimonialUpdateSchema.parse(req.body);

    const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Testimonial not found', 404);
    }

    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: testimonial });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/testimonials/:id (admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Testimonial not found', 404);
    }

    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Testimonial deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
