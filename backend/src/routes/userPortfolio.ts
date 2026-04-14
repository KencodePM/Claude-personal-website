import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireUserAuth } from '../middleware/userAuth';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(requireUserAuth);

const portfolioUpdateSchema = z.object({
  isPublished: z.boolean().optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
});

const sectionSchema = z.object({
  type: z.enum(['HERO', 'ABOUT', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'EDUCATION', 'CONTACT']),
  order: z.number().int().min(0),
  isVisible: z.boolean(),
  data: z.record(z.unknown()),
});

const meUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// GET /api/user/me
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.portfolioUser.findUnique({
      where: { id: req.portfolioUser!.userId },
      select: { id: true, email: true, username: true, displayName: true, createdAt: true },
    });
    if (!user) throw createError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/me
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, currentPassword, newPassword } = meUpdateSchema.parse(req.body);
    const updateData: { displayName?: string; passwordHash?: string } = {};

    if (displayName) updateData.displayName = displayName;

    if (currentPassword && newPassword) {
      const bcrypt = await import('bcryptjs');
      const user = await prisma.portfolioUser.findUnique({ where: { id: req.portfolioUser!.userId } });
      if (!user) throw createError('User not found', 404);
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw createError('Current password is incorrect', 401);
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.portfolioUser.update({
      where: { id: req.portfolioUser!.userId },
      data: updateData,
      select: { id: true, email: true, username: true, displayName: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/user/portfolio
router.get('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.portfolioUser!.userId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!portfolio) throw createError('Portfolio not found', 404);
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/portfolio
router.put('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = portfolioUpdateSchema.parse(req.body);
    const portfolio = await prisma.portfolio.update({
      where: { userId: req.portfolioUser!.userId },
      data,
    });
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/portfolio/sections
router.put('/portfolio/sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = z.array(sectionSchema).parse(req.body);

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.portfolioUser!.userId },
    });
    if (!portfolio) throw createError('Portfolio not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.portfolioSection.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.portfolioSection.createMany({
        data: sections.map((s) => ({
          portfolioId: portfolio.id,
          type: s.type,
          order: s.order,
          isVisible: s.isVisible,
          data: s.data,
        })),
      });
      return tx.portfolio.findUnique({
        where: { id: portfolio.id },
        include: { sections: { orderBy: { order: 'asc' } } },
      });
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
